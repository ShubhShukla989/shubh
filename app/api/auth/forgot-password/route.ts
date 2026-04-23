import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetOtps, otpAttempts } from '@/lib/schema/users';
import { eq } from 'drizzle-orm';
import { otpService } from '@/lib/otp';
import { emailService } from '@/lib/email';
import { sanitizeInput, isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new Error('INVALID_JSON');
    });

    // 🔒 SECURITY: Validate and sanitize input
    const rawEmail = body.email;
    
    if (!rawEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const email = sanitizeInput(rawEmail, 254).toLowerCase();
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, an OTP has been sent.',
        success: true
      });
    }

    // 🔒 SECURITY: Enhanced rate limiting with IP tracking
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = sanitizeInput(request.headers.get('user-agent') || 'unknown', 500);
    
    const existingAttempt = await db.select()
      .from(otpAttempts)
      .where(eq(otpAttempts.email, email))
      .limit(1);

    if (existingAttempt.length > 0) {
      const attempt = existingAttempt[0];
      if (attempt.blocked_until && new Date(attempt.blocked_until) > new Date()) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    const hashedOTP = otpService.hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this email
    await db.delete(passwordResetOtps)
      .where(eq(passwordResetOtps.email, email));

    // Insert new OTP (store hashed version)
    await db.insert(passwordResetOtps)
      .values({
        email,
        otp: hashedOTP,
        expires_at: expiresAt.toISOString(),
        used: false,
        ip_address: clientIP,
        user_agent: userAgent
      });

    // Update or insert attempt record
    if (existingAttempt.length > 0) {
      await db.update(otpAttempts)
        .set({
          attempts: 1,
          blocked_until: null,
          ip_address: clientIP,
          last_attempt: new Date().toISOString()
        })
        .where(eq(otpAttempts.email, email));
    } else {
      await db.insert(otpAttempts)
        .values({
          email,
          attempts: 1,
          ip_address: clientIP
        });
    }

    // Send email (async operation)
    try {
      await emailService.sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway - OTP is saved in database
    }

    // Development mode - log OTP to console (only for the specific user)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 OTP sent to ${email}: ${otp}`);
    }

    return NextResponse.json({
      message: 'If an account with that email exists, an OTP has been sent.',
      success: true
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    console.error('Forgot password security error:', error);
    
    // 🔒 SECURITY: Don't leak sensitive error information
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}