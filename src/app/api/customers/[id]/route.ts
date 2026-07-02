import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';
import { validateEmail, validatePhone } from '@/utils/validation';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        calculations: {
          orderBy: { createdAt: 'desc' },
          include: {
            item: { select: { name: true } },
            user: { select: { fullName: true } }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Customer GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthentication();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const mobileNumber = typeof body.mobileNumber === 'string' ? body.mobileNumber.trim() : '';
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const pincode = typeof body.pincode === 'string' ? body.pincode.trim() : '';
    const gstNumber = typeof body.gstNumber === 'string' ? body.gstNumber.trim().toUpperCase() : '';
    const birthDate = body.birthDate || null;
    const anniversary = body.anniversary || null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const status = body.status;

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Full Name is required.' }, { status: 400 });
    }

    if (!mobileNumber) {
      return NextResponse.json({ success: false, error: 'Mobile Number is required.' }, { status: 400 });
    }

    if (!validatePhone(mobileNumber)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit Mobile Number.' }, { status: 400 });
    }

    const email = rawEmail ? rawEmail.toLowerCase() : null;
    if (email && !validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid Email Address.' }, { status: 400 });
    }

    // Check customer exists
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    try {
      const updated = await prisma.customer.update({
        where: { id },
        data: {
          fullName,
          mobileNumber,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          gstNumber: gstNumber || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          anniversary: anniversary ? new Date(anniversary) : null,
          notes: notes || null,
          status: status || existing.status
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer updated successfully.',
        customer: updated
      });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        const targets = dbError.meta?.target || [];
        const errorMessage = dbError.message || '';
        if (targets.includes('mobileNumber') || errorMessage.includes('mobileNumber')) {
          return NextResponse.json({ success: false, error: 'Mobile Number is already registered by another customer.' }, { status: 400 });
        }
        if (targets.includes('email') || errorMessage.includes('email')) {
          return NextResponse.json({ success: false, error: 'Email Address is already registered by another customer.' }, { status: 400 });
        }
        if (targets.includes('gstNumber') || errorMessage.includes('gstNumber')) {
          return NextResponse.json({ success: false, error: 'GST Number is already registered by another customer.' }, { status: 400 });
        }
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Customer PUT error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthentication();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // Soft delete deactivation status change
    await prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully.'
    });
  } catch (error: any) {
    console.error('Customer DELETE error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
