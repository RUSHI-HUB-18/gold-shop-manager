"use client";

import React from 'react';
import './admin.css';
import './forms.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.replace('/');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="gold-accent">Aura</span> Gold
        </div>
        <nav className="nav-menu">
          <a href="/admin" className="nav-item">Dashboard</a>
          <a href="/admin/calculator" className="nav-item" style={{ color: 'var(--primary)', fontWeight: '600' }}>⚡ Calculator</a>
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
