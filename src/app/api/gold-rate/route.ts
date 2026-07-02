import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
    return NextResponse.json({ error: 'Failed to fetch gold rate' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
        updatedBy: updatedBy || 'Admin'
      },
      create: {
        date: today,
        rate22K: parseFloat(rate22K),
        rate24K: rate24K ? parseFloat(rate24K) : null,
        updatedBy: updatedBy || 'Admin'
      }
    });

    return NextResponse.json({ message: 'Gold rate updated successfully', goldRate });
  } catch (error) {
    console.error('Error updating gold rate:', error);
    return NextResponse.json({ error: 'Failed to update gold rate' }, { status: 500 });
  }
}
