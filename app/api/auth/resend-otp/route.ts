import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetOtps, otpAttempts } from '@/lib/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { emailService } from '@/lib/email';
import { otpService } from '@/lib/otp';
import { sanitizeInput, createErrorResponse, isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new Error('INVALID_JSON');
    });
    
    const email = sanitizeInput(body.email, 254);
    const clientIP = otpService.getClientIP(request);
    const userAgent = otpService.getUserAgent(request);

    // Validate input
    if (!email) {
      return NextResponse.json(
        createErrorResponse('Email is required', 'MISSING_EMAIL'),
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createErrorResponse('Please enter a valid email address', 'INVALID_EMAIL'),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting
    const rateLimitCheck = await db.transaction(async (tx) => {
      const [existingAttempt] = await tx
        .select()
        .from(otpAttempts)
        .where(and(
          eq(otpAttempts.email, normalizedEmail),
          eq(otpAttempts.ip_address, clientIP)
        ))
        .orderBy(desc(otpAttempts.last_attempt))
        .limit(1);

      if (existingAttempt?.blocked_until && otpService.isBlocked(existingAttempt.blocked_until)) {
        const remainingTime = otpService.getRemainingBlockTime(existingAttempt.blocked_until);
        throw new Error(`RATE_LIMITED:${remainingTime}`);
      }

      return existingAttempt;
    });

    // Check if user exists and generate new OTP
    let emailSent = false;
    let otpGenerated = false;

    const otpResult = await db.transaction(async (tx) => {
      // Check if user exists
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (user?.status === 'Active') {
        // Invalidate existing OTPs
        await tx
          .update(passwordResetOtps)
          .set({ used: true, used_at: new Date().toISOString() })
          .where(and(
            eq(passwordResetOtps.email, normalizedEmail),
            eq(passwordResetOtps.used, false)
          ));

        // Generate new OTP
        const otp = otpService.generateOTP();
        const expiryTime = otpService.generateExpiryTime();

        // Store new OTP
        await tx.insert(passwordResetOtps).values({
          email: normalizedEmail,
          otp: otpService.hashOTP(otp),
          expires_at: expiryTime,
          ip_address: clientIP,
          user_agent: userAgent,
        });

        otpGenerated = true;
        return { otp, userExists: true };
      }

      return { otp: null, userExists: false };
    });

    // Send email outside of database transaction
    if (otpResult.userExists && otpResult.otp) {
      try {
        const emailResult = await emailService.sendOTPEmail(normalizedEmail, otpResult.otp);
        emailSent = emailResult.success;
      } catch (emailError) {
        // Silent fail - email errors are handled by service
      }
    }

    // Development fallback
    if (process.env.NODE_ENV === 'development' && otpResult.otp) {
      emailSent = true;
    }

    // Update rate limiting
    await db.transaction(async (tx) => {
      if (rateLimitCheck) {
        await tx
          .update(otpAttempts)
          .set({
            attempts: (rateLimitCheck.attempts ?? 0) + 1,
            last_attempt: new Date().toISOString(),
          })
          .where(eq(otpAttempts.id, rateLimitCheck.id));
      } else {
        await tx.insert(otpAttempts).values({
          email: normalizedEmail,
          ip_address: clientIP,
          attempts: 1,
        });
      }
    });

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a new OTP has been sent.',
      processingTime: Date.now() - startTime,
    });

  } catch (error: any) {
    if (error.message === 'INVALID_JSON') {
      return NextResponse.json(
        createErrorResponse('Invalid request format', 'INVALID_JSON'),
        { status: 400 }
      );
    }

    if (error.message?.startsWith('RATE_LIMITED:')) {
      const remainingTime = error.message.split(':')[1];
      return NextResponse.json(
        createErrorResponse(
          `Too many attempts. Please try again in ${remainingTime} minutes.`,
          'RATE_LIMITED',
          { remainingTime: parseInt(remainingTime) }
        ),
        { status: 429 }
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