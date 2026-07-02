"use client";

import React, { useState, useEffect } from 'react';

type Item = { id: string; name: string; defaultMakingCharge: number; };
type GoldRate = { rate22K: number; rate24K: number | null; date: string; updatedAt: string; };
type Settings = { gstPercentage: number; };

export default function Calculator() {
  const [items, setItems] = useState<Item[]>([]);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState('');
  const [makingCharge, setMakingCharge] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

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
        const [itemsRes, rateRes, settingsRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/gold-rate'),
          fetch('/api/settings')
        ]);

        if (!itemsRes.ok || !rateRes.ok || !settingsRes.ok) {
          setError('Failed to load data from server. Please try refreshing.');
          setLoading(false);
          return;
        }

        const [itemsData, rateData, settingsData] = await Promise.all([
          itemsRes.json(),
          rateRes.json(),
          settingsRes.json()
        ]);

        if (itemsData.items) setItems(itemsData.items);
        if (rateData.goldRate) setGoldRate(rateData.goldRate);
        if (settingsData.settings) setSettings(settingsData.settings);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error. Please check your connection.');
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
    const goldValue = w * ratePerGram;
    const totalMakingCharge = mc;
    const subtotal = goldValue + totalMakingCharge;
    const gstAmount = (subtotal * settings.gstPercentage) / 100;
    const finalAmount = subtotal + gstAmount;

    setResults({ goldValue, totalMakingCharge, subtotal, gstAmount, finalAmount });
  }, [weight, makingCharge, purity, goldRate, settings]);

  const handleSave = async () => {
    if (!selectedItem || !weight || parseFloat(weight) <= 0) {
      setSaveMessage({ text: 'Please select an item and enter a valid weight.', type: 'error' });
      return;
    }
    if (!goldRate || !settings) return;

    setSaving(true);
    setSaveMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          itemId: selectedItem,
          weight: parseFloat(weight),
          purity,
          goldRate: purity === '22K' ? goldRate.rate22K : (goldRate.rate24K || goldRate.rate22K),
          makingCharge: parseFloat(makingCharge) || 0,
          gstPercentage: settings.gstPercentage,
          finalAmount: results.finalAmount
        })
      });

      if (res.ok) {
        setSaveMessage({ text: '✓ Calculation saved to history!', type: 'success' });
      } else {
        const data = await res.json();
        setSaveMessage({ text: data.error || 'Failed to save', type: 'error' });
      }
    } catch (err) {
      setSaveMessage({ text: 'Network error while saving.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedItem('');
    setPurity('22K');
    setWeight('');
    setMakingCharge('');
    setSaveMessage({ text: '', type: '' });
    setResults({ goldValue: 0, totalMakingCharge: 0, subtotal: 0, gstAmount: 0, finalAmount: 0 });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading Calculator Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="alert error">{error}</div>
        <button className="primary-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!goldRate) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="alert error" style={{ fontSize: '1.1rem' }}>
          ⚠️ Today&apos;s gold rate has not been set yet. Go to <a href="/admin/settings" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Settings</a> to set the rate.
        </div>
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
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹ {goldRate.rate22K.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </header>

      {saveMessage.text && (
        <div className={`alert ${saveMessage.type}`} style={{ marginBottom: '1.5rem' }}>
          {saveMessage.text}
        </div>
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
              <button type="button" className="primary-btn" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Calculation'}
              </button>
              <button type="button" onClick={handleReset} style={{ flex: 0.5, padding: '0.875rem 1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Live Bill Breakdown */}
        <div className="form-container" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', color: 'var(--muted-foreground)' }}>Live Breakdown</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Gold Value ({purity})</span>
            <span style={{ fontWeight: '500' }}>₹ {results.goldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Making Charges</span>
            <span style={{ fontWeight: '500' }}>₹ {results.totalMakingCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: '600' }}>₹ {results.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>GST ({settings?.gstPercentage}%)</span>
            <span style={{ fontWeight: '500' }}>₹ {results.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '2px solid var(--primary)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Final Amount</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹ {results.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
