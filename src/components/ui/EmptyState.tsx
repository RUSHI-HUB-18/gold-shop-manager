import React from 'react';

interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title = 'No Data Found', description, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        margin: '1rem 0'
      }}
    >
      {icon ? (
        <div style={{ marginBottom: '1rem', color: '#d4af37', opacity: 0.8 }}>{icon}</div>
      ) : (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.5"
          style={{ marginBottom: '1rem', opacity: 0.6 }}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )}
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 500 }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, maxWidth: '300px', lineHeight: 1.4 }}>{description}</p>
    </div>
  );
}
