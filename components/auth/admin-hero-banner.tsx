'use client';

import React from 'react';
import Image from 'next/image';

interface AdminHeroBannerProps {
  logoSrc?: string;
  portalName?: string;
  welcomeTitle?: string;
  welcomeDescription?: string;
  className?: string;
}

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({
  logoSrc = '/images/logo-white.png',
  portalName = 'Admin Portal',
  welcomeTitle = 'Welcome Back, Admin',
  welcomeDescription = 'Manage residents, operations and keep the community running smoothly.',
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full min-h-[500px] lg:h-screen flex flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-12 xl:p-14 text-white select-none ${className}`}
    >
      {/* Background Architectural Image */}
      <Image
        src="/images/login-hero.png"
        alt="Modern residential building complex"
        fill
        priority
        className="object-cover object-center select-none"
        sizes="(max-width: 1024px) 100vw, 45vw"
      />

      {/* Atmospheric Contrast Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70 pointer-events-none" />

      {/* Top Header: Logo & Sub-Brand */}
      <div className="relative z-10 flex flex-col items-start">
        <div className="relative w-40 sm:w-44 h-9 sm:h-10">
          <Image
            src={logoSrc}
            alt="HomeNest Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <span className="text-xs sm:text-sm font-medium tracking-wide text-white/95 mt-0.5 pl-0.5">
          {portalName}
        </span>
      </div>

      {/* Middle Headline Section (placed in upper-middle matching Figma) */}
      <div className="relative z-10 max-w-sm mt-16 mb-auto py-4">
        <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight leading-snug">
          {welcomeTitle}
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-xs">
          {welcomeDescription}
        </p>
      </div>

      {/* Bottom Section: 3 Community Pillar Badges */}
      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-xs sm:max-w-sm pb-2">
        {/* Pillar 1: Better Operations */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full border border-white/70 flex items-center justify-center text-white mb-2 shadow-sm bg-white/5 backdrop-blur-[1px]">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Better
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Operations
          </span>
        </div>

        {/* Pillar 2: Happier Residents */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full border border-white/70 flex items-center justify-center text-white mb-2 shadow-sm bg-white/5 backdrop-blur-[1px]">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Happier
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Residents
          </span>
        </div>

        {/* Pillar 3: Stronger Communities */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full border border-white/70 flex items-center justify-center text-white mb-2 shadow-sm bg-white/5 backdrop-blur-[1px]">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Stronger
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
            Communities
          </span>
        </div>
      </div>
    </div>
  );
};
