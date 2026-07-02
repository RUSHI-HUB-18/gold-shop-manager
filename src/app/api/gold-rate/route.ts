import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get the start of the current day in UTC robustly
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const goldRate = await prisma.goldRate.findFirst({
      where: {
        date: today
      }
    });

    return NextResponse.json({ goldRate });
  } catch (error) {
    console.error('Error fetching gold rate:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch gold rate', message: 'Failed to fetch gold rate' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { rate22K, rate24K, updatedBy } = await request.json();
    
    if (!rate22K) {
      return NextResponse.json({ error: '22K rate is required' }, { status: 400 });
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Upsert the gold rate for today
    const goldRate = await prisma.goldRate.upsert({
      where: {
        date: today
      },
      update: {
        rate22K: parseFloat(rate22K),
        rate24K: rate24K ? parseFloat(rate24K) : null,
        updatedBy: user.username
      },
      create: {
        date: today,
        rate22K: parseFloat(rate22K),
        rate24K: rate24K ? parseFloat(rate24K) : null,
        updatedBy: user.username
      }
    });

    return NextResponse.json({ success: true, message: 'Gold rate updated successfully', goldRate });
  } catch (error) {
    console.error('Error updating gold rate:', error);
    return NextResponse.json({ success: false, error: 'Failed to update gold rate', message: 'Failed to update gold rate' }, { status: 500 });
  }
}
