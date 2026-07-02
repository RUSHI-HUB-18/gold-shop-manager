import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export function Card({ title, subtitle, children, className = '', ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          {title && <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>}
          {subtitle && <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0', opacity: 0.7, fontSize: '0.85rem' }}>{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
