import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

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
    const { password, fullName, identifier } = await request.json();

    if (!password || !fullName || !identifier) {
      return NextResponse.json({ error: 'All fields (Full Name, Email/Phone Number, Password) are required.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier.toLowerCase() : null;
    const phoneNumber = isEmail ? null : identifier;

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 });
      }
    }

    if (phoneNumber) {
      const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
      if (existingPhone) {
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        passwordHash,
        fullName,
        email,
        phoneNumber,
        role: 'ADMIN',
      },
    });

    const username = user.email || user.phoneNumber;

    if (!username) {
      return NextResponse.json({ error: 'User identifier is missing.' }, { status: 500 });
    }

    const token = signToken({
      id: user.id,
      username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Account created successfully.',
      user: { id: user.id, identifier: username, role: user.role },
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
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
