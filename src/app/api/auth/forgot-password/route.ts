import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validatePassword, validateEmail, validatePhone } from '@/utils/validation';
import { logger } from '@/utils/logger';

declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
}

const otps = globalThis.otpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.otpStore = otps;
}

export async function POST(request: Request) {
  try {
    const { action, identifier, otp, newPassword } = await request.json();

    const trimmedIdentifier = typeof identifier === 'string' ? identifier.trim() : '';

    if (!trimmedIdentifier) {
      return NextResponse.json({ success: false, error: 'Email or Mobile Number is required.', message: 'Email or Mobile Number is required.' }, { status: 400 });
    }

    let user = null;

    if (validateEmail(trimmedIdentifier)) {
      const email = trimmedIdentifier.toLowerCase();
      user = await prisma.user.findUnique({ where: { email } });
    } else if (validatePhone(trimmedIdentifier)) {
      const phoneNumber = trimmedIdentifier;
      user = await prisma.user.findUnique({ where: { phoneNumber } });
    } else {
      return NextResponse.json({ success: false, error: 'Please enter a valid Email Address or Mobile Number.', message: 'Please enter a valid Email Address or Mobile Number.' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account registered with this email or phone number.', message: 'No account registered with this email or phone number.' }, { status: 404 });
    }

    // Use user ID as the key for OTP map to prevent issues if identifier format varies
    const key = user.id;

    if (action === 'send-otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      otps.set(key, { otp: generatedOtp, expires });

      logger.otp('\n=============================================');
      logger.otp(`🔐 OTP REQUEST FOR: ${user.email} (${user.phoneNumber})`);
      logger.otp(`🔑 SECURE OTP CODE: ${generatedOtp}`);
      logger.otp('=============================================\n');

      return NextResponse.json({ 
        message: 'OTP code generated successfully!',
        devNotice: 'Check the server console terminal for the secure OTP code.'
      });
    }

    if (action === 'reset-password') {
      if (!otp || !newPassword) {
        return NextResponse.json({ success: false, error: 'OTP and new password are required.', message: 'OTP and new password are required.' }, { status: 400 });
      }

      const stored = otps.get(key);
      if (!stored) {
        return NextResponse.json({ success: false, error: 'OTP has expired or not requested. Please request a new OTP.', message: 'OTP has expired or not requested. Please request a new OTP.' }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otps.delete(key);
        return NextResponse.json({ success: false, error: 'OTP has expired. Please request a new OTP.', message: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      if (stored.otp !== otp.trim()) {
        return NextResponse.json({ success: false, error: 'Invalid OTP code. Please try again.', message: 'Invalid OTP code. Please try again.' }, { status: 400 });
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ success: false, error: passwordError, message: passwordError }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      otps.delete(key);

      return NextResponse.json({ success: true, message: 'Password reset successful! You can now log in.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.', message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.', message: 'Internal server error.' }, { status: 500 });
  }
}
