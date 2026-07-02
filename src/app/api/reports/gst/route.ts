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

    // Retrieve bills with items in selected date bounds
    const bills = await prisma.bill.findMany({
      where: {
        invoiceDate: { gte: start, lte: end },
        status: 'COMPLETED'
      },
      orderBy: { invoiceDate: 'asc' }
    });

    let totalTaxableSales = 0;
    let totalGstCollected = 0;
    let totalGrandTotal = 0;

    const invoices = bills.map(bill => {
      const taxable = Number(bill.taxableAmount);
      const gst = Number(bill.gstAmount);
      const total = Number(bill.total);

      totalTaxableSales += taxable;
      totalGstCollected += gst;
      totalGrandTotal += total;

      // Calculate simple average percentage or read standard
      const pct = taxable > 0 ? ((gst / taxable) * 100) : 3.0;

      return {
        id: bill.id,
        documentNumber: bill.documentNumber,
        invoiceDate: bill.invoiceDate,
        customerName: bill.customerNameSnapshot || 'Walk-in Customer',
        customerGst: bill.customerGstSnapshot || '',
        taxableAmount: parseFloat(taxable.toFixed(2)),
        gstPercentage: parseFloat(pct.toFixed(1)),
        gstAmount: parseFloat(gst.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      };
    });

    return NextResponse.json({
      success: true,
      invoices,
      summary: {
        totalTaxableSales: parseFloat(totalTaxableSales.toFixed(2)),
        totalGstCollected: parseFloat(totalGstCollected.toFixed(2)),
        totalGrandTotal: parseFloat(totalGrandTotal.toFixed(2))
      }
    });

  } catch (error: any) {
    console.error('Reports GST GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
