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
    const body = await request.json();
    
    // Normalization & Trimming
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const rawPhone = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    const email = rawEmail ? rawEmail.toLowerCase() : null;
    const phoneNumber = rawPhone ? rawPhone : null;

    if (!fullName || !password) {
      return NextResponse.json({ success: false, error: 'Full Name and Password are required.', message: 'Full Name and Password are required.' }, { status: 400 });
    }

    if (!email && !phoneNumber) {
      return NextResponse.json({ success: false, error: 'Please enter either an Email Address or a Mobile Number.', message: 'Please enter either an Email Address or a Mobile Number.' }, { status: 400 });
    }

    // Email format validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: 'Please enter a valid Email Address.', message: 'Please enter a valid Email Address.' }, { status: 400 });
      }
    }

    // Phone format validation (Reject if contains spaces/formatting/non-digits)
    if (phoneNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit Mobile Number.', message: 'Please enter a valid 10-digit Mobile Number.' }, { status: 400 });
      }
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError, message: passwordError }, { status: 400 });
    }

    // Check existing records in the database
    let existingEmail = false;
    let existingPhone = false;

    if (email) {
      const match = await prisma.user.findUnique({ where: { email } });
      if (match) existingEmail = true;
    }

    if (phoneNumber) {
      const match = await prisma.user.findUnique({ where: { phoneNumber } });
      if (match) existingPhone = true;
    }

    if (existingEmail && existingPhone) {
      return NextResponse.json({ success: false, error: 'This Email and Mobile Number are already registered.', message: 'This Email and Mobile Number are already registered.' }, { status: 400 });
    }

    if (existingEmail) {
      return NextResponse.json({ success: false, error: 'Email is already registered.', message: 'Email is already registered.' }, { status: 400 });
    }

    if (existingPhone) {
      return NextResponse.json({ success: false, error: 'Mobile Number is already registered.', message: 'Mobile Number is already registered.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          passwordHash,
          fullName,
          email,
          phoneNumber,
          role: 'ADMIN',
        },
      });
    } catch (dbError: any) {
      // Gracefully handle unique constraint race conditions in database
      if (dbError.code === 'P2002') {
        const targets = dbError.meta?.target || [];
        const isEmailTarget = targets.includes('email') || (typeof dbError.message === 'string' && dbError.message.includes('email'));
        const isPhoneTarget = targets.includes('phoneNumber') || (typeof dbError.message === 'string' && dbError.message.includes('phoneNumber'));

        if (isEmailTarget && isPhoneTarget) {
          return NextResponse.json({ success: false, error: 'This Email and Mobile Number are already registered.', message: 'This Email and Mobile Number are already registered.' }, { status: 400 });
        } else if (isEmailTarget) {
          return NextResponse.json({ success: false, error: 'Email is already registered.', message: 'Email is already registered.' }, { status: 400 });
        } else if (isPhoneTarget) {
          return NextResponse.json({ success: false, error: 'Mobile Number is already registered.', message: 'Mobile Number is already registered.' }, { status: 400 });
        }
      }
      throw dbError; // Rethrow other database exceptions
    }

    const token = signToken({
      id: user.id,
      username: user.email ?? user.phoneNumber ?? 'user',
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: { id: user.id, identifier: user.email ?? user.phoneNumber ?? 'user', role: user.role },
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
    return NextResponse.json({ success: false, error: 'Internal server error. Please try again.', message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
