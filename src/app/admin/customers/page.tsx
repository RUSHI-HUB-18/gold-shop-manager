"use client";

import React, { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { customerService } from '@/services/customerService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Summary Stats State
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  });

  const [message, setMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    customerService.getCustomers({ search, status, page, limit })
      .then(res => {
        setCustomers(res.customers);
        setTotalPages(res.pagination.totalPages);
        setStats(res.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customers:', err);
        setError(err.message || 'Failed to retrieve customers list.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [status, page]);

  // Handle search action
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this customer profile?')) return;
    
    setDeactivatingId(id);
    try {
      await customerService.deleteCustomer(id);
      setMessage({ text: 'Customer account deactivated successfully!', type: 'success' });
      fetchCustomers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to deactivate customer.', type: 'error' });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Customer Registry</h1>
          <p className="text-muted">Manage store customer directories, billing histories, and profile logs.</p>
        </div>
        <a href="/admin/customers/new">
          <Button className="primary-btn">➕ Add Customer</Button>
        </a>
      </header>

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ text: '', type: 'info' })} />
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Profiles</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.active}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inactive Accounts</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>{stats.inactive}</span>
        </Card>
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New This Month</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.newThisMonth}</span>
        </Card>
      </div>

      {/* Search & Filter bar */}
      <Card style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 300px' }}>
            <input 
              type="text" 
              placeholder="Search by name, customer code (CUS-XXXX), or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            >
              <option value="ACTIVE">Active Profiles</option>
              <option value="INACTIVE">Inactive Accounts</option>
              <option value="ALL">All Accounts</option>
            </select>
          </div>
          <Button type="submit" style={{ padding: '0.75rem 1.5rem' }}>Search</Button>
        </form>
      </Card>

      {/* Main Table */}
      <div className="form-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <Spinner size="lg" />
            <span className="text-muted">Loading customer records...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem' }}>
            <Alert type="error" message={error} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState title="No Customers Found" description="Try broadening your search criteria or register a new customer profile." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                    <th style={{ padding: '1rem 0.75rem' }}>Customer Code</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Name</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Mobile Number</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Location</th>
                    <th style={{ padding: '1rem 0.75rem' }}>GST Number</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {customer.customerCode}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar fullName={customer.fullName} size="sm" />
                          <span style={{ fontWeight: '500' }}>{customer.fullName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>{customer.mobileNumber}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {customer.city || customer.state 
                          ? `${customer.city || ''}${customer.city && customer.state ? ', ' : ''}${customer.state || ''}`
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {customer.gstNumber || <span className="text-muted">—</span>}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          backgroundColor: customer.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: customer.status === 'ACTIVE' ? '#16a34a' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {customer.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <a href={`/admin/customers/${customer.id}`}>
                            <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Profile</button>
                          </a>
                          <a href={`/admin/customers/edit/${customer.id}`}>
                            <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Edit</button>
                          </a>
                          {customer.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDeactivate(customer.id)}
                              disabled={deactivatingId === customer.id}
                              className="secondary-btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </Button>
                  <Button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
