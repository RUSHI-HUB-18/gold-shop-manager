import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: 'asc' }
        },
        customer: {
          select: { fullName: true, customerCode: true, mobileNumber: true }
        },
        user: {
          select: { fullName: true }
        }
      }
    });

    if (!bill) {
      return NextResponse.json({ success: false, error: 'Bill not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, bill });
  } catch (error: any) {
    console.error('Bill GET id error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
