"use client";

import React, { useState, useEffect } from 'react';
import { Bill } from '@/types';
import { billService } from '@/services/billService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export default function BillsList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('COMPLETED');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Summary Stats State
  const [stats, setStats] = useState({
    totalSales: 0,
    count: 0,
    gstCollected: 0,
    discountAmount: 0
  });

  const fetchBills = () => {
    setLoading(true);
    billService.getBills({ search, status, page, limit })
      .then(res => {
        setBills(res.bills);
        setTotalPages(res.pagination.totalPages);
        setStats(res.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load bills:', err);
        setError(err.message || 'Failed to retrieve bills list.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBills();
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Store Invoices</h1>
          <p className="text-muted">Generate, browse, and manage store tax invoices and customer estimates.</p>
        </div>
        <a href="/admin/bills/new">
          <Button className="primary-btn">➕ New Bill</Button>
        </a>
      </header>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales Revenue</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(stats.totalSales)}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoices Count</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.count}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total GST Collected</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(stats.gstCollected)}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Discounts Given</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(stats.discountAmount)}</span>
        </Card>
      </div>

      {/* Search & Filter bar */}
      <Card style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 300px' }}>
            <input 
              type="text" 
              placeholder="Search by invoice number (INV-YYYY-XXXX) or customer details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            >
              <option value="COMPLETED">Completed Bills</option>
              <option value="DRAFT">Drafts</option>
              <option value="CANCELLED">Cancelled Bills</option>
              <option value="ALL">All Documents</option>
            </select>
          </div>
          <Button type="submit" style={{ padding: '0.75rem 1.5rem' }}>Search</Button>
        </form>
      </Card>

      {/* Main Table */}
      <div className="form-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <Spinner size="lg" />
            <span className="text-muted">Loading store invoices...</span>
          </div>
        ) : bills.length === 0 ? (
          <EmptyState title="No Invoices Found" description="Try broadening your search criteria or create your first invoice bill above." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                    <th style={{ padding: '1rem 0.75rem' }}>Invoice No</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Type</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Date</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Customer Name</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Creator</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Payment</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(bill => (
                    <tr key={bill.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {bill.documentNumber}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                          {bill.documentType}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', whiteSpace: 'nowrap' }}>{formatDate(bill.invoiceDate)}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: '500' }}>{bill.customerNameSnapshot}</div>
                        {bill.customerMobileSnapshot && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{bill.customerMobileSnapshot}</div>}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>{bill.createdByName}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          backgroundColor: 
                            bill.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.1)' : 
                            bill.status === 'DRAFT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: 
                            bill.status === 'COMPLETED' ? '#16a34a' : 
                            bill.status === 'DRAFT' ? '#3b82f6' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {bill.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          backgroundColor: 
                            bill.paymentStatus === 'PAID' ? 'rgba(34, 197, 94, 0.1)' : 
                            bill.paymentStatus === 'PARTIAL' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: 
                            bill.paymentStatus === 'PAID' ? '#16a34a' : 
                            bill.paymentStatus === 'PARTIAL' ? '#d97706' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--foreground)' }}>
                        {formatCurrency(Number(bill.total))}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <a href={`/admin/bills/${bill.id}`}>
                          <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View Detail</button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </Button>
                  <Button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
