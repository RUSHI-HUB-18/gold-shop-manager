"use client";

import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { TrendChart } from '@/components/ui/TrendChart';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { exportReport } from '@/utils/export';

type ActiveTab = 'sales' | 'gst' | 'customers' | 'items';
type PresetRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sales');
  const [range, setRange] = useState<PresetRange>('month');
  
  // Date states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [salesData, setSalesData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any>(null);

  // Set default dates based on preset range selection
  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    if (range === 'today') {
      // Current day
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      
      const yesterdayEnd = new Date(start.getTime());
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(yesterdayEnd.toISOString().slice(0, 10));
      return;
    } else if (range === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (range === 'month') {
      start.setDate(start.getDate() - 30);
    } else {
      // Custom - do not override inputs
      return;
    }

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
  }, [range]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const filterParams = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        groupBy
      };

      // Fetch all reports concurrently to populate KPIs
      const [salesRes, gstRes, customerRes, itemsRes] = await Promise.all([
        reportService.getSalesReport(filterParams),
        reportService.getGstReport(filterParams).catch(() => ({ invoices: [], summary: { totalTaxableSales: 0, totalGstCollected: 0, totalGrandTotal: 0 } })),
        reportService.getCustomerReport().catch(() => ({ highestSpending: [], mostFrequent: [], inactiveCustomers: [], summary: { totalCustomers: 0, activeCustomers: 0, inactiveCustomersCount: 0, newCustomersThisMonth: 0, averageCustomerSpend: 0 } })),
        reportService.getItemSalesReport(filterParams).catch(() => ({ items: [] }))
      ]);

      setSalesData(salesRes);
      setGstData(gstRes);
      setCustomerData(customerRes);
      setItemsData(itemsRes);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to retrieve analytics:', err);
      setError(err.message || 'Failed to fetch reporting summaries.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, groupBy, activeTab]);

  // Export handlers
  const handleExport = () => {
    if (activeTab === 'sales' && salesData) {
      const headers = ['Date Interval', 'Total Sales (₹)'];
      const rows = salesData.trend.map((t: any) => [t.label, t.sales]);
      exportReport('sales_report', headers, rows);
    } else if (activeTab === 'gst' && gstData) {
      const headers = ['Invoice Number', 'Invoice Date', 'Customer', 'Customer GSTIN', 'Taxable Amt (₹)', 'GST %', 'GST Amt (₹)', 'Invoice Total (₹)'];
      const rows = gstData.invoices.map((inv: any) => [
        inv.documentNumber,
        formatDate(inv.invoiceDate),
        inv.customerName,
        inv.customerGst || 'N/A',
        inv.taxableAmount,
        `${inv.gstPercentage}%`,
        inv.gstAmount,
        inv.total
      ]);
      exportReport('gst_filing_report', headers, rows);
    } else if (activeTab === 'customers' && customerData) {
      const headers = ['Customer Code', 'Full Name', 'Mobile', 'Bills Generated', 'Average Spend (₹)', 'Total Spent (₹)', 'Last Order Date'];
      const rows = customerData.highestSpending.map((c: any) => [
        c.customerCode,
        c.fullName,
        c.mobileNumber,
        c.billsCount,
        c.averageSpend,
        c.totalSpent,
        c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : 'Never'
      ]);
      exportReport('top_customers_report', headers, rows);
    } else if (activeTab === 'items' && itemsData) {
      const headers = ['Jewelry Description', 'Quantity Sold', 'Total Net Weight (g)', 'Total Revenue Generated (₹)'];
      const rows = itemsData.items.map((it: any) => [
        it.itemName,
        it.quantitySold,
        it.totalWeightSold,
        it.totalRevenue
      ]);
      exportReport('item_sales_report', headers, rows);
    }
  };

  const renderComparisonBadge = (val: number, label: string) => {
    const isPositive = val >= 0;
    return (
      <span style={{ 
        fontSize: '0.75rem', 
        fontWeight: 'bold', 
        color: isPositive ? '#16a34a' : '#ef4444', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.15rem',
        marginTop: '0.25rem'
      }}>
        {isPositive ? '↑' : '↓'} {Math.abs(val)}% <span style={{ color: 'var(--muted-foreground)', fontWeight: '400', marginLeft: '0.25rem' }}>vs {label}</span>
      </span>
    );
  };

  if (loading && !salesData) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading reports & analytics...</p>
      </div>
    );
  }

  const kpis = salesData?.totals || { grandTotal: 0, count: 0, gstAmount: 0, averageBill: 0 };
  const comparisons = salesData?.comparisons || { totalSalesDiff: 0, invoicesCountDiff: 0, gstCollectedDiff: 0, avgBillDiff: 0 };
  const customerSummary = customerData?.summary || { totalCustomers: 0, activeCustomers: 0, newCustomersThisMonth: 0 };

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      
      {/* Page Header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h1>Store Reports & Analytics</h1>
          <p className="text-muted">Track sales indicators, evaluate category distributions, and generate GST statements.</p>
        </div>
        <Button onClick={handleExport} className="primary-btn">
          📥 Export Report (CSV)
        </Button>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Date Pickers Filter Bar */}
      <Card style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius)', padding: '0.25rem' }}>
            <Button onClick={() => setRange('today')} className={range === 'today' ? 'primary-btn' : 'secondary-btn'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', background: range==='today'?'var(--primary)':'transparent', boxShadow: 'none' }}>Today</Button>
            <Button onClick={() => setRange('yesterday')} className={range === 'yesterday' ? 'primary-btn' : 'secondary-btn'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', background: range==='yesterday'?'var(--primary)':'transparent', boxShadow: 'none' }}>Yesterday</Button>
            <Button onClick={() => setRange('week')} className={range === 'week' ? 'primary-btn' : 'secondary-btn'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', background: range==='week'?'var(--primary)':'transparent', boxShadow: 'none' }}>Last 7 Days</Button>
            <Button onClick={() => setRange('month')} className={range === 'month' ? 'primary-btn' : 'secondary-btn'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', background: range==='month'?'var(--primary)':'transparent', boxShadow: 'none' }}>Last 30 Days</Button>
            <Button onClick={() => setRange('custom')} className={range === 'custom' ? 'primary-btn' : 'secondary-btn'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', background: range==='custom'?'var(--primary)':'transparent', boxShadow: 'none' }}>Custom</Button>
          </div>

          {range === 'custom' && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
              />
              <span className="text-muted">to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
              />
            </div>
          )}

          {activeTab === 'sales' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Group:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          )}

        </div>
      </Card>

      {/* Analytics KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '600' }}>Sales Revenue</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>{formatCurrency(kpis.grandTotal)}</span>
          {renderComparisonBadge(comparisons.totalSalesDiff, 'prev period')}
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '600' }}>Invoices Generated</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{kpis.count}</span>
          {renderComparisonBadge(comparisons.invoicesCountDiff, 'prev period')}
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '600' }}>Average Ticket</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{formatCurrency(kpis.averageBill)}</span>
          {renderComparisonBadge(comparisons.avgBillDiff, 'prev period')}
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '600' }}>GST Collected</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', marginTop: '0.25rem' }}>{formatCurrency(kpis.gstAmount)}</span>
          {renderComparisonBadge(comparisons.gstCollectedDiff, 'prev period')}
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '600' }}>Customers served</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{customerSummary.totalCustomers}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>Active profiles: <strong>{customerSummary.activeCustomers}</strong></span>
        </Card>
      </div>

      {/* Main Tab Controls */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sales' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'sales' ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          📈 Sales Summary
        </button>
        <button
          onClick={() => setActiveTab('gst')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'gst' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'gst' ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          🧾 GST Ledger
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'customers' ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          👥 Client Analytics
        </button>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'items' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'items' ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          💎 Item Sales
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
          <Spinner />
          <span className="text-muted">Filtering analytics reports...</span>
        </div>
      ) : (
        <div>
          
          {/* TAB 1: Sales summaries */}
          {activeTab === 'sales' && salesData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0 }}>Revenue Trend</h3>
                  {salesData.trend.length === 0 ? (
                    <EmptyState title="No trend data" description="No invoices found in selected parameters." />
                  ) : (
                    <TrendChart data={salesData.trend} />
                  )}
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0 }}>Revenue Breakdown</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Snapshot Gold Value</span>
                      <span style={{ fontWeight: '500' }}>{formatCurrency(salesData.totals.goldValue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Making Charges Collected</span>
                      <span style={{ fontWeight: '500' }}>{formatCurrency(salesData.totals.makingCharges)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Hallmark Fees</span>
                      <span style={{ fontWeight: '500' }}>{formatCurrency(salesData.totals.hallmarkCharges)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                      <span className="text-muted">Gross Subtotal</span>
                      <span style={{ fontWeight: '500' }}>{formatCurrency(salesData.totals.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Discounts Given</span>
                      <span style={{ color: '#ef4444', fontWeight: '500' }}>-{formatCurrency(salesData.totals.discountAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', fontWeight: '600' }}>
                      <span>Taxable Amount</span>
                      <span>{formatCurrency(salesData.totals.taxableAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">GST Collected</span>
                      <span style={{ color: '#16a34a', fontWeight: '500' }}>+{formatCurrency(salesData.totals.gstAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--primary)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--primary)' }}>Net Grand Total</span>
                      <span style={{ color: 'var(--primary)' }}>{formatCurrency(salesData.totals.grandTotal)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: GST filing ledger */}
          {activeTab === 'gst' && gstData && (
            <div className="form-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', margin: 0 }}>GST Tax Filings Ledger</h3>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Taxable Sales: <strong>{formatCurrency(gstData.summary.totalTaxableSales)}</strong> | Tax: <strong style={{ color: '#16a34a' }}>{formatCurrency(gstData.summary.totalGstCollected)}</strong></span>
              </div>

              {gstData.invoices.length === 0 ? (
                <EmptyState title="No GST statements" description="There are no completed invoices within this date range." />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                        <th style={{ padding: '0.75rem' }}>Invoice No</th>
                        <th style={{ padding: '0.75rem' }}>Date</th>
                        <th style={{ padding: '0.75rem' }}>Customer Name</th>
                        <th style={{ padding: '0.75rem' }}>Customer GSTIN</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Taxable Value</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GST Rate</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>GST Collected</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstData.invoices.map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>{inv.documentNumber}</td>
                          <td style={{ padding: '0.75rem' }}>{formatDate(inv.invoiceDate)}</td>
                          <td style={{ padding: '0.75rem' }}>{inv.customerName}</td>
                          <td style={{ padding: '0.75rem' }}>{inv.customerGst || <span style={{ opacity: 0.4 }}>-</span>}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(inv.taxableAmount)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{inv.gstPercentage}%</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>{formatCurrency(inv.gstAmount)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(inv.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Customers detailed analytics */}
          {activeTab === 'customers' && customerData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* 1. Top Customers by Revenue */}
                <div className="form-container" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Highest Spenders</h3>
                  {customerData.highestSpending.length === 0 ? (
                    <EmptyState title="No customer rankings" description="No clients spent store tokens yet." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {customerData.highestSpending.map((c: any, index: number) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)', width: '20px' }}>{index + 1}.</span>
                            <div>
                              <div style={{ fontWeight: '600' }}>{c.fullName}</div>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Code: {c.customerCode}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: 'var(--primary)' }}>{formatCurrency(c.totalSpent)}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Avg: {formatCurrency(c.averageSpend)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Most Frequent orders */}
                <div className="form-container" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Most Frequent Buyers</h3>
                  {customerData.mostFrequent.length === 0 ? (
                    <EmptyState title="No purchase frequencies" description="Register invoices to see customer rankings." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {customerData.mostFrequent.map((c: any, index: number) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)', width: '20px' }}>{index + 1}.</span>
                            <div>
                              <div style={{ fontWeight: '600' }}>{c.fullName}</div>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Phone: {c.mobileNumber}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{c.billsCount} bills</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Total Spent: {formatCurrency(c.totalSpent)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* 3. Inactive client profiles */}
              <div className="form-container">
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Inactive Customers (No purchase in 90+ days)</h3>
                
                {customerData.inactiveCustomers.length === 0 ? (
                  <EmptyState title="All customers active!" description="No customers registered are currently flagged inactive." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                          <th style={{ padding: '0.75rem' }}>Customer Code</th>
                          <th style={{ padding: '0.75rem' }}>Full Name</th>
                          <th style={{ padding: '0.75rem' }}>Mobile</th>
                          <th style={{ padding: '0.75rem' }}>Total Spent</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Last Purchase Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerData.inactiveCustomers.map((c: any) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '600' }}>{c.customerCode}</td>
                            <td style={{ padding: '0.75rem' }}>{c.fullName}</td>
                            <td style={{ padding: '0.75rem' }}>{c.mobileNumber}</td>
                            <td style={{ padding: '0.75rem' }}>{formatCurrency(c.totalSpent)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444', fontWeight: '500' }}>
                              {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : 'Never purchased'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: Item Sales analysis */}
          {activeTab === 'items' && itemsData && (
            <div className="form-container">
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '1.25rem', marginTop: 0 }}>Popular Jewellery Category Sales</h3>
              
              {itemsData.items.length === 0 ? (
                <EmptyState title="No items sold" description="Create sales invoices in the calculator to collect inventory statistics." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
                  
                  {/* Table listings */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                          <th style={{ padding: '0.75rem' }}>Sr</th>
                          <th style={{ padding: '0.75rem' }}>Jewelry Category</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty Sold</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Net Wt (g)</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsData.items.map((it: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>{it.itemName}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>{it.quantitySold}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{it.totalWeightSold.toFixed(3)}g</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(it.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Lightweight custom SVG Bar Chart */}
                  <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', margin: 0 }}>Category Sales distribution (Qty)</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                      {itemsData.items.slice(0, 7).map((it: any, idx: number) => {
                        const maxQty = Math.max(...itemsData.items.map((i: any) => i.quantitySold), 1);
                        const widthPct = (it.quantitySold / maxQty) * 100;
                        
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: '500' }}>{it.itemName}</span>
                              <span className="text-muted">{it.quantitySold} sold</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${widthPct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '999px', transition: 'width 0.5s ease-out' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
