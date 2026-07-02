"use client";

import React, { useState, useEffect } from 'react';

type Item = {
  id: string;
  name: string;
  defaultMakingCharge: number;
  isActive: boolean;
};

export default function ItemMaster() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [defaultMakingCharge, setDefaultMakingCharge] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchItems = () => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.items) setItems(data.items);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, defaultMakingCharge })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: 'Item created successfully!', type: 'success' });
        setName('');
        setDefaultMakingCharge('');
        fetchItems(); // Refresh the list
      } else {
        setMessage({ text: data.error || 'Failed to create item', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page fade-in">
      <header className="page-header">
        <h1>Item Master</h1>
        <p className="text-muted">Manage jewelry item types and their default making charges.</p>
      </header>

      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="form-container">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New Item</h2>
          {message.text && (
            <div className={`alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <div className="input-with-icon">
                <input 
                  type="text" 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Gold Ring"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="charge">Default Making Charge (₹) *</label>
              <div className="input-with-icon">
                <span className="currency-symbol">₹</span>
                <input 
                  type="number" 
                  id="charge"
                  value={defaultMakingCharge}
                  onChange={(e) => setDefaultMakingCharge(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Add Item'}
            </button>
          </form>
        </div>

        <div className="form-container">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Items</h2>
          {loading ? (
            <div className="text-muted">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-muted">No items found. Add one above.</div>
          ) : (
            <div className="data-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Item Name</th>
                    <th style={{ padding: '0.75rem' }}>Default Charge</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{item.name}</td>
                      <td style={{ padding: '0.75rem' }} className="gold-text font-semibold">₹ {item.defaultMakingCharge.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '999px', 
                          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                          color: '#16a34a',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
