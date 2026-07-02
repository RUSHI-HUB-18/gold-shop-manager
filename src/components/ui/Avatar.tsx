import React from 'react';

interface AvatarProps {
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ fullName, size = 'md', className = '' }: AvatarProps) {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getGradientSeed = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      'linear-gradient(135deg, #d4af37, #b8962e)', // Gold
      'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo/Cyan
      'linear-gradient(135deg, #ec4899, #f43f5e)', // Pink/Rose
      'linear-gradient(135deg, #10b981, #059669)', // Emerald
      'linear-gradient(135deg, #f59e0b, #d97706)', // Amber
    ];
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const initials = getInitials(fullName);
  const background = getGradientSeed(fullName);

  const sizeStyles = {
    sm: { width: '28px', height: '28px', fontSize: '0.75rem' },
    md: { width: '40px', height: '40px', fontSize: '0.95rem' },
    lg: { width: '64px', height: '64px', fontSize: '1.4rem' }
  };

  const style = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`avatar-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background,
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        userSelect: 'none',
        ...style
      }}
    >
      {initials}
    </div>
  );
}
