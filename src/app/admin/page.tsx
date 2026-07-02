"use client";

import React, { useState, useEffect } from 'react';
import { DashboardStats } from '@/types';
import { apiClient } from '@/utils/api';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<DashboardStats>('/api/dashboard-stats')
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
      <div className="dashboard-container fade-in">
        <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <Skeleton width="150px" height="32px" />
          <Skeleton width="300px" height="20px" style={{ marginTop: '0.5rem' }} />
        </header>
        
        <div className="stats-grid">
          <Card>
            <Skeleton width="140px" height="18px" />
            <Skeleton width="110px" height="36px" style={{ marginTop: '1rem' }} />
            <Skeleton width="200px" height="14px" style={{ marginTop: '0.8rem' }} />
          </Card>
          
          <Card>
            <Skeleton width="140px" height="18px" />
            <Skeleton width="50px" height="36px" style={{ marginTop: '1rem' }} />
            <Skeleton width="110px" height="14px" style={{ marginTop: '0.8rem' }} />
          </Card>
          
          <Card>
            <Skeleton width="140px" height="18px" />
            <Skeleton width="50px" height="36px" style={{ marginTop: '1rem' }} />
            <Skeleton width="140px" height="14px" style={{ marginTop: '0.8rem' }} />
          </Card>
        </div>
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
        <Card className="stat-card">
          <h3 className="stat-label">Today&apos;s Gold Rate (22K)</h3>
          <p className="stat-value gold-text" style={{ margin: '0.5rem 0' }}>
            {stats?.rate22K ? formatCurrency(stats.rate22K) : '₹0.00'} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--muted-foreground)' }}>/g</span>
          </p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: stats?.lastUpdated ? '#16a34a' : 'var(--muted-foreground)', fontWeight: stats?.lastUpdated ? '600' : 'normal' }}>
            {lastUpdatedText}
          </span>
        </Card>
        
        <Card className="stat-card">
          <h3 className="stat-label">Calculations Today</h3>
          <p className="stat-value" style={{ margin: '0.5rem 0' }}>{stats?.calculationsCount || 0}</p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Across all staff</span>
        </Card>
        
        <Card className="stat-card">
          <h3 className="stat-label">Active Items</h3>
          <p className="stat-value" style={{ margin: '0.5rem 0' }}>{stats?.activeItemsCount || 0}</p>
          <span className="stat-indicator" style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Item types configured</span>
        </Card>
      </div>
    </div>
  );
}
