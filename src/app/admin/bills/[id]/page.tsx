"use client";

import React, { useState, useEffect, use } from 'react';
import { Bill } from '@/types';
import { billService } from '@/services/billService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export default function BillDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    billService.getBillById(id)
      .then(res => {
        setBill(res.bill);
        setLoading(false);
      })
      .catch(err => {
        console.error('Invoice load error:', err);
        setError(err.message || 'Failed to retrieve invoice details.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading Invoice details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert type="error" message={error || 'Invoice not found.'} />
        <a href="/admin/bills">
          <Button style={{ marginTop: '1rem' }}>Back to Bills</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1000px' }}>
      
      {/* Detail header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {bill.documentType} / {bill.status}
          </span>
          <h1 style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>{bill.documentNumber}</h1>
          <p className="text-muted">Issued on {formatDate(bill.invoiceDate)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/admin/bills">
            <button className="secondary-btn" style={{ padding: '0.75rem 1.5rem' }}>Back to Registry</button>
          </a>
          <button 
            className="primary-btn" 
            onClick={() => window.print()}
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}
          >
            🖨️ Print (Browser)
          </button>
        </div>
      </header>

      {/* Main Grid split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Store snapshot */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem', marginTop: 0 }}>Shop Details</h3>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{bill.storeName}</div>
            {bill.storeAddress && <div>📍 {bill.storeAddress}</div>}
            {bill.storePhone && <div>📞 {bill.storePhone}</div>}
            {bill.storeGstNumber && <div>GSTIN: <strong>{bill.storeGstNumber}</strong></div>}
          </div>
        </Card>

        {/* Customer snapshot */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem', marginTop: 0 }}>Customer Details</h3>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              {bill.customerNameSnapshot}
            </div>
            {bill.customerMobileSnapshot && <div>📞 {bill.customerMobileSnapshot}</div>}
            {bill.customerAddressSnapshot && <div>📍 {bill.customerAddressSnapshot}</div>}
            {bill.customerGstSnapshot && <div>GSTIN: <strong>{bill.customerGstSnapshot}</strong></div>}
          </div>
        </Card>

      </div>

      {/* Itemized Table */}
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '1rem', marginTop: 0 }}>Invoice Items</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Qty</th>
                <th style={{ padding: '0.75rem' }}>Purity</th>
                <th style={{ padding: '0.75rem' }}>Weights (G/S/N)</th>
                <th style={{ padding: '0.75rem' }}>Gold Rate</th>
                <th style={{ padding: '0.75rem' }}>Making Charge</th>
                <th style={{ padding: '0.75rem' }}>Hallmark/Wastage</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '500' }}>{item.itemNameSnapshot}</div>
                    {item.remarks && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{item.remarks}</div>}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{item.quantity}</td>
                  <td style={{ padding: '0.75rem' }}>{item.purity}</td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    <div>Gr: {Number(item.grossWeight).toFixed(3)}g</div>
                    <div>St: {Number(item.stoneWeight).toFixed(3)}g</div>
                    <div style={{ fontWeight: 'bold' }}>Net: {Number(item.netWeight).toFixed(3)}g</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{formatCurrency(Number(item.goldRate))}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>{formatCurrency(Number(item.makingChargeValue))}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>({item.makingChargeType})</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>H: {formatCurrency(Number(item.hallmarkCharge))}</div>
                    <div>W: {Number(item.wastage).toFixed(1)}%</div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)' }}>
                    {formatCurrency(Number(item.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Calculations Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Notes */}
        <div>
          {bill.notes && (
            <Card style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Remarks / Terms</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.85, whiteSpace: 'pre-wrap', lineHeight: 1.4, margin: 0 }}>
                {bill.notes}
              </p>
            </Card>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '1rem' }}>
            Generated by user: <strong>{bill.createdByName}</strong>
          </div>
        </div>

        {/* Calculations card */}
        <div className="form-container" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Gross Subtotal</span>
            <span>{formatCurrency(Number(bill.subtotal))}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Discount ({bill.discountType})</span>
            <span style={{ color: '#ef4444' }}>- {formatCurrency(Number(bill.discountAmount))}</span>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(Number(bill.taxableAmount))}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>GST snapshot</span>
            <span>{formatCurrency(Number(bill.gstAmount))}</span>
          </div>

          <div style={{ borderTop: '2px solid var(--primary)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Grand Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {formatCurrency(Number(bill.total))}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
