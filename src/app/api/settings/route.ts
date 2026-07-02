import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findFirst();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { gstPercentage } = await request.json();
    
    if (gstPercentage === undefined) {
      return NextResponse.json({ error: 'GST percentage is required' }, { status: 400 });
    }

    // Since there's only one settings record, find the first and update, or create if missing
    const existing = await prisma.systemSettings.findFirst();

    if (existing) {
      const updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: { gstPercentage: parseFloat(gstPercentage) }
      });
      return NextResponse.json({ message: 'Settings updated', settings: updated });
    } else {
      const created = await prisma.systemSettings.create({
        data: { gstPercentage: parseFloat(gstPercentage) }
      });
      return NextResponse.json({ message: 'Settings initialized', settings: created });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
