import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: 'Email/Phone and password are required.', message: 'Email/Phone and password are required.' }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    let user = null;

    if (emailRegex.test(trimmedIdentifier)) {
      const email = trimmedIdentifier.toLowerCase();
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phoneRegex.test(trimmedIdentifier)) {
      const phoneNumber = trimmedIdentifier;
      user = await prisma.user.findUnique({ where: { phoneNumber } });
    } else {
      return NextResponse.json({ success: false, error: 'Please enter a valid Email Address or Mobile Number.', message: 'Please enter a valid Email Address or Mobile Number.' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid Email Address or Mobile Number.', message: 'Invalid Email Address or Mobile Number.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid Email Address or Mobile Number.', message: 'Invalid Email Address or Mobile Number.' }, { status: 401 });
    }

    // Pass email or phone number as username parameter to match signToken type definition
    const token = signToken({
      id: user.id,
      username: user.email ?? user.phoneNumber ?? 'user',
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', message: 'Internal server error' }, { status: 500 });
  }
}
