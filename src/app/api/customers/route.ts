import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';
import { validateEmail, validatePhone } from '@/utils/validation';

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { customerCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } }
      ];
    }

    if (status === 'ACTIVE' || status === 'INACTIVE') {
      whereClause.status = status;
    }

    // Get paginated and filtered list
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { customerCode: 'asc' },
      skip,
      take: limit,
    });

    const totalFiltered = await prisma.customer.count({ where: whereClause });

    // Summary Statistics calculations
    const totalCount = await prisma.customer.count();
    const activeCount = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const inactiveCount = await prisma.customer.count({ where: { status: 'INACTIVE' } });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonthCount = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        newThisMonth: newThisMonthCount
      }
    });
  } catch (error: any) {
    console.error('Customers GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuthentication();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    // Concurrency-safe Code Generation retry loop
    let attempts = 0;
    let createdCustomer = null;
    let lastError = null;

    while (attempts < 5) {
      try {
        const lastCustomer = await prisma.customer.findFirst({
          orderBy: { customerCode: 'desc' },
        });

        let nextNumber = 1;
        if (lastCustomer && lastCustomer.customerCode) {
          const match = lastCustomer.customerCode.match(/CUS-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        const customerCode = `CUS-${nextNumber.toString().padStart(4, '0')}`;

        createdCustomer = await prisma.customer.create({
          data: {
            customerCode,
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
            status: 'ACTIVE'
          }
        });
        break;
      } catch (dbError: any) {
        lastError = dbError;
        if (dbError.code === 'P2002') {
          const targets = dbError.meta?.target || [];
          const errorMessage = dbError.message || '';
          
          const isCodeConflict = targets.includes('customerCode') || errorMessage.includes('customerCode');
          
          if (isCodeConflict) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 50));
            continue; // Retry generation
          }

          // Return immediately if it's phone/email/GST uniqueness conflicts
          if (targets.includes('mobileNumber') || errorMessage.includes('mobileNumber')) {
            return NextResponse.json({ success: false, error: 'Mobile Number is already registered.' }, { status: 400 });
          }
          if (targets.includes('email') || errorMessage.includes('email')) {
            return NextResponse.json({ success: false, error: 'Email Address is already registered.' }, { status: 400 });
          }
          if (targets.includes('gstNumber') || errorMessage.includes('gstNumber')) {
            return NextResponse.json({ success: false, error: 'GST Number is already registered.' }, { status: 400 });
          }
        }
        throw dbError; // Rethrow other database exceptions
      }
    }

    if (!createdCustomer) {
      console.error('Failed to generate safe customer code after 5 attempts:', lastError);
      return NextResponse.json({ success: false, error: 'Failed to assign a unique Customer Code. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer registered successfully.',
      customer: createdCustomer
    });
  } catch (error: any) {
    console.error('Customers POST error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
