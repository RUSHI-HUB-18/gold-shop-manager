import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
}

const otps = globalThis.otpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.otpStore = otps;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special symbol.';
  return null;
}

export async function POST(request: Request) {
  try {
    const { action, identifier, otp, newPassword } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim();

    // Find user by either email or phoneNumber
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedIdentifier.toLowerCase() },
          { phoneNumber: trimmedIdentifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'No account registered with this email or phone number.' }, { status: 404 });
    }

    // Use user ID as the key for OTP map to prevent issues if identifier format varies
    const key = user.id;

    if (action === 'send-otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      otps.set(key, { otp: generatedOtp, expires });

      console.log('\n=============================================');
      console.log(`🔐 OTP REQUEST FOR: ${user.email} (${user.phoneNumber})`);
      console.log(`🔑 SECURE OTP CODE: ${generatedOtp}`);
      console.log('=============================================\n');

      return NextResponse.json({ 
        message: 'OTP code generated successfully!',
        otp: generatedOtp, // Expose OTP in JSON response for easy local testing in UI
        devNotice: 'Check the terminal console or copy the code shown in the green notification box.'
      });
    }

    if (action === 'reset-password') {
      if (!otp || !newPassword) {
        return NextResponse.json({ error: 'OTP and new password are required.' }, { status: 400 });
      }

      const stored = otps.get(key);
      if (!stored) {
        return NextResponse.json({ error: 'OTP has expired or not requested. Please request a new OTP.' }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otps.delete(key);
        return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      if (stored.otp !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid OTP code. Please try again.' }, { status: 400 });
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      otps.delete(key);

      return NextResponse.json({ message: 'Password reset successful! You can now log in.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
