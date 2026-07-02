"use client";

import React, { useState, useEffect, useRef } from 'react';
import { settingsService } from '@/services/settingsService';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';

export default function ShopProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Daily Gold Rate State
  const [rate22K, setRate22K] = useState('');
  const [rate24K, setRate24K] = useState('');
  const [rateMessage, setRateMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  // Shop settings State
  const [shopName, setShopName] = useState('Gold Shop Manager');
  const [shopAddress, setShopAddress] = useState('123, Gold Plaza, Jewel Street');
  const [shopPhone, setShopPhone] = useState('+91 98765 43210');
  const [shopEmail, setShopEmail] = useState('info@goldshop.com');
  const [shopWebsite, setShopWebsite] = useState('www.goldshop.com');
  const [shopGstNumber, setShopGstNumber] = useState('27AAAAA1111A1Z1');
  const [shopLogo, setShopLogo] = useState('/uploads/shop-logo.png');
  const [invoiceTerms, setInvoiceTerms] = useState('1. Goods once sold cannot be returned or exchanged. 2. Subject to local jurisdiction.');
  const [enableQrCode, setEnableQrCode] = useState(true);
  const [gstPercentage, setGstPercentage] = useState('3.0');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Preview properties
  const [ownerName, setOwnerName] = useState('Rushikesh Sonar');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400001');

  // Expansion placeholders (Future modules)
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNo, setAccountNo] = useState('XXXX-XXXX-XXXX-1234');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [upiId, setUpiId] = useState('goldshop@sbi');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [msmeNumber, setMsmeNumber] = useState('UDYAM-MH-00-123456');

  // Messages
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      settingsService.getSettings(),
      settingsService.getGoldRate()
    ]).then(([settingsData, rateData]) => {
      if (settingsData.settings) {
        const s = settingsData.settings;
        setShopName(s.shopName || 'Gold Shop Manager');
        setShopAddress(s.shopAddress || '');
        setShopPhone(s.shopPhone || '');
        setShopEmail(s.shopEmail || '');
        setShopWebsite(s.shopWebsite || '');
        setShopGstNumber(s.shopGstNumber || '');
        setShopLogo(s.shopLogo || '/uploads/shop-logo.png');
        setInvoiceTerms(s.invoiceTerms || '');
        setEnableQrCode(s.enableQrCode !== false);
        setGstPercentage(s.gstPercentage ? s.gstPercentage.toString() : '3.0');
        setCurrency(s.currency || 'INR');
        setTimezone(s.timezone || 'Asia/Kolkata');
      }
      if (rateData.goldRate) {
        setRate22K(rateData.goldRate.rate22K.toString());
        if (rateData.goldRate.rate24K) setRate24K(rateData.goldRate.rate24K.toString());
      }
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load profile:', err);
      setLoading(false);
    });
  }, []);

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRate(true);
    setRateMessage({ text: '', type: 'info' });
    try {
      const parsed22K = parseFloat(rate22K);
      const parsed24K = rate24K ? parseFloat(rate24K) : null;
      await settingsService.updateGoldRate(parsed22K, parsed24K);
      setRateMessage({ text: "Today's gold rates updated successfully!", type: 'success' });
    } catch (err: any) {
      setRateMessage({ text: err.message || 'Failed to update rates', type: 'error' });
    } finally {
      setSavingRate(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ text: '', type: 'info' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstPercentage: parseFloat(gstPercentage),
          shopName,
          shopAddress,
          shopPhone,
          shopEmail,
          shopWebsite,
          shopGstNumber,
          shopLogo,
          invoiceTerms,
          enableQrCode,
          currency,
          timezone
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update Shop Profile.');
      }

      setSettingsMessage({ text: '✓ Shop Profile Updated Successfully!', type: 'success' });
    } catch (err: any) {
      setSettingsMessage({ text: err.message || 'Failed to save settings changes', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setSettingsMessage({ text: '', type: 'info' });

    try {
      // 1. Client-side Image Optimization & Resizing using Canvas
      const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600; // Optimal width for headers
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to create canvas context'));
              return;
            }

            // Draw image to strip EXIF and preserve alpha transparency for PNGs
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Canvas blob conversion failed'));
                }
              },
              'image/png' // Retain alpha transparency
            );
          };
          img.onerror = () => reject(new Error('Failed to load image file.'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append('file', optimizedBlob, 'logo.png');

      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setShopLogo(data.logoPath);
      setSettingsMessage({ text: 'Logo uploaded and optimized successfully! Preview active.', type: 'success' });
    } catch (err: any) {
      setSettingsMessage({ text: err.message || 'Logo upload failed', type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const restoreDefaults = (type: 'terms' | 'gst' | 'currency') => {
    if (type === 'terms') {
      setInvoiceTerms('1. Goods once sold cannot be returned or exchanged. 2. Subject to local jurisdiction.');
    } else if (type === 'gst') {
      setGstPercentage('3.0');
    } else if (type === 'currency') {
      setCurrency('INR');
      setTimezone('Asia/Kolkata');
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Spinner size="lg" />
        <p style={{ opacity: 0.7 }}>Loading Business Profile settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-page fade-in" style={{ maxWidth: '1200px' }}>
      
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1>⚙️ Shop Profile & Business Settings</h1>
        <p className="text-muted">Configure store identity metadata, invoices defaults, print layouts, and daily rates.</p>
      </header>

      {/* Main Grid: Inputs on Left, Invoice Live Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Forms Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* DAILY RATES */}
          <div className="form-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>Daily Gold Rates</h2>
            {rateMessage.text && (
              <Alert type={rateMessage.type} message={rateMessage.text} onClose={() => setRateMessage({ text: '', type: 'info' })} />
            )}
            <form onSubmit={handleRateSubmit} style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px', margin: 0 }}>
                <label>22K Gold Rate (per gram) *</label>
                <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted-foreground)' }}>₹</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={rate22K}
                    onChange={(e) => setRate22K(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '180px', margin: 0 }}>
                <label>24K Gold Rate (per gram) (Optional)</label>
                <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted-foreground)' }}>₹</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={rate24K}
                    onChange={(e) => setRate24K(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <Button type="submit" className="primary-btn" loading={savingRate} style={{ padding: '0.6rem 1.25rem' }}>
                Update Today's Rates
              </Button>
            </form>
          </div>

          {/* MAIN SETTINGS FORM */}
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {settingsMessage.text && (
              <Alert type={settingsMessage.type} message={settingsMessage.text} onClose={() => setSettingsMessage({ text: '', type: 'info' })} />
            )}

            {/* SECTION 1: BUSINESS PROFILE */}
            <div className="form-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>1. Business Profile</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Store Name *</label>
                  <input 
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Owner / Director Name</label>
                  <input 
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Store Mobile *</label>
                  <input 
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Store Email Address</label>
                  <input 
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Store Website Url</label>
                  <input 
                    type="text"
                    value={shopWebsite}
                    onChange={(e) => setShopWebsite(e.target.value)}
                    placeholder="e.g. www.goldshop.com"
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: STORE ADDRESS DETAILS */}
            <div className="form-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>2. Store Location</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 4' }}>
                  <label>Street Address Address</label>
                  <input 
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="123, Gold Plaza, Jewel Street"
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>City</label>
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input 
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: INVOICE LOGOS & CONFIGURATION DETAILS */}
            <div className="form-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>3. Invoice & Branding preferences</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Logo settings upload */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)' }}>
                    <img src={shopLogo} alt="Shop logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>Store logo path: <strong>{shopLogo}</strong></span>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button type="button" onClick={() => logoInputRef.current?.click()} className="secondary-btn" loading={uploadingLogo} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Upload Logo Image
                      </Button>
                      {shopLogo !== '/uploads/shop-logo.png' && (
                        <Button type="button" onClick={() => setShopLogo('/uploads/shop-logo.png')} className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444' }}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="checkbox"
                    id="enable-qr"
                    checked={enableQrCode}
                    onChange={(e) => setEnableQrCode(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="enable-qr" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                    Print Verification QR Code on Invoices
                  </label>
                </div>

                {/* Terms conditions text box */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ margin: 0 }}>Invoice Terms & Conditions *</label>
                    <button type="button" onClick={() => restoreDefaults('terms')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                      [ Restore Default ]
                    </button>
                  </div>
                  <textarea 
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    rows={4}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                </div>

              </div>
            </div>

            {/* SECTION 4: DEFAULT TAXATION & PREFERENCES */}
            <div className="form-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>4. Taxation & Currency preferences</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Store GSTIN *</label>
                  <input 
                    type="text"
                    value={shopGstNumber}
                    onChange={(e) => setShopGstNumber(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ margin: 0 }}>Default GST % *</label>
                    <button type="button" onClick={() => restoreDefaults('gst')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>
                      [ Reset ]
                    </button>
                  </div>
                  <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted-foreground)' }}>%</span>
                    <input 
                      type="number"
                      step="0.1"
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Currency Option</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option value="INR">INR (Rupees ₹)</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3', margin: 0 }}>
                  <label>Local Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - Indian Standard Time)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* SECTION 5: FUTURE EXPANSION INDICATORS */}
            <div className="form-container" style={{ padding: '1.5rem', opacity: 0.7 }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>5. Advanced Preferences (Expansion Slots)</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input type="text" value={panNumber} disabled style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>MSME Udyam Number</label>
                  <input type="text" value={msmeNumber} disabled style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={bankName} disabled style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>UPI Payment Address ID</label>
                  <input type="text" value={upiId} disabled style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            {/* Form Save Button */}
            <Button type="submit" className="primary-btn" loading={savingSettings} style={{ padding: '0.875rem 2rem', alignSelf: 'flex-start' }}>
              Save Shop Profile
            </Button>

          </form>

        </div>

        {/* Live Invoice Preview Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
          
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Invoice Header Preview</h3>
          
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            backgroundColor: 'var(--background)',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            
            {/* Mock Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--primary)', paddingBottom: '0.75rem' }}>
              <div>
                <img src={shopLogo} alt="Shop logo" style={{ maxHeight: '35px', maxWidth: '120px', objectFit: 'contain', marginBottom: '0.25rem' }} />
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{shopName || 'Gold Shop'}</div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.65rem' }}>📍 {shopAddress || 'Store Location address'}</div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.65rem' }}>📞 {shopPhone || 'Store Contact'}</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>TAX INVOICE</span>
                <span>No: INV-2026-0001</span>
                <span>Date: 02 Jul 2026</span>
              </div>
            </div>

            {/* Mock Customer & Item */}
            <div>
              <div style={{ fontWeight: '600' }}>Billed To: Rushikesh Sonar</div>
              <div style={{ color: 'var(--muted-foreground)' }}>GSTIN: {shopGstNumber || '27AAAAA1111A1Z1'}</div>
            </div>

            {/* Mock Items list grid placeholder */}
            <div style={{ border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: '0.65rem' }}>
              --- itemised invoice rows display here ---
            </div>

            {/* Mock Footer terms and signature preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              {enableQrCode ? (
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--foreground)' }}>
                  <rect x="2" y="2" width="6" height="6" />
                  <rect x="16" y="2" width="6" height="6" />
                  <rect x="2" y="16" width="6" height="6" />
                  <path d="M7 7h1M16 7h1M7 16h1M10 2h4v4h-4zM10 8h2v2h-2zM14 10h4v2h-4zM10 14h2v8h-2zM14 16h4v4h-4z" />
                </svg>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px', gap: '1.25rem' }}>
                <div style={{ height: '1px', width: '100%', borderTop: '0.5px solid var(--muted-foreground)' }} />
                <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)' }}>Authorized Signatory</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
