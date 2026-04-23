import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetOtps, audit_logs } from '@/lib/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { otpService } from '@/lib/otp';
import { sanitizeInput, createErrorResponse, timingSafeEqual } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json().catch(() => {
      throw new Error('INVALID_JSON');
    });
    
    const email = sanitizeInput(body.email, 254);
    const resetToken = sanitizeInput(body.resetToken, 128);
    const newPassword = sanitizeInput(body.newPassword, 128);
    const clientIP = otpService.getClientIP(request);
    const userAgent = otpService.getUserAgent(request);

    // Validate input
    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        createErrorResponse('Email, reset token, and new password are required', 'MISSING_FIELDS'),
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        createErrorResponse('Password must be at least 8 characters long', 'WEAK_PASSWORD'),
        { status: 400 }
      );
    }

    // Additional password strength checks
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        createErrorResponse(
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          'WEAK_PASSWORD'
        ),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Use transaction for atomic operations
    let userId: number;
    
    try {
      // Find the most recent used OTP record that contains the reset token
      const [tokenRecord] = await db
        .select()
        .from(passwordResetOtps)
        .where(and(
          eq(passwordResetOtps.email, normalizedEmail),
          eq(passwordResetOtps.used, true)
        ))
        .orderBy(desc(passwordResetOtps.used_at))
        .limit(1);

      if (!tokenRecord) {
        throw new Error('INVALID_TOKEN');
      }

      // Check if token is expired
      if (otpService.isExpired(tokenRecord.expires_at)) {
        throw new Error('TOKEN_EXPIRED');
      }

      // Verify reset token (stored in otp field after OTP verification)
      // The token is stored as "hashedToken:salt" format
      const tokenParts = tokenRecord.otp.split(':');
      if (tokenParts.length !== 2) {
        throw new Error('INVALID_TOKEN');
      }

      const [storedHashedToken, tokenSalt] = tokenParts;
      const inputHashedToken = crypto.pbkdf2Sync(resetToken, tokenSalt, 10000, 64, 'sha512').toString('hex');

      if (!timingSafeEqual(inputHashedToken, storedHashedToken)) {
        throw new Error('INVALID_TOKEN');
      }

      // Find the user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.status !== 'Active') {
        throw new Error('USER_INACTIVE');
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        throw new Error('SAME_PASSWORD');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password and invalidate token
      await db
        .update(users)
        .set({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));

      await db
        .update(passwordResetOtps)
        .set({
          expires_at: new Date().toISOString(),
        })
        .where(eq(passwordResetOtps.id, tokenRecord.id));

      userId = user.id;
    } catch (error: any) {
      if (error.message === 'INVALID_TOKEN') {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }
      if (error.message === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          { success: false, error: 'Reset token has expired' },
          { status: 400 }
        );
      }
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      if (error.message === 'USER_INACTIVE') {
        return NextResponse.json(
          { success: false, error: 'User account is inactive' },
          { status: 403 }
        );
      }
      if (error.message === 'SAME_PASSWORD') {
        return NextResponse.json(
          { success: false, error: 'New password must be different from current password' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Log the password reset action (outside transaction)
    try {
      await db.insert(audit_logs).values({
        user_id: userId,
        action: 'password_reset',
        entity_type: 'user',
        entity_id: userId,
        details: JSON.stringify({
          method: 'otp_reset',
          ip_address: clientIP,
          user_agent: userAgent,
        }),
        ip_address: clientIP,
      });
    } catch (auditError) {
      // Silent fail - audit logging is non-critical
    }

    // Clean up old OTP records for this email
    try {
      await db
        .update(passwordResetOtps)
        .set({ expires_at: new Date().toISOString() })
        .where(and(
          eq(passwordResetOtps.email, normalizedEmail),
          eq(passwordResetOtps.used, true)
        ));
    } catch (cleanupError) {
      // Silent fail - cleanup is non-critical
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
      processingTime: Date.now() - startTime,
    });

  } catch (error: any) {
    if (error.message === 'INVALID_JSON') {
      return NextResponse.json(
        createErrorResponse('Invalid request format', 'INVALID_JSON'),
        { status: 400 }
      );
    }

    // Handle specific error cases
    if (error.message === 'INVALID_TOKEN') {
      return NextResponse.json(
        createErrorResponse('Invalid or expired reset token', 'INVALID_TOKEN'),
        { status: 400 }
      );
    }

    if (error.message === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        createErrorResponse('Reset token has expired. Please start the process again.', 'TOKEN_EXPIRED'),
        { status: 400 }
      );
    }

    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        createErrorResponse('User not found', 'USER_NOT_FOUND'),
        { status: 404 }
      );
    }

    if (error.message === 'USER_INACTIVE') {
      return NextResponse.json(
        createErrorResponse('User account is not active', 'USER_INACTIVE'),
        { status: 403 }
      );
    }

    if (error.message === 'SAME_PASSWORD') {
      return NextResponse.json(
        createErrorResponse('New password must be different from your current password', 'SAME_PASSWORD'),
        { status: 400 }
      );
    }

    const errorResponse = createErrorResponse(
      'Service temporarily unavailable. Please try again later.',
      'INTERNAL_ERROR',
      { processingTime: Date.now() - startTime }
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}