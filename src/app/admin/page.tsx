"use client";

import React, { useState, useEffect } from 'react';

type Stats = {
  rate22K: number;
  lastUpdated: string | null;
  updatedBy: string | null;
  calculationsCount: number;
  activeItemsCount: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard stats fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading overview stats...</p>
      </div>
    );
  }

  const lastUpdatedText = stats?.lastUpdated 
    ? `Updated at ${new Date(stats.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} by ${stats.updatedBy || 'Admin'}`
    : 'Not set yet today';

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <h1>Overview</h1>
        <p className="text-muted">Welcome back, Admin. Here is today&apos;s summary.</p>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-label">Today&apos;s Gold Rate (22K)</h3>
          <p className="stat-value gold-text">
            ₹ {stats?.rate22K ? stats.rate22K.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--muted-foreground)' }}>/g</span>
          </p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: stats?.lastUpdated ? '#16a34a' : 'var(--muted-foreground)', fontWeight: stats?.lastUpdated ? '600' : 'normal' }}>
            {lastUpdatedText}
          </span>
        </div>
        
        <div className="stat-card">
          <h3 className="stat-label">Calculations Today</h3>
          <p className="stat-value">{stats?.calculationsCount || 0}</p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Across all staff</span>
        </div>
        
        <div className="stat-card">
          <h3 className="stat-label">Active Items</h3>
          <p className="stat-value">{stats?.activeItemsCount || 0}</p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Item types configured</span>
        </div>
      </div>
    </div>
  );
}
