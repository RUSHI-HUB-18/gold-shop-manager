"use client";

import React, { useState, useEffect } from 'react';
import { Item, GoldRate, SystemSettings } from '@/types';
import { apiClient } from '@/utils/api';
import { formatCurrency } from '@/utils/currency';
import { formatPercent } from '@/utils/format';
import { calculatorService } from '@/services/calculatorService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Calculator() {
  const [items, setItems] = useState<Item[]>([]);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState('');
  const [makingCharge, setMakingCharge] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' as 'success' | 'error' | 'warning' | 'info' });

  // Calculation Results
  const [results, setResults] = useState({
    goldValue: 0,
    totalMakingCharge: 0,
    subtotal: 0,
    gstAmount: 0,
    finalAmount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, rateData, settingsData] = await Promise.all([
          apiClient.get<{ items: Item[] }>('/api/items'),
          apiClient.get<{ goldRate: GoldRate }>('/api/gold-rate'),
          apiClient.get<{ settings: SystemSettings }>('/api/settings')
        ]);

        if (itemsData.items) setItems(itemsData.items);
        if (rateData.goldRate) setGoldRate(rateData.goldRate);
        if (settingsData.settings) setSettings(settingsData.settings);
        setLoading(false);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load configuration.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update Making charge default when item selected
  useEffect(() => {
    if (selectedItem) {
      const item = items.find(i => i.id === selectedItem);
      if (item) setMakingCharge(item.defaultMakingCharge.toString());
    }
  }, [selectedItem, items]);

  // Real-time calculation
  useEffect(() => {
    if (!goldRate || !settings) return;

    const w = parseFloat(weight) || 0;
    const mc = parseFloat(makingCharge) || 0;

    const ratePerGram = purity === '22K' ? goldRate.rate22K : (goldRate.rate24K || goldRate.rate22K);
    
    const calcResults = calculatorService.calculate({
      weight: w,
      makingCharge: mc,
      goldRate: ratePerGram,
      gstPercentage: settings.gstPercentage
    });

    setResults({
      goldValue: calcResults.goldValue,
      totalMakingCharge: calcResults.makingCharges,
      subtotal: calcResults.subtotal,
      gstAmount: calcResults.gstAmount,
      finalAmount: calcResults.finalAmount
    });
  }, [weight, makingCharge, purity, goldRate, settings]);

  const handleSave = async () => {
    if (!selectedItem || !weight || parseFloat(weight) <= 0) {
      setSaveMessage({ text: 'Please select an item and enter a valid weight.', type: 'error' });
      return;
    }
    if (!goldRate || !settings) return;

    setSaving(true);
    setSaveMessage({ text: '', type: 'info' });

    try {
      const activeRate = purity === '22K' ? goldRate.rate22K : (goldRate.rate24K || goldRate.rate22K);
      await apiClient.post('/api/history', {
        itemId: selectedItem,
        weight: parseFloat(weight),
        purity,
        goldRate: activeRate,
        makingCharge: parseFloat(makingCharge) || 0,
        gstPercentage: settings.gstPercentage,
        finalAmount: results.finalAmount
      });
      setSaveMessage({ text: '✓ Calculation saved to history!', type: 'success' });
    } catch (err: any) {
      setSaveMessage({ text: err.message || 'Network error while saving.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedItem('');
    setPurity('22K');
    setWeight('');
    setMakingCharge('');
    setSaveMessage({ text: '', type: 'info' });
    setResults({ goldValue: 0, totalMakingCharge: 0, subtotal: 0, gstAmount: 0, finalAmount: 0 });
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading Calculator Engine...</p>
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
          message="Today's gold rate has not been set yet. Please visit the Settings page to configure it."
        />
      </div>
    );
  }

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1000px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Quick Calculator</h1>
          <p className="text-muted">Instant, accurate pricing for customers.</p>
        </div>
        <div style={{ textAlign: 'right', background: 'linear-gradient(135deg, #d4af37, #b8962e)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Today&apos;s 22K Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(goldRate.rate22K)}</div>
        </div>
      </header>

      {saveMessage.text && (
        <Alert type={saveMessage.type} message={saveMessage.text} onClose={() => setSaveMessage({ text: '', type: 'info' })} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Input Form */}
        <div className="form-container">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>Calculation Inputs</h2>
          <form className="premium-form" onSubmit={e => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="calc-item">Select Item *</label>
              <select
                id="calc-item"
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '1rem' }}
              >
                <option value="">-- Choose Item --</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="calc-purity">Purity</label>
                <select
                  id="calc-purity"
                  value={purity}
                  onChange={e => setPurity(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '1rem' }}
                >
                  <option value="22K">22K</option>
                  {goldRate.rate24K && <option value="24K">24K</option>}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="calc-weight">Weight (grams) *</label>
                <input
                  type="number"
                  id="calc-weight"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="calc-making">Making Charge (Flat ₹)</label>
              <div className="input-with-icon">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  id="calc-making"
                  step="0.01"
                  min="0"
                  value={makingCharge}
                  onChange={e => setMakingCharge(e.target.value)}
                />
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Auto-filled from item defaults. You can edit this.</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Button type="button" className="primary-btn" style={{ flex: 1 }} onClick={handleSave} loading={saving}>
                Save Calculation
              </Button>
              <button type="button" onClick={handleReset} style={{ flex: 0.5, padding: '0.875rem 1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Live Bill Breakdown */}
        <div className="form-container" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', color: 'var(--muted-foreground)' }}>Live Breakdown</h2>

          <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Gold Value ({purity})</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(results.goldValue)}</span>
          </div>
          <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Making Charges</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(results.totalMakingCharge)}</span>
          </div>
          <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', marginBottom: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: '600' }}>{formatCurrency(results.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>GST ({formatPercent(settings?.gstPercentage || 0)})</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(results.gstAmount)}</span>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '2px solid var(--primary)', paddingTop: '1.5rem', display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Final Amount</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(results.finalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
