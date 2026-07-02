import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const dimension = size === 'sm' ? '18px' : size === 'lg' ? '40px' : '28px';
  return (
    <div className={`spinner-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 38 38"
        stroke="#d4af37"
        style={{ animation: 'spin-spinner 1s linear infinite' }}
      >
        <defs>
          <style>{`
            @keyframes spin-spinner {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="3">
            <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
            <path d="M36 18c0-9.94-8.06-18-18-18" />
          </g>
        </g>
      </svg>
    </div>
  );
}
