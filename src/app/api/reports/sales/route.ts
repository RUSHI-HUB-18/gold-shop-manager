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
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day' | 'week' | 'month'

    // Default to last 30 days if date bounds are omitted
    const end = endDateParam ? new Date(endDateParam) : new Date();
    const start = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Calculate length of current period in milliseconds to determine comparison period
    const periodDuration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(start.getTime() - periodDuration);

    // 1. Fetch current period bills
    const currentBills = await prisma.bill.findMany({
      where: {
        invoiceDate: { gte: start, lte: end },
        status: 'COMPLETED'
      },
      include: { items: true }
    });

    // 2. Fetch previous period bills for comparisons
    const previousBills = await prisma.bill.findMany({
      where: {
        invoiceDate: { gte: prevStart, lte: prevEnd },
        status: 'COMPLETED'
      },
      include: { items: true }
    });

    // Calculations helper for bills aggregation summaries
    const calculateTotals = (billsList: typeof currentBills) => {
      let grandTotal = 0;
      let subtotal = 0;
      let discountAmount = 0;
      let gstAmount = 0;
      let taxableAmount = 0;
      let goldValue = 0;
      let makingCharges = 0;
      let hallmarkCharges = 0;

      for (const bill of billsList) {
        grandTotal += Number(bill.total);
        subtotal += Number(bill.subtotal);
        discountAmount += Number(bill.discountAmount);
        gstAmount += Number(bill.gstAmount);
        taxableAmount += Number(bill.taxableAmount);

        for (const item of bill.items) {
          const qty = item.quantity || 1;
          const netWt = Number(item.netWeight);
          const rate = Number(item.goldRate);
          goldValue += netWt * rate * qty;
          makingCharges += Number(item.makingChargeAmount);
          hallmarkCharges += Number(item.hallmarkCharge);
        }
      }

      return {
        grandTotal,
        subtotal,
        discountAmount,
        gstAmount,
        taxableAmount,
        goldValue,
        makingCharges,
        hallmarkCharges,
        count: billsList.length,
        averageBill: billsList.length > 0 ? (grandTotal / billsList.length) : 0
      };
    };

    const currentTotals = calculateTotals(currentBills);
    const previousTotals = calculateTotals(previousBills);

    // Compute percentage increases/decreases vs previous periods
    const getComparisonPercent = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const comparisons = {
      totalSalesDiff: getComparisonPercent(currentTotals.grandTotal, previousTotals.grandTotal),
      invoicesCountDiff: getComparisonPercent(currentTotals.count, previousTotals.count),
      gstCollectedDiff: getComparisonPercent(currentTotals.gstAmount, previousTotals.gstAmount),
      avgBillDiff: getComparisonPercent(currentTotals.averageBill, previousTotals.averageBill)
    };

    // 3. Aggregate trend line points by groupBy parameter settings
    const trendMap = new Map<string, number>();

    // Pre-populate trend labels range keys to include empty days/weeks/months
    let currentMarker = new Date(start.getTime());
    while (currentMarker <= end) {
      let key = '';
      if (groupBy === 'month') {
        key = `${currentMarker.getFullYear()}-${(currentMarker.getMonth() + 1).toString().padStart(2, '0')}`;
        // Advance 1 month
        currentMarker.setMonth(currentMarker.getMonth() + 1);
      } else if (groupBy === 'week') {
        // Find start of week day
        const day = currentMarker.getDay();
        const diff = currentMarker.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const startOfWeek = new Date(currentMarker.setDate(diff));
        key = `${startOfWeek.getFullYear()}-W${Math.ceil(startOfWeek.getDate() / 7)}`;
        // Advance 7 days
        currentMarker.setDate(currentMarker.getDate() + 7);
      } else {
        key = currentMarker.toISOString().slice(0, 10);
        // Advance 1 day
        currentMarker.setDate(currentMarker.getDate() + 1);
      }
      trendMap.set(key, 0);
    }

    // Sum matching invoice totals inside trend buckets
    for (const bill of currentBills) {
      const date = new Date(bill.invoiceDate);
      let key = '';
      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));
        key = `${startOfWeek.getFullYear()}-W${Math.ceil(startOfWeek.getDate() / 7)}`;
      } else {
        key = date.toISOString().slice(0, 10);
      }

      if (trendMap.has(key)) {
        trendMap.set(key, trendMap.get(key)! + Number(bill.total));
      } else {
        trendMap.set(key, Number(bill.total));
      }
    }

    const trend = Array.from(trendMap.entries()).map(([label, sales]) => ({
      label,
      sales: parseFloat(sales.toFixed(2))
    })).sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({
      success: true,
      totals: {
        grandTotal: parseFloat(currentTotals.grandTotal.toFixed(2)),
        subtotal: parseFloat(currentTotals.subtotal.toFixed(2)),
        discountAmount: parseFloat(currentTotals.discountAmount.toFixed(2)),
        gstAmount: parseFloat(currentTotals.gstAmount.toFixed(2)),
        taxableAmount: parseFloat(currentTotals.taxableAmount.toFixed(2)),
        goldValue: parseFloat(currentTotals.goldValue.toFixed(2)),
        makingCharges: parseFloat(currentTotals.makingCharges.toFixed(2)),
        hallmarkCharges: parseFloat(currentTotals.hallmarkCharges.toFixed(2)),
        count: currentTotals.count,
        averageBill: parseFloat(currentTotals.averageBill.toFixed(2))
      },
      comparisons,
      trend
    });

  } catch (error: any) {
    console.error('Reports Sales GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
