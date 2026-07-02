import React, { useEffect } from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoCloseMs?: number;
}

export function Alert({ type, message, onClose, autoCloseMs }: AlertProps) {
  useEffect(() => {
    if (autoCloseMs && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [autoCloseMs, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'rgba(34, 197, 94, 0.12)',
    error: 'rgba(239, 68, 68, 0.12)',
    warning: 'rgba(234, 179, 8, 0.12)',
    info: 'rgba(59, 130, 246, 0.12)'
  };

  const borderColors = {
    success: 'rgba(34, 197, 94, 0.25)',
    error: 'rgba(239, 68, 68, 0.25)',
    warning: 'rgba(234, 179, 8, 0.25)',
    info: 'rgba(59, 130, 246, 0.25)'
  };

  const textColors = {
    success: '#4ade80',
    error: '#f87171',
    warning: '#facc15',
    info: '#60a5fa'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: `1px solid ${borderColors[type]}`,
        backgroundColor: bgColors[type],
        color: textColors[type],
        fontSize: '0.9rem',
        marginBottom: '1rem',
        animation: 'fade-in-alert 0.2s ease-out',
        position: 'relative'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {type === 'success' && <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />}
        {type === 'error' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </>
        )}
        {type === 'warning' && (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
        {type === 'info' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        )}
      </svg>
      <div style={{ flex: 1, fontWeight: 500 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            fontSize: '1.2rem',
            lineHeight: 1,
            opacity: 0.6,
            marginLeft: 'auto'
          }}
          type="button"
        >
          &times;
        </button>
      )}
    </div>
  );
}
