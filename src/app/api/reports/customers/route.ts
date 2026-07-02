import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch customers and completed bills
    const customers = await prisma.customer.findMany({
      include: {
        bills: {
          where: { status: 'COMPLETED' },
          orderBy: { invoiceDate: 'desc' }
        }
      }
    });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const customerStats = customers.map(customer => {
      const totalSpent = customer.bills.reduce((sum, b) => sum + Number(b.total), 0);
      const billsCount = customer.bills.length;
      const averageSpend = billsCount > 0 ? (totalSpent / billsCount) : 0;
      const lastPurchaseDate = billsCount > 0 ? customer.bills[0].invoiceDate : null;

      // Flag inactive if last purchase > 90 days ago or if never made a purchase and account is older than 90 days
      const isInactive = lastPurchaseDate
        ? new Date(lastPurchaseDate) < ninetyDaysAgo
        : new Date(customer.createdAt) < ninetyDaysAgo;

      return {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        mobileNumber: customer.mobileNumber,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        billsCount,
        averageSpend: parseFloat(averageSpend.toFixed(2)),
        lastPurchaseDate,
        isInactive,
        createdAt: customer.createdAt
      };
    });

    // 1. Ranked by total purchase volume
    const highestSpending = [...customerStats]
      .filter(c => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 15);

    // 2. Ranked by number of orders
    const mostFrequent = [...customerStats]
      .filter(c => c.billsCount > 0)
      .sort((a, b) => b.billsCount - a.billsCount)
      .slice(0, 15);

    // 3. Inactive clients (idle for 90+ days)
    const inactiveCustomers = [...customerStats]
      .filter(c => c.isInactive)
      .sort((a, b) => {
        if (!a.lastPurchaseDate) return 1;
        if (!b.lastPurchaseDate) return -1;
        return new Date(a.lastPurchaseDate).getTime() - new Date(b.lastPurchaseDate).getTime();
      })
      .slice(0, 20);

    // 4. Global statistics indicators
    const customersWithPurchases = customerStats.filter(c => c.billsCount > 0);
    const globalTotalSpent = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);
    const globalAvgCustomerSpend = customersWithPurchases.length > 0 
      ? (globalTotalSpent / customersWithPurchases.length) 
      : 0;

    const totalCustomers = customerStats.length;
    const activeCustomers = customerStats.filter(c => !c.isInactive).length;
    const newCustomersThisMonth = customerStats.filter(c => {
      const date = new Date(c.createdAt);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return date >= startOfMonth;
    }).length;

    return NextResponse.json({
      success: true,
      highestSpending,
      mostFrequent,
      inactiveCustomers,
      summary: {
        totalCustomers,
        activeCustomers,
        inactiveCustomersCount: totalCustomers - activeCustomers,
        newCustomersThisMonth,
        averageCustomerSpend: parseFloat(globalAvgCustomerSpend.toFixed(2))
      }
    });

  } catch (error: any) {
    console.error('Reports Customers GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
