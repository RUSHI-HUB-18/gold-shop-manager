"use client";

import React from 'react';
import './admin.css';
import './forms.css';

import { APP_CONFIG } from '@/config/app';
import { authService } from '@/services/authService';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.replace('/');
  };

  const nameParts = APP_CONFIG.NAME.split(' ');
  const firstWord = nameParts[0];
  const restWords = nameParts.slice(1).join(' ');

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="gold-accent">{firstWord}</span> {restWords}
        </div>
        <nav className="nav-menu">
          <a href="/admin" className="nav-item">Dashboard</a>
          <a href="/admin/calculator" className="nav-item" style={{ color: 'var(--primary)', fontWeight: '600' }}>⚡ Calculator</a>
          <a href="/admin/customers" className="nav-item">👥 Customers</a>
          <a href="/admin/bills" className="nav-item">🧾 Billing</a>
          <a href="/admin/reports" className="nav-item">📈 Reports</a>
          <a href="/admin/items" className="nav-item">Item Master</a>
          <a href="/admin/settings" className="nav-item">Settings</a>
          <a href="/admin/history" className="nav-item">History</a>
        </nav>
        <div className="bottom-nav">
          <a href="/" onClick={handleLogout} className="nav-item text-muted">Logout</a>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
