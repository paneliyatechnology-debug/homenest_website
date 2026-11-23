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
          overlay: 999999,
          menu: 999999,
          tooltip: 1000000,
          toast: 1000001,
        },
      }}
    >
      <GlobalToastContainer />
      {children}
    </PrimeReactProvider>
  );
}
