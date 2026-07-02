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
import { numberToWords } from '@/utils/numberToWords';

export default function BillDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [bill, setBill] = useState<Bill | null>(null);
  const [enableQrCode, setEnableQrCode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    billService.getBillById(id)
      .then(res => {
        setBill(res.bill);
        setEnableQrCode(res.enableQrCode);
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

  const grandTotalInWords = numberToWords(Number(bill.total));

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 2rem' }}>
      
      {/* Action buttons (hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Invoice Print Preview</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Verify items and configurations below before sending to paper.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/admin/bills">
            <button className="secondary-btn" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>Back to Bills</button>
          </a>
          <button 
            className="primary-btn" 
            onClick={() => window.print()}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            🖨️ Print Invoice
          </button>
        </div>
      </div>

      {/* Printable Invoice Container Sheet */}
      <div className="invoice-print-container" style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2.5rem', backgroundColor: 'var(--background)', zIndex: 1, minHeight: '11in', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Large diagonal Watermark for non-tax Estimates/Quotations */}
        {bill.documentType !== 'INVOICE' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-35deg)',
            fontSize: '3.6rem',
            fontWeight: '900',
            color: 'rgba(156, 163, 175, 0.12)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 0,
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.2
          }}>
            {bill.documentType}<br />
            NOT A TAX INVOICE
          </div>
        )}

        <div style={{ zIndex: 2 }}>
          {/* Header Layout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Left side: Shop details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {bill.storeLogoSnapshot ? (
                <img src={bill.storeLogoSnapshot} alt="Shop Logo" style={{ maxHeight: '55px', maxWidth: '200px', objectFit: 'contain', marginBottom: '0.5rem' }} />
              ) : (
                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.6rem', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                  {bill.storeName}
                </div>
              )}
              <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>{bill.storeAddress}</span>
              {bill.storePhone && <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>Phone: {bill.storePhone}</span>}
              {bill.storeGstNumber && <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>GSTIN: {bill.storeGstNumber}</span>}
            </div>

            {/* Right side: Invoice ID and Date */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>
                {bill.documentType}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>No: <strong>{bill.documentNumber}</strong></span>
              <span style={{ fontSize: '0.85rem' }}>Date: {formatDate(bill.invoiceDate)}</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: bill.paymentStatus === 'PAID' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: bill.paymentStatus === 'PAID' ? '#16a34a' : '#ef4444',
                alignSelf: 'flex-end',
                marginTop: '0.25rem'
              }}>
                {bill.paymentStatus}
              </span>
            </div>
          </div>

          {/* Customer Meta Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', padding: '0.5rem 0 1.25rem 0', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Billed To:</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>{bill.customerNameSnapshot}</div>
              {bill.customerAddressSnapshot && <div style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>{bill.customerAddressSnapshot}</div>}
              {bill.customerMobileSnapshot && <div style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>Phone: {bill.customerMobileSnapshot}</div>}
            </div>
            {bill.customerGstSnapshot && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Customer GSTIN:</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{bill.customerGstSnapshot}</div>
              </div>
            )}
          </div>

          {/* Bordered items grid */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary)', backgroundColor: 'var(--secondary)', fontWeight: '600', color: 'var(--foreground)' }}>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', width: '5%' }}>Sr</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', width: '30%' }}>Description</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: '8%' }}>Qty</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: '8%' }}>Purity</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '12%' }}>Gross/Net (g)</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '12%' }}>Gold Rate</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '12%' }}>Making Charge</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '13%' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item, index) => {
                const gr = Number(item.grossWeight);
                const st = Number(item.stoneWeight);
                const net = Number(item.netWeight);
                const rate = Number(item.goldRate);
                const mkValue = Number(item.makingChargeValue);
                const rowAmount = Number(item.amount);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top' }}>{index + 1}</td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.itemNameSnapshot}</div>
                      {item.remarks && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', fontStyle: 'italic' }}>{item.remarks}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'center' }}>{item.purity}</td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                      <div>{gr.toFixed(3)}g</div>
                      {st > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>St: -{st.toFixed(3)}g</div>}
                      <div style={{ fontWeight: '600' }}>Net: {net.toFixed(3)}g</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                      {formatCurrency(rate)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                      <div>{formatCurrency(mkValue)}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>({item.makingChargeType})</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(rowAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            
            {/* Left side: Notes and Terms */}
            <div>
              {bill.notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Notes:</span>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {bill.notes}
                  </div>
                </div>
              )}
              {bill.invoiceTermsSnapshot && (
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Terms & Conditions:</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {bill.invoiceTermsSnapshot}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Calculations breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Subtotal</span>
                <span>{formatCurrency(Number(bill.subtotal))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Discount ({bill.discountType === 'PERCENTAGE' ? `${bill.discountValue}%` : 'Flat'})</span>
                <span style={{ color: '#ef4444' }}>- {formatCurrency(Number(bill.discountAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', fontWeight: '500' }}>
                <span>Taxable Amount</span>
                <span>{formatCurrency(Number(bill.taxableAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>GST snapshot</span>
                <span>{formatCurrency(Number(bill.gstAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--primary)', paddingTop: '0.75rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--primary)' }}>Grand Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(Number(bill.total))}</span>
              </div>
            </div>

          </div>

          {/* Amount in words */}
          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.75rem 0', marginBottom: '3rem', fontSize: '0.85rem' }}>
            Amount in Words: <strong>{grandTotalInWords}</strong>
          </div>

        </div>

        {/* Footer Area with signatures and QR code */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
          
          {/* QR code block */}
          {enableQrCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--foreground)' }}>
                <rect x="2" y="2" width="6" height="6" />
                <rect x="16" y="2" width="6" height="6" />
                <rect x="2" y="16" width="6" height="6" />
                <path d="M7 7h1M16 7h1M7 16h1M10 2h4v4h-4zM10 8h2v2h-2zM14 10h4v2h-4zM10 14h2v8h-2zM14 16h4v4h-4z" />
              </svg>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>Scan to Verify</span>
            </div>
          ) : (
            <div />
          )}

          {/* Signatures */}
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px', gap: '2.5rem' }}>
              <div style={{ height: '1px', width: '100%', borderTop: '1px solid var(--muted-foreground)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Customer Signature</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px', gap: '2.5rem' }}>
              <div style={{ height: '1px', width: '100%', borderTop: '1px solid var(--muted-foreground)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>Authorized Signatory<br />for {bill.storeName}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
