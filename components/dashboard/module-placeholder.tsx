'use client';

import React from 'react';
import Link from 'next/link';

interface ModulePlaceholderProps {
  title: string;
  section: string;
  description: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  section,
  description,
}) => {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-[#175C46] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-600">{section}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{title}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-1 font-normal">{description}</p>
      </div>

      {/* Clean Modern Card Container */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center min-h-[420px]">
        <div className="w-16 h-16 rounded-2xl bg-[#edf5f1] text-[#175c46] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title} Module</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
          The {title} records and management interface is connected to the {section} subsystem.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#175c46] hover:bg-[#124b38] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <span>Return to Operations Dashboard</span>
        </Link>
      </div>
    </main>
  );
};

