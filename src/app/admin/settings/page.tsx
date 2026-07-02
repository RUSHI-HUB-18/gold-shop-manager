"use client";

import React, { useState, useEffect } from 'react';

export default function SettingsManagement() {
  const [gstPercentage, setGstPercentage] = useState('');
  const [rate22K, setRate22K] = useState('');
  const [rate24K, setRate24K] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
  const [rateMessage, setRateMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => {
        if (res.status === 401) {
          window.location.replace('/');
          throw new Error('Unauthorized');
        }
        return res.json();
      }),
      fetch('/api/gold-rate').then(res => {
        if (res.status === 401) {
          window.location.replace('/');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
    ]).then(([settingsData, rateData]) => {
      if (settingsData.settings && settingsData.settings.gstPercentage) {
        setGstPercentage(settingsData.settings.gstPercentage.toString());
      }
      if (rateData.goldRate) {
        setRate22K(rateData.goldRate.rate22K.toString());
        if (rateData.goldRate.rate24K) setRate24K(rateData.goldRate.rate24K.toString());
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstPercentage })
      });

      if (res.status === 401) {
        window.location.replace('/');
        return;
      }

      const data = await res.json();
      
      if (res.ok) {
        setSettingsMessage({ text: 'GST settings updated successfully!', type: 'success' });
      } else {
        setSettingsMessage({ text: data.error || 'Failed to update settings', type: 'error' });
      }
    } catch (err) {
      setSettingsMessage({ text: 'Network error occurred', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRate(true);
    setRateMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/gold-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate22K, rate24K })
      });

      if (res.status === 401) {
        window.location.replace('/');
        return;
      }

      const data = await res.json();
      
      if (res.ok) {
        setRateMessage({ text: 'Gold rate updated successfully for today!', type: 'success' });
      } else {
        setRateMessage({ text: data.error || 'Failed to update rate', type: 'error' });
      }
    } catch (err) {
      setRateMessage({ text: 'Network error occurred', type: 'error' });
    } finally {
      setSavingRate(false);
    }
  };

  if (loading) return <div className="loading-state">Loading configuration settings...</div>;

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '900px' }}>
      <header className="page-header">
        <h1>System Settings</h1>
        <p className="text-muted">Configure store settings, daily rates, and default parameters.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Gold Rate settings card */}
        <div className="form-container">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>Daily Gold Rate</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Set the fixed gold rate for today. This will instantly apply to all staff calculators.</p>
          
          {rateMessage.text && (
            <div className={`alert ${rateMessage.type}`}>
              {rateMessage.text}
            </div>
          )}

          <form onSubmit={handleRateSubmit} className="premium-form">
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label htmlFor="rate22K">22K Gold Rate (per gram) *</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">₹</span>
                  <input 
                    type="number" 
                    id="rate22K"
                    value={rate22K}
                    onChange={(e) => setRate22K(e.target.value)}
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 6500"
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label htmlFor="rate24K">24K Gold Rate (per gram) (Optional)</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">₹</span>
                  <input 
                    type="number" 
                    id="rate24K"
                    value={rate24K}
                    onChange={(e) => setRate24K(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="e.g. 7000"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={savingRate} style={{ alignSelf: 'flex-start' }}>
              {savingRate ? 'Updating...' : 'Set Today\'s Rate'}
            </button>
          </form>
        </div>

        {/* GST settings card */}
        <div className="form-container">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>Taxation (GST) Settings</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Configure global tax parameters. Staff members cannot override this value during calculation.</p>
          
          {settingsMessage.text && (
            <div className={`alert ${settingsMessage.type}`}>
              {settingsMessage.text}
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="premium-form">
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label htmlFor="gst">Global GST Percentage (%) *</label>
              <div className="input-with-icon">
                <span className="currency-symbol">%</span>
                <input 
                  type="number" 
                  id="gst"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 3.0"
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={savingSettings} style={{ alignSelf: 'flex-start' }}>
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
