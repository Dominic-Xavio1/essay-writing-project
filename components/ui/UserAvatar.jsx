'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-xl',
};

export function UserAvatar({ src, name = '', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const szClass = sizeClasses[size] || sizeClasses.md;

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        onError={() => setImageError(true)}
        className={`${szClass} rounded-full object-cover ring-2 ring-primary/10 shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`${szClass} rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold flex items-center justify-center ring-2 ring-primary/10 shadow-xs shrink-0 select-none ${className}`}
      title={name || 'User avatar'}
    >
      {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
    </div>
  );
}
