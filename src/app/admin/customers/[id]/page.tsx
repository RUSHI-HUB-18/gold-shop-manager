"use client";

import React, { useState, useEffect, use } from 'react';
import { customerService } from '@/services/customerService';
import { Customer } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'calculations' | 'bills' | 'payments' | 'balances'>('calculations');

  useEffect(() => {
    customerService.getCustomerById(id)
      .then(res => {
        setCustomer(res.customer);
        setLoading(false);
      })
      .catch(err => {
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to retrieve customer profile.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading Customer Profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert type="error" message={error || 'Customer profile not found.'} />
        <a href="/admin/customers">
          <Button style={{ marginTop: '1rem' }}>Back to Registry</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar fullName={customer.fullName} size="lg" />
          <div>
            <h1>{customer.fullName}</h1>
            <p className="text-muted">Customer Code: <strong style={{ color: 'var(--primary)' }}>{customer.customerCode}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/admin/customers">
            <button className="secondary-btn" style={{ padding: '0.75rem 1.5rem' }}>Back</button>
          </a>
          <a href={`/admin/customers/edit/${customer.id}`}>
            <Button className="primary-btn" style={{ padding: '0.75rem 1.75rem' }}>Edit Details</Button>
          </a>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Card: Customer Details */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Contact Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div>📱 <strong>{customer.mobileNumber}</strong></div>
              {customer.email && <div style={{ wordBreak: 'break-all' }}>✉️ {customer.email}</div>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Store Registry</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
              <div>Status: <span style={{ fontWeight: 'bold', color: customer.status === 'ACTIVE' ? '#16a34a' : '#ef4444' }}>{customer.status}</span></div>
              <div>Joined: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</div>
              {customer.gstNumber && <div>GSTIN: <strong>{customer.gstNumber}</strong></div>}
            </div>
          </div>

          {(customer.address || customer.city || customer.state) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Location</h3>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.4 }}>
                {customer.address && <div>{customer.address}</div>}
                <div>
                  {customer.city && `${customer.city}`}
                  {customer.city && customer.state ? ', ' : ''}
                  {customer.state && `${customer.state}`}
                  {customer.pincode && ` - ${customer.pincode}`}
                </div>
              </div>
            </div>
          )}

          {(customer.birthDate || customer.anniversary) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Important Dates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                {customer.birthDate && <div>🎂 Birthday: {new Date(customer.birthDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                {customer.anniversary && <div>💍 Anniversary: {new Date(customer.anniversary).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
              </div>
            </div>
          )}

          {customer.notes && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Remarks</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.85, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{customer.notes}</p>
            </div>
          )}
        </Card>

        {/* Right Tabbed Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tabs header */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('calculations')}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'calculations' ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === 'calculations' ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Calculations History
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'bills' ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === 'bills' ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Bills (Coming Soon)
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'payments' ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === 'payments' ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Payments (Coming Soon)
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'balances' ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === 'balances' ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Balances (Coming Soon)
            </button>
          </div>

          {/* Tab Content */}
          <div className="form-container" style={{ minHeight: '300px' }}>
            
            {activeTab === 'calculations' && (
              <div>
                <Alert 
                  type="info" 
                  message="This section displays temporary calculation estimations. It will automatically convert to purchase invoice histories once the Billing module is implemented."
                  style={{ marginBottom: '1.5rem' }}
                />

                {!customer.calculations || customer.calculations.length === 0 ? (
                  <EmptyState title="No Calculations Found" description="This customer does not have any saved gold calculations yet." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)' }}>
                          <th style={{ padding: '0.75rem' }}>Date</th>
                          <th style={{ padding: '0.75rem' }}>Jewelry Item</th>
                          <th style={{ padding: '0.75rem' }}>Weight</th>
                          <th style={{ padding: '0.75rem' }}>Purity</th>
                          <th style={{ padding: '0.75rem' }}>Gold Rate</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Final Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.calculations.map((calc: any) => (
                          <tr key={calc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(calc.createdAt)}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{calc.item?.name}</td>
                            <td style={{ padding: '0.75rem' }}>{calc.weight}g</td>
                            <td style={{ padding: '0.75rem' }}>{calc.purity}</td>
                            <td style={{ padding: '0.75rem' }}>{formatCurrency(calc.goldRate)}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'right' }}>
                              {formatCurrency(calc.finalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bills' && (
              <EmptyState 
                title="Bills Integration Coming Soon" 
                description="Once the Phase 4 Billing System is implemented, complete store bills and transactional invoices for this customer will appear here." 
              />
            )}

            {activeTab === 'payments' && (
              <EmptyState 
                title="Payments Integration Coming Soon" 
                description="Once payments logging is implemented, customer cash receipt credits, card logs, and digital transactions will appear here." 
              />
            )}

            {activeTab === 'balances' && (
              <EmptyState 
                title="Balances & Ledgers Coming Soon" 
                description="Once ledger balances is implemented, total purchase values, advance deposits, and active balances will appear here." 
              />
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
