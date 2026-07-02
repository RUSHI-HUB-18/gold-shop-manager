import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.itemMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch items', message: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, defaultMakingCharge } = await request.json();
    
    if (!name || defaultMakingCharge === undefined) {
      return NextResponse.json({ success: false, error: 'Name and making charge are required', message: 'Name and making charge are required' }, { status: 400 });
    }

    const item = await prisma.itemMaster.create({
      data: {
        name,
        defaultMakingCharge: parseFloat(defaultMakingCharge)
      }
    });

    return NextResponse.json({ success: true, message: 'Item created', item });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create item', message: 'Failed to create item' }, { status: 500 });
  }
}
