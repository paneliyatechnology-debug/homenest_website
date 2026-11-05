'use client';

import React from 'react';
import { PrimeReactProvider } from 'primereact/api';

interface PrimeProviderProps {
  children: React.ReactNode;
}

export function PrimeProvider({ children }: PrimeProviderProps) {
  return (
    <PrimeReactProvider value={{ ripple: true }}>
      {children}
    </PrimeReactProvider>
  );
}

