"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';
import { APP_CONFIG } from '@/config/app';
import { authService } from '@/services/authService';
import { validatePassword, validateEmail, validatePhone } from '@/utils/validation';
import { Alert } from '@/components/ui/Alert';

type PasswordStrength = {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
};

function getPasswordStrength(pw: string): PasswordStrength {
  return {
    hasMinLength: pw.length >= 8,
    hasUppercase: /[A-Z]/.test(pw),
    hasLowercase: /[a-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSymbol: /[^A-Za-z0-9]/.test(pw),
  };
}

function isPasswordValid(s: PasswordStrength) {
  return s.hasMinLength && s.hasUppercase && s.hasLowercase && s.hasNumber && s.hasSymbol;
}

export default function AuthPage() {
  const router = useRouter();
  
  // Auth Modes: 'LOGIN' | 'REGISTER' | 'FORGOT'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Input Fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone for Login & Forgot
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  // Forgot Password Steps: 1 = Request OTP, 2 = Verify OTP and Reset
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Strength Check for Sign Up Password & New Password
  const activePasswordForStrength = authMode === 'REGISTER' ? password : newPassword;
  const strength = useMemo(() => getPasswordStrength(activePasswordForStrength), [activePasswordForStrength]);
  const passedCount = useMemo(() => Object.values(strength).filter(Boolean).length, [strength]);

  // Real-time validations for creation
  const isEmailFormatValid = useMemo(() => {
    if (!regEmail.trim()) return true;
    return validateEmail(regEmail);
  }, [regEmail]);

  const isPhoneFormatValid = useMemo(() => {
    if (!regPhone.trim()) return true;
    return validatePhone(regPhone);
  }, [regPhone]);

  const hasAtLeastOne = useMemo(() => {
    return regEmail.trim().length > 0 || regPhone.trim().length > 0;
  }, [regEmail, regPhone]);

  const isRegFormValid = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      validatePassword(password) === null &&
      isEmailFormatValid &&
      isPhoneFormatValid &&
      hasAtLeastOne
    );
  }, [fullName, password, isEmailFormatValid, isPhoneFormatValid, hasAtLeastOne]);

  // Floating background particles
  const [particles, setParticles] = useState<{ id: number; left: number; delay: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10 + 10,
      }))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authMode === 'REGISTER' && validatePassword(password) !== null) {
      setError(validatePassword(password) || 'Password does not meet the required criteria.');
      return;
    }

    setLoading(true);

    if (authMode === 'LOGIN') {
      try {
        await authService.login({ identifier, password });
        router.push('/admin');
      } catch (err: any) {
        setError(err.message || 'Invalid Email Address or Mobile Number.');
      } finally {
        setLoading(false);
      }
    } else if (authMode === 'REGISTER') {
      try {
        await authService.register({ 
          password: password.trim(), 
          fullName: fullName.trim(), 
          email: regEmail.trim(),
          phoneNumber: regPhone.trim()
        });
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/admin'), 1200);
      } catch (err: any) {
        setError(err.message || 'Failed to create account.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.requestOtp(identifier);
      setSuccess(`OTP code sent! Check server console.`);
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (validatePassword(newPassword) !== null) {
      setError(validatePassword(newPassword) || 'New password does not meet the security criteria.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({ identifier, otp, newPassword });
      setSuccess('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setAuthMode('LOGIN');
        setPassword('');
        setNewPassword('');
        setForgotStep(1);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT') => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setPassword('');
    setNewPassword('');
    setIdentifier('');
    setRegEmail('');
    setRegPhone('');
    setForgotStep(1);
  };

  return (
    <div className="auth-wrapper">
      <div className="particles-container" aria-hidden="true">
        {particles.map(p => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#d4af37" strokeWidth="2.5" />
              <path d="M14 26L20 12L26 26" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.5 22H24.5" stroke="#d4af37" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="logo-text"><span className="gold">{APP_CONFIG.NAME.split(' ')[0]}</span> {APP_CONFIG.NAME.split(' ').slice(1).join(' ')}</h1>
          <p className="logo-subtitle">{APP_CONFIG.SUBTITLE}</p>
        </div>

        {/* Tab Selection */}
        {authMode !== 'FORGOT' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === 'LOGIN' ? 'active' : ''}`}
              onClick={() => switchMode('LOGIN')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'REGISTER' ? 'active' : ''}`}
              onClick={() => switchMode('REGISTER')}
            >
              Create Account
            </button>
            <div className="tab-indicator" style={{ transform: authMode === 'REGISTER' ? 'translateX(100%)' : 'translateX(0)' }} />
          </div>
        )}

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Login Mode */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="login-id">Email or Mobile Number</label>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  id="login-id"
                  type="text"
                  required
                  placeholder="Enter Email Address or Mobile Number"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password">Password</label>
                <button type="button" onClick={() => switchMode('FORGOT')} style={{ background: 'none', border: 'none', color: '#d4af37', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                  Forgot Password?
                </button>
              </div>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password visibility">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="btn-loader"></span> : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Mode */}
        {authMode === 'REGISTER' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="reg-name">Full Name *</label>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="reg-email">Email Address (Optional)</label>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  id="reg-email"
                  type="text"
                  placeholder="Enter Email Address"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>
              {regEmail.trim().length > 0 && !isEmailFormatValid && (
                <span className="inline-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Please enter a valid email address.
                </span>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="reg-phone">Mobile Number (Optional)</label>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <input
                  id="reg-phone"
                  type="text"
                  placeholder="Enter Mobile Number"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                />
              </div>
              {regPhone.trim().length > 0 && !isPhoneFormatValid && (
                <span className="inline-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Mobile number must contain exactly 10 digits.
                </span>
              )}
            </div>

            <p className="validation-helper" style={{ color: !hasAtLeastOne ? '#e7c050' : '#8c8c8c', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              {!hasAtLeastOne ? '⚠️ Please enter either an Email Address or a Mobile Number.' : 'At least one of Email Address or Mobile Number is required.'}
            </p>

            <div className="field-group">
              <label htmlFor="reg-password">Password *</label>
              <div className="input-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password visibility">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password strength checklist */}
            {password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bar-track">
                  <div
                    className={`strength-bar-fill strength-${passedCount <= 2 ? 'weak' : passedCount <= 4 ? 'medium' : 'strong'}`}
                    style={{ width: `${(passedCount / 5) * 100}%` }}
                  />
                </div>
                <ul className="strength-rules">
                  <li className={strength.hasMinLength ? 'pass' : ''}>
                    <span className="rule-icon">{strength.hasMinLength ? '✓' : '○'}</span> 8+ Characters
                  </li>
                  <li className={strength.hasUppercase ? 'pass' : ''}>
                    <span className="rule-icon">{strength.hasUppercase ? '✓' : '○'}</span> Upper (A-Z)
                  </li>
                  <li className={strength.hasLowercase ? 'pass' : ''}>
                    <span className="rule-icon">{strength.hasLowercase ? '✓' : '○'}</span> Lower (a-z)
                  </li>
                  <li className={strength.hasNumber ? 'pass' : ''}>
                    <span className="rule-icon">{strength.hasNumber ? '✓' : '○'}</span> Number (0-9)
                  </li>
                  <li className={strength.hasSymbol ? 'pass' : ''}>
                    <span className="rule-icon">{strength.hasSymbol ? '✓' : '○'}</span> Symbol (!@#$)
                  </li>
                </ul>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading || !isRegFormValid}>
              {loading ? <span className="btn-loader"></span> : 'Create Account'}
            </button>
          </form>
        )}

        {/* Forgot Password Mode */}
        {authMode === 'FORGOT' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button type="button" onClick={() => switchMode('LOGIN')} style={{ background: 'none', border: 'none', color: '#a8a29e', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
                ← Back to Login
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="auth-form">
                <div className="field-group">
                  <label htmlFor="for-id">Email or Mobile Number</label>
                  <div className="input-wrapper">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input
                      id="for-id"
                      type="text"
                      required
                      placeholder="Enter Email Address or Mobile Number"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? <span className="btn-loader"></span> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="field-group">
                  <label htmlFor="for-otp">6-Digit Verification OTP</label>
                  <div className="input-wrapper">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    <input
                      id="for-otp"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP code"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="for-newpw">New Secure Password</label>
                  <div className="input-wrapper">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      id="for-newpw"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new strong password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password visibility">
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password strength checklist */}
                {newPassword.length > 0 && (
                  <div className="password-strength">
                    <div className="strength-bar-track">
                      <div
                        className={`strength-bar-fill strength-${passedCount <= 2 ? 'weak' : passedCount <= 4 ? 'medium' : 'strong'}`}
                        style={{ width: `${(passedCount / 5) * 100}%` }}
                      />
                    </div>
                    <ul className="strength-rules">
                      <li className={strength.hasMinLength ? 'pass' : ''}>
                        <span className="rule-icon">{strength.hasMinLength ? '✓' : '○'}</span> 8+ Characters
                      </li>
                      <li className={strength.hasUppercase ? 'pass' : ''}>
                        <span className="rule-icon">{strength.hasUppercase ? '✓' : '○'}</span> Upper (A-Z)
                      </li>
                      <li className={strength.hasLowercase ? 'pass' : ''}>
                        <span className="rule-icon">{strength.hasLowercase ? '✓' : '○'}</span> Lower (a-z)
                      </li>
                      <li className={strength.hasNumber ? 'pass' : ''}>
                        <span className="rule-icon">{strength.hasNumber ? '✓' : '○'}</span> Number (0-9)
                      </li>
                      <li className={strength.hasSymbol ? 'pass' : ''}>
                        <span className="rule-icon">{strength.hasSymbol ? '✓' : '○'}</span> Symbol (!@#$)
                      </li>
                    </ul>
                  </div>
                )}

                <button type="submit" className="auth-submit" disabled={loading || !isPasswordValid(strength)} style={{ width: '100%' }}>
                  {loading ? <span className="btn-loader"></span> : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="auth-footer">
          <p>Gold Shop Manager — Internal Management Tool</p>
        </div>
      </div>
    </div>
  );
}
