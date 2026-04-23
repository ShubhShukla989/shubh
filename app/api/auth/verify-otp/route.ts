import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { passwordResetOtps } from '@/lib/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { otpService } from '@/lib/otp';
import { sanitizeInput, createErrorResponse, timingSafeEqual } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new Error('INVALID_JSON');
    });
    
    const email = sanitizeInput(body.email, 254);
    const otp = sanitizeInput(body.otp, 10);
    const clientIP = otpService.getClientIP(request);

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        createErrorResponse('Email and OTP are required', 'MISSING_FIELDS'),
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!otpService.isValidFormat(otp)) {
      return NextResponse.json(
        createErrorResponse('Invalid OTP format. Please enter a 6-digit code.', 'INVALID_FORMAT'),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the most recent unused OTP for this email
    const [otpRecord] = await db
      .select()
      .from(passwordResetOtps)
      .where(and(
        eq(passwordResetOtps.email, normalizedEmail),
        eq(passwordResetOtps.used, false)
      ))
      .orderBy(desc(passwordResetOtps.created_at))
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        createErrorResponse('No valid OTP found. Please request a new one.', 'OTP_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (otpService.isExpired(otpRecord.expires_at)) {
      return NextResponse.json(
        createErrorResponse('OTP has expired. Please request a new one.', 'OTP_EXPIRED'),
        { status: 400 }
      );
    }

    // Check attempts limit
    const currentAttempts = otpRecord.attempts ?? 0;
    if (currentAttempts >= otpService.getMaxAttempts()) {
      return NextResponse.json(
        createErrorResponse('Too many failed attempts. Please request a new OTP.', 'TOO_MANY_ATTEMPTS'),
        { status: 429 }
      );
    }

    // Verify OTP using timing-safe comparison
    const hashedInputOTP = otpService.hashOTP(otp);
    const isValidOTP = timingSafeEqual(hashedInputOTP, otpRecord.otp);

    if (!isValidOTP) {
      // Increment attempts
      await db
        .update(passwordResetOtps)
        .set({ attempts: currentAttempts + 1 })
        .where(eq(passwordResetOtps.id, otpRecord.id));

      const remainingAttempts = otpService.getMaxAttempts() - (currentAttempts + 1);
      return NextResponse.json(
        createErrorResponse(
          `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          'INVALID_OTP',
          { remainingAttempts }
        ),
        { status: 400 }
      );
    }

    // Generate secure reset token with salt
    const resetToken = otpService.generateSecureToken();
    const tokenSalt = crypto.randomBytes(16).toString('hex');
    const hashedToken = crypto.pbkdf2Sync(resetToken, tokenSalt, 10000, 64, 'sha512').toString('hex');
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Mark OTP as used and create reset session
    await db
      .update(passwordResetOtps)
      .set({
        used: true,
        used_at: new Date().toISOString(),
        // Store token hash and salt separately (in production, use separate table)
        otp: `${hashedToken}:${tokenSalt}`,
        expires_at: tokenExpiry,
      })
      .where(eq(passwordResetOtps.id, otpRecord.id));

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresAt: tokenExpiry,
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
    if (error.message === 'OTP_NOT_FOUND') {
      return NextResponse.json(
        createErrorResponse('No valid OTP found. Please request a new one.', 'OTP_NOT_FOUND'),
        { status: 404 }
      );
    }

    if (error.message === 'OTP_EXPIRED') {
      return NextResponse.json(
        createErrorResponse('OTP has expired. Please request a new one.', 'OTP_EXPIRED'),
        { status: 400 }
      );
    }

    if (error.message === 'TOO_MANY_ATTEMPTS') {
      return NextResponse.json(
        createErrorResponse('Too many failed attempts. Please request a new OTP.', 'TOO_MANY_ATTEMPTS'),
        { status: 429 }
      );
    }

    if (error.message?.startsWith('INVALID_OTP:')) {
      const remainingAttempts = parseInt(error.message.split(':')[1]);
      return NextResponse.json(
        createErrorResponse(
          `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          'INVALID_OTP',
          { remainingAttempts }
        ),
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