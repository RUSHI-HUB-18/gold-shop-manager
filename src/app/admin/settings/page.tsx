"use client";

import React, { useState, useEffect } from 'react';
import { settingsService } from '@/services/settingsService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function SettingsManagement() {
  const [gstPercentage, setGstPercentage] = useState('');
  const [rate22K, setRate22K] = useState('');
  const [rate24K, setRate24K] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
  const [rateMessage, setRateMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    Promise.all([
      settingsService.getSettings(),
      settingsService.getGoldRate()
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
      console.error('Settings load error:', err);
      setLoading(false);
    });
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ text: '', type: 'info' });

    try {
      await settingsService.updateSettings(parseFloat(gstPercentage));
      setSettingsMessage({ text: 'GST settings updated successfully!', type: 'success' });
    } catch (err: any) {
      setSettingsMessage({ text: err.message || 'Failed to update settings', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRate(true);
    setRateMessage({ text: '', type: 'info' });

    try {
      const parsed22K = parseFloat(rate22K);
      const parsed24K = rate24K ? parseFloat(rate24K) : null;
      await settingsService.updateGoldRate(parsed22K, parsed24K);
      setRateMessage({ text: 'Gold rate updated successfully for today!', type: 'success' });
    } catch (err: any) {
      setRateMessage({ text: err.message || 'Failed to update rate', type: 'error' });
    } finally {
      setSavingRate(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading configuration settings...</p>
      </div>
    );
  }

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
            <Alert type={rateMessage.type} message={rateMessage.text} onClose={() => setRateMessage({ text: '', type: 'info' })} />
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

            <Button type="submit" className="primary-btn" loading={savingRate} style={{ alignSelf: 'flex-start' }}>
              Set Today's Rate
            </Button>
          </form>
        </div>

        {/* GST settings card */}
        <div className="form-container">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>Taxation (GST) Settings</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Configure global tax parameters. Staff members cannot override this value during calculation.</p>
          
          {settingsMessage.text && (
            <Alert type={settingsMessage.type} message={settingsMessage.text} onClose={() => setSettingsMessage({ text: '', type: 'info' })} />
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

            <Button type="submit" className="primary-btn" loading={savingSettings} style={{ alignSelf: 'flex-start' }}>
              Save Settings
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
