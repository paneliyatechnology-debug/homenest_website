'use client';

import React from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { GlobalToastContainer } from '@/components/providers/toast-provider';

interface PrimeProviderProps {
  children: React.ReactNode;
}

export function PrimeProvider({ children }: PrimeProviderProps) {
  return (
    <PrimeReactProvider
      value={{
        ripple: true,
        zIndex: {
          modal: 1100,
          overlay: 100000,
          menu: 100000,
          tooltip: 110000,
          toast: 120000,
        },
      }}
    >
      <GlobalToastContainer />
      {children}
    </PrimeReactProvider>
  );
}
