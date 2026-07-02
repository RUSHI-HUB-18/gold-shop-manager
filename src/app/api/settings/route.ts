import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findFirst();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch settings', message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { gstPercentage } = await request.json();
    
    if (gstPercentage === undefined) {
      return NextResponse.json({ success: false, error: 'GST percentage is required', message: 'GST percentage is required' }, { status: 400 });
    }

    // Since there's only one settings record, find the first and update, or create if missing
    const existing = await prisma.systemSettings.findFirst();

    if (existing) {
      const updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: { gstPercentage: parseFloat(gstPercentage) }
      });
      return NextResponse.json({ success: true, message: 'Settings updated', settings: updated });
    } else {
      const created = await prisma.systemSettings.create({
        data: { gstPercentage: parseFloat(gstPercentage) }
      });
      return NextResponse.json({ success: true, message: 'Settings initialized', settings: created });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update settings', message: 'Failed to update settings' }, { status: 500 });
  }
}
