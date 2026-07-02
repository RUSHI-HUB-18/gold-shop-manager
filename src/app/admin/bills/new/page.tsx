"use client";

import React, { useState, useEffect } from 'react';
import { Item, GoldRate, SystemSettings, Customer, MakingChargeType, DiscountType } from '@/types';
import { apiClient } from '@/utils/api';
import { customerService } from '@/services/customerService';
import { billService } from '@/services/billService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';
import { formatPercent } from '@/utils/format';

interface FormRow {
  itemId: string;
  itemNameSnapshot: string;
  quantity: number;
  grossWeight: string;
  stoneWeight: string;
  netWeight: number;
  purity: string;
  goldRate: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: string;
  makingChargeAmount: number;
  hallmarkCharge: string;
  wastage: string;
  gstPercentage: number;
  gstAmount: number;
  amount: number;
  remarks: string;
}

export default function NewBill() {
  const [items, setItems] = useState<Item[]>([]);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [documentType, setDocumentType] = useState<'INVOICE' | 'ESTIMATE' | 'QUOTATION'>('INVOICE');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('PAID');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discountValue, setDiscountValue] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  // Rows state
  const [rows, setRows] = useState<FormRow[]>([createEmptyRow()]);

  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [total, setTotal] = useState(0);

  function createEmptyRow(): FormRow {
    return {
      itemId: '',
      itemNameSnapshot: '',
      quantity: 1,
      grossWeight: '',
      stoneWeight: '0',
      netWeight: 0,
      purity: '22K',
      goldRate: 0,
      makingChargeType: 'FLAT',
      makingChargeValue: '0',
      makingChargeAmount: 0,
      hallmarkCharge: '0',
      wastage: '0',
      gstPercentage: 3.0,
      gstAmount: 0,
      amount: 0,
      remarks: ''
    };
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, rateData, settingsData, customersData] = await Promise.all([
          apiClient.get<{ items: Item[] }>('/api/items'),
          apiClient.get<{ goldRate: GoldRate }>('/api/gold-rate'),
          apiClient.get<{ settings: SystemSettings }>('/api/settings'),
          customerService.getCustomers({ limit: 1000, status: 'ACTIVE' }).catch(() => ({ customers: [] }))
        ]);

        if (itemsData.items) setItems(itemsData.items);
        if (rateData.goldRate) {
          setGoldRate(rateData.goldRate);
          // Set initial gold rate for first row
          setRows([
            {
              ...createEmptyRow(),
              goldRate: rateData.goldRate.rate22K,
              gstPercentage: settingsData?.settings?.gstPercentage || 3.0
            }
          ]);
        }
        if (settingsData.settings) setSettings(settingsData.settings);
        if (customersData && customersData.customers) setCustomers(customersData.customers);
        setLoading(false);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load configuration configurations.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update rows calculations whenever weights, purities or rates adjust
  useEffect(() => {
    if (!goldRate || !settings) return;

    let sub = 0;
    const updated = rows.map(row => {
      const gross = parseFloat(row.grossWeight) || 0;
      const stone = parseFloat(row.stoneWeight) || 0;
      const net = Math.max(0, gross - stone);

      const activeRate = row.purity === '22K' ? goldRate.rate22K : (goldRate.rate24K || goldRate.rate22K);
      const goldVal = net * activeRate;

      const chargeVal = parseFloat(row.makingChargeValue) || 0;
      let chargeAmt = 0;
      if (row.makingChargeType === 'PERCENTAGE') {
        chargeAmt = goldVal * (chargeVal / 100);
      } else {
        chargeAmt = chargeVal * row.quantity;
      }

      const hallmark = parseFloat(row.hallmarkCharge) || 0;
      const wastagePct = parseFloat(row.wastage) || 0;
      const wastageValue = goldVal * (wastagePct / 100);

      const rowSubtotal = goldVal + chargeAmt + hallmark + wastageValue;
      const rowGst = rowSubtotal * (settings.gstPercentage / 100);
      const rowTotal = rowSubtotal + rowGst;

      sub += rowSubtotal;

      return {
        ...row,
        netWeight: net,
        goldRate: activeRate,
        makingChargeAmount: chargeAmt,
        gstPercentage: settings.gstPercentage,
        gstAmount: rowGst,
        amount: rowTotal
      };
    });

    setSubtotal(sub);

    // Calculate discount
    const discVal = parseFloat(discountValue) || 0;
    let discAmt = 0;
    if (discountType === 'PERCENTAGE') {
      discAmt = sub * (discVal / 100);
    } else {
      discAmt = discVal;
    }
    setDiscountAmount(discAmt);

    const taxable = Math.max(0, sub - discAmt);
    setTaxableAmount(taxable);

    const globalGst = taxable * (settings.gstPercentage / 100);
    setGstAmount(globalGst);

    const finalTotal = taxable + globalGst;
    setTotal(finalTotal);

  }, [rows, discountType, discountValue, goldRate, settings]);

  const handleRowChange = (index: number, fields: Partial<FormRow>) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], ...fields };

    // If item selected, fill name snapshot and default charges
    if (fields.itemId !== undefined) {
      const item = items.find(i => i.id === fields.itemId);
      if (item) {
        updated[index].itemNameSnapshot = item.name;
        updated[index].makingChargeValue = item.defaultMakingCharge.toString();
      } else {
        updated[index].itemNameSnapshot = '';
        updated[index].makingChargeValue = '0';
      }
    }

    setRows(updated);
  };

  const addRow = () => {
    if (!goldRate || !settings) return;
    setRows([
      ...rows,
      {
        ...createEmptyRow(),
        goldRate: goldRate.rate22K,
        gstPercentage: settings.gstPercentage
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'info' });

    // Validate rows
    const invalidRow = rows.find(r => !r.itemNameSnapshot || !r.grossWeight || parseFloat(r.grossWeight) <= 0);
    if (invalidRow) {
      setMessage({ text: 'Please ensure all rows have an item name and a valid gross weight.', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      await billService.createBill({
        customerId: selectedCustomer || undefined,
        documentType,
        status: 'COMPLETED',
        paymentStatus,
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        discountAmount,
        taxableAmount,
        gstAmount,
        total,
        notes: notes || undefined,
        items: rows.map(r => ({
          itemId: r.itemId || undefined,
          itemNameSnapshot: r.itemNameSnapshot,
          quantity: r.quantity,
          grossWeight: parseFloat(r.grossWeight),
          stoneWeight: parseFloat(r.stoneWeight),
          netWeight: r.netWeight,
          purity: r.purity,
          goldRate: r.goldRate,
          makingChargeType: r.makingChargeType,
          makingChargeValue: parseFloat(r.makingChargeValue) || 0,
          makingChargeAmount: r.makingChargeAmount,
          hallmarkCharge: parseFloat(r.hallmarkCharge) || 0,
          wastage: parseFloat(r.wastage) || 0,
          gstPercentage: r.gstPercentage,
          gstAmount: r.gstAmount,
          amount: r.amount,
          remarks: r.remarks || undefined
        }))
      });

      setMessage({ text: 'Bill created successfully! Redirecting...', type: 'success' });
      setTimeout(() => {
        window.location.replace('/admin/bills');
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to generate bill.', type: 'error' });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading Billing Setup...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert type="error" message={error} />
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!goldRate) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert
          type="error"
          message="Today's gold rate has not been configured. Go to settings to set the daily rate."
        />
      </div>
    );
  }

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Create Transaction Bill</h1>
        <p className="text-muted">Draft a new tax invoice, quotation, or estimate ticket.</p>
      </header>

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ text: '', type: 'info' })} />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Customer Selection */}
          <div className="form-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>1. Customer Details</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: '250px' }}>
                <label htmlFor="customer-select">Select Registered Customer (Optional)</label>
                <select
                  id="customer-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">-- Guest Checkout / Walk-in Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.fullName} ({c.mobileNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <a href="/admin/customers/new" target="_blank" rel="noopener noreferrer">
                  <Button type="button" className="secondary-btn" style={{ padding: '0.75rem 1rem' }}>➕ New Customer</Button>
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Invoiced Items Rows */}
          <div className="form-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>2. Item Details</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {rows.map((row, index) => (
                <div key={index} style={{ border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      &times;
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    
                    {/* Item Master selection */}
                    <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                      <label>Jewelry Item *</label>
                      <select
                        value={row.itemId}
                        onChange={(e) => handleRowChange(index, { itemId: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      >
                        <option value="">-- Choose Item --</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>

                    {/* Custom text for manual override */}
                    <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                      <label>Item Name Snapshot *</label>
                      <input 
                        type="text"
                        value={row.itemNameSnapshot}
                        onChange={(e) => handleRowChange(index, { itemNameSnapshot: e.target.value })}
                        placeholder="e.g. Gold Ring 22K"
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="form-group" style={{ flex: 1, minWidth: '80px' }}>
                      <label>Qty</label>
                      <input 
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(index, { quantity: parseInt(e.target.value) || 1 })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>

                  {/* Weights parameters */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Gross Wt (g) *</label>
                      <input 
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.000"
                        value={row.grossWeight}
                        onChange={(e) => handleRowChange(index, { grossWeight: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Stone Wt (g)</label>
                      <input 
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.000"
                        value={row.stoneWeight}
                        onChange={(e) => handleRowChange(index, { stoneWeight: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Net Wt (g)</label>
                      <input 
                        type="text"
                        value={row.netWeight.toFixed(3)}
                        disabled
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                      <label>Purity</label>
                      <select
                        value={row.purity}
                        onChange={(e) => handleRowChange(index, { purity: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      >
                        <option value="22K">22K</option>
                        {goldRate.rate24K && <option value="24K">24K</option>}
                      </select>
                    </div>
                  </div>

                  {/* Making charges values */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1.5, minWidth: '140px' }}>
                      <label>Making Type</label>
                      <select
                        value={row.makingChargeType}
                        onChange={(e) => handleRowChange(index, { makingChargeType: e.target.value as MakingChargeType })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      >
                        <option value="FLAT">Flat ₹ per Qty</option>
                        <option value="PERCENTAGE">Percent % of Gold Value</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Making Val</label>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.makingChargeValue}
                        onChange={(e) => handleRowChange(index, { makingChargeValue: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Hallmark Charge</label>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.hallmarkCharge}
                        onChange={(e) => handleRowChange(index, { hallmarkCharge: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                      <label>Wastage (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={row.wastage}
                        onChange={(e) => handleRowChange(index, { wastage: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 3, minWidth: '220px' }}>
                      <label>Remarks</label>
                      <input 
                        type="text"
                        value={row.remarks}
                        onChange={(e) => handleRowChange(index, { remarks: e.target.value })}
                        placeholder="Size, stones counts or design description details..."
                        style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Row Net Total</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                        {formatCurrency(row.amount)}
                      </strong>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <Button type="button" className="secondary-btn" onClick={addRow} style={{ marginTop: '1.25rem', width: '100%' }}>
              ➕ Add Item Row
            </Button>
          </div>

          {/* Notes */}
          <div className="form-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>3. Terms & Notes</h2>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Exchanged old gold, custom request specifications or internal order delivery instructions..."
              rows={3}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Pricing Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
          
          <div className="form-container" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', margin: 0 }}>Document Settings</h3>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="INVOICE">Tax Invoice</option>
                <option value="ESTIMATE">Estimate</option>
                <option value="QUOTATION">Quotation</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
          </div>

          <div className="form-container" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Summary Bill</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Gross Subtotal</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(subtotal)}</span>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Discount Discount</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  style={{ flex: 1.2, padding: '0.35rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8rem' }}
                >
                  <option value="FLAT">Flat (₹)</option>
                  <option value="PERCENTAGE">Percent (%)</option>
                </select>
                <input 
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{ flex: 1, padding: '0.35rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8rem', textAlign: 'right' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Discount Applied</span>
                <span style={{ color: '#ef4444', fontWeight: '500' }}>- {formatCurrency(discountAmount)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Taxable Amount</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(taxableAmount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>GST ({formatPercent(settings?.gstPercentage || 3.0)})</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(gstAmount)}</span>
            </div>

            <div style={{ borderTop: '2px solid var(--primary)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Grand Total</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(total)}</span>
              </div>
              
              <Button type="submit" className="primary-btn" loading={saving} style={{ width: '100%', padding: '0.875rem' }}>
                Generate Bill
              </Button>
              <a href="/admin/bills" style={{ width: '100%' }}>
                <button type="button" className="secondary-btn" style={{ width: '100%', padding: '0.875rem' }}>Cancel</button>
              </a>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
