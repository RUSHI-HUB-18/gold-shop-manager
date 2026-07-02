"use client";

import React, { useState, useEffect } from 'react';
import { Item } from '@/types';
import { apiClient } from '@/utils/api';
import { formatCurrency } from '@/utils/currency';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function ItemMaster() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [defaultMakingCharge, setDefaultMakingCharge] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  const fetchItems = () => {
    apiClient.get<{ items: Item[] }>('/api/items')
      .then(data => {
        if (data.items) setItems(data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch items error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'info' });

    try {
      await apiClient.post('/api/items', { name, defaultMakingCharge });
      setMessage({ text: 'Item created successfully!', type: 'success' });
      setName('');
      setDefaultMakingCharge('');
      fetchItems(); // Refresh the list
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create item', type: 'error' });
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
            <Alert type={message.type} message={message.text} onClose={() => setMessage({ text: '', type: 'info' })} />
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

            <Button type="submit" className="primary-btn" loading={saving}>
              Add Item
            </Button>
          </form>
        </div>

        <div className="form-container">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Items</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem' }}>
              <Spinner size="md" />
              <span className="text-muted">Loading items...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No Items Found" description="Add your first jewelry item type using the form on the left." />
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
                      <td style={{ padding: '0.75rem' }} className="gold-text font-semibold">{formatCurrency(item.defaultMakingCharge)}</td>
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
