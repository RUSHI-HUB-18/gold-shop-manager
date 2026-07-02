"use client";

import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '@/types';
import { apiClient } from '@/utils/api';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { formatPercent } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import '../../admin/forms.css';

export default function AdminHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [purityFilter, setPurityFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  useEffect(() => {
    apiClient.get<{ history: HistoryEntry[] }>('/api/history')
      .then(data => {
        if (data.history) {
          setHistory(data.history);
          setFilteredHistory(data.history);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('History load error:', err);
        setLoading(false);
      });
  }, []);

  // Handle Search & Filter logic
  useEffect(() => {
    let result = history;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(h => 
        h.item.name.toLowerCase().includes(lower) || 
        h.user.username.toLowerCase().includes(lower)
      );
    }

    if (purityFilter !== 'ALL') {
      result = result.filter(h => h.purity === purityFilter);
    }

    if (userFilter !== 'ALL') {
      result = result.filter(h => h.user.username === userFilter);
    }

    setFilteredHistory(result);
  }, [searchTerm, purityFilter, userFilter, history]);

  // Extract unique usernames for filter dropdown
  const uniqueUsers = Array.from(new Set(history.map(h => h.user.username)));

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1100px' }}>
      <header className="page-header">
        <h1>Calculation History</h1>
        <p className="text-muted">View, search, and filter calculations made by all staff members.</p>
      </header>

      {/* Filter Toolbar */}
      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 300px' }}>
            <label htmlFor="search" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Search Item or Employee</label>
            <input 
              id="search"
              type="text"
              placeholder="Search by item name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label htmlFor="purity-filter" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Purity</label>
            <select 
              id="purity-filter"
              value={purityFilter}
              onChange={(e) => setPurityFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="ALL">All Purities</option>
              <option value="22K">22K</option>
              <option value="24K">24K</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label htmlFor="user-filter" style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: 'var(--muted-foreground)' }}>Employee</label>
            <select 
              id="user-filter"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="ALL">All Employees</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <Spinner size="md" />
            <span className="text-muted">Loading history...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState title="No Records" description="No calculations found matching the selected filters." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>User</th>
                  <th style={{ padding: '0.75rem' }}>Item</th>
                  <th style={{ padding: '0.75rem' }}>Weight</th>
                  <th style={{ padding: '0.75rem' }}>Purity</th>
                  <th style={{ padding: '0.75rem' }}>Rate</th>
                  <th style={{ padding: '0.75rem' }}>Making</th>
                  <th style={{ padding: '0.75rem' }}>GST</th>
                  <th style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>Final</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(h.createdAt)}</td>
                    <td style={{ padding: '0.75rem' }}>{h.user.username}</td>
                    <td style={{ padding: '0.75rem' }}>{h.item.name}</td>
                    <td style={{ padding: '0.75rem' }}>{h.weight}g</td>
                    <td style={{ padding: '0.75rem' }}>{h.purity}</td>
                    <td style={{ padding: '0.75rem' }}>{formatCurrency(h.goldRate)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatCurrency(h.makingCharge)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatPercent(h.gstPercentage)}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {formatCurrency(h.finalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
