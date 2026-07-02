import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days if date boundaries are empty
    const end = endDateParam ? new Date(endDateParam) : new Date();
    const start = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Retrieve items belonging to completed bills in selected range
    const items = await prisma.billItem.findMany({
      where: {
        bill: {
          invoiceDate: { gte: start, lte: end },
          status: 'COMPLETED'
        }
      },
      select: {
        itemNameSnapshot: true,
        quantity: true,
        netWeight: true,
        amount: true
      }
    });

    const itemSummaryMap = new Map<string, { quantity: number; weight: number; amount: number }>();

    for (const item of items) {
      const key = item.itemNameSnapshot.trim() || 'Unspecified Item';
      const qty = item.quantity || 1;
      const wt = Number(item.netWeight);
      const amt = Number(item.amount);

      if (itemSummaryMap.has(key)) {
        const existing = itemSummaryMap.get(key)!;
        itemSummaryMap.set(key, {
          quantity: existing.quantity + qty,
          weight: existing.weight + (wt * qty),
          amount: existing.amount + amt
        });
      } else {
        itemSummaryMap.set(key, {
          quantity: qty,
          weight: wt * qty,
          amount: amt
        });
      }
    }

    const itemsReport = Array.from(itemSummaryMap.entries()).map(([name, stats]) => ({
      itemName: name,
      quantitySold: stats.quantity,
      totalWeightSold: parseFloat(stats.weight.toFixed(3)),
      totalRevenue: parseFloat(stats.amount.toFixed(2))
    })).sort((a, b) => b.quantitySold - a.quantitySold); // Sorted by popular quantity sold

    return NextResponse.json({
      success: true,
      items: itemsReport
    });

  } catch (error: any) {
    console.error('Reports Items GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
