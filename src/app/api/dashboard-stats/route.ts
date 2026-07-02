import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the start of the current day in UTC robustly
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // 1. Get today's gold rate
    const goldRate = await prisma.goldRate.findFirst({
      where: {
        date: today
      }
    });

    // 2. Count calculations made today
    const calculationsCount = await prisma.calculationHistory.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // 3. Count active items
    const activeItemsCount = await prisma.itemMaster.count({
      where: {
        isActive: true
      }
    });

    return NextResponse.json({
      rate22K: goldRate ? goldRate.rate22K : 0,
      lastUpdated: goldRate ? goldRate.updatedAt : null,
      updatedBy: goldRate ? goldRate.updatedBy : null,
      calculationsCount,
      activeItemsCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
