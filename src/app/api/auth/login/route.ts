import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required.' }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim();

    // Query user by email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedIdentifier.toLowerCase() },
          { phoneNumber: trimmedIdentifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email/phone or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email/phone or password.' }, { status: 401 });
    }

    // Pass email as username parameter to match signToken type definition
    const token = signToken({
      id: user.id,
      username: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
