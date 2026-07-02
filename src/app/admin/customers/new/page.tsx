"use client";

import React, { useState } from 'react';
import { customerService } from '@/services/customerService';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function NewCustomer() {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [gstNumber, setGstNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'info' });

    try {
      await customerService.createCustomer({
        fullName,
        mobileNumber,
        email: email || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        gstNumber: gstNumber || undefined,
        birthDate: birthDate || null,
        anniversary: anniversary || null,
        notes: notes || undefined
      });
      
      setMessage({ text: 'Customer created successfully! Redirecting...', type: 'success' });
      setTimeout(() => {
        window.location.replace('/admin/customers');
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to register customer.', type: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '800px' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Add New Customer</h1>
        <p className="text-muted">Register a new store customer profile.</p>
      </header>

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ text: '', type: 'info' })} />
      )}

      <form onSubmit={handleSubmit} className="premium-form" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
        
        {/* Section 1: Basic Information */}
        <div className="form-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input 
              type="text" 
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Rushikesh Sonar"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
              <label htmlFor="mobileNumber">Mobile Number *</label>
              <input 
                type="tel" 
                id="mobileNumber"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="e.g. 9876543210"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
              <label htmlFor="email">Email Address (Optional)</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@gmail.com"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address Details */}
        <div className="form-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Address Details</h2>
          
          <div className="form-group">
            <label htmlFor="address">Street Address</label>
            <input 
              type="text" 
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 301, Gold Plaza"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
              <label htmlFor="city">City</label>
              <input 
                type="text" 
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
            
            <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
              <label htmlFor="state">State</label>
              <input 
                type="text" 
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
              <label htmlFor="pincode">Pincode</label>
              <input 
                type="text" 
                id="pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="411001"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Business & Personal Info */}
        <div className="form-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Additional Profile Information</h2>
          
          <div className="form-group">
            <label htmlFor="gstNumber">GST Number (Optional)</label>
            <input 
              type="text" 
              id="gstNumber"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. 27AAAAA1111A1Z1"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
              <label htmlFor="birthDate">Birth Date (Optional)</label>
              <input 
                type="date" 
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
              <label htmlFor="anniversary">Anniversary Date (Optional)</label>
              <input 
                type="date" 
                id="anniversary"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Remarks/Notes</label>
            <textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any preferences, purchase history reference or family relations details..."
              rows={3}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <a href="/admin/customers">
            <button type="button" className="secondary-btn" style={{ padding: '0.875rem 2rem' }}>Cancel</button>
          </a>
          <Button type="submit" className="primary-btn" loading={saving} style={{ padding: '0.875rem 2.5rem' }}>
            Register Customer
          </Button>
        </div>

      </form>
    </div>
  );
}
