'use client';

import React from 'react';
import Image from 'next/image';

export interface BrandLoaderProps {
  /** Optional loading message displayed beneath the brand icon */
  message?: string;
  /** Whether to render as a full-screen backdrop overlay */
  overlay?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  message = 'Loading...',
  overlay = false,
  size = 'md',
  className = '',
}) => {
  const iconDimension = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;
  const containerSize = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';

  const containerClass = overlay
    ? 'fixed inset-0 z-50 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center p-6'
    : `flex flex-col items-center justify-center p-8 ${className}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className="relative flex items-center justify-center mb-3.5">
        {/* Animated concentric brand rings */}
        <div className="absolute -inset-3.5 rounded-full border-2 border-[#175C46]/20 animate-ping opacity-30" />
        <div className="absolute -inset-2 rounded-full border-2 border-[#175C46]/35 animate-pulse" />

        {/* Center brand icon card */}
        <div
          className={`relative ${containerSize} rounded-2xl bg-white shadow-md border border-gray-100/90 flex items-center justify-center p-2.5 transition-transform`}
        >
          <Image
            src="/images/homenest-icon.png"
            alt="HomeNest Logo"
            width={iconDimension}
            height={iconDimension}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Brand title & Dynamic Message */}
      <div className="text-center space-y-1">
        <h4 className="text-sm font-bold text-gray-900 tracking-tight">HomeNest</h4>
        {message && (
          <p className="text-xs text-gray-500 font-medium animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

