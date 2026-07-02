import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.itemMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, defaultMakingCharge } = await request.json();
    
    if (!name || defaultMakingCharge === undefined) {
      return NextResponse.json({ error: 'Name and making charge are required' }, { status: 400 });
    }

    const item = await prisma.itemMaster.create({
      data: {
        name,
        defaultMakingCharge: parseFloat(defaultMakingCharge)
      }
    });

    return NextResponse.json({ message: 'Item created', item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
