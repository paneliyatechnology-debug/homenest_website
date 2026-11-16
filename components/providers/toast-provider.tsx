'use client';

import React, { useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { toast, ToastMessage } from '@/lib/toast';

export function GlobalToastContainer() {
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    // 1. Subscribe to programmatic toast messages
    const unsubscribe = toast.subscribe((msg: ToastMessage) => {
      toastRef.current?.show({
        severity: msg.severity || 'info',
        summary: msg.summary,
        detail: msg.detail,
        life: msg.life ?? 3500,
      });
    });

    // 2. Consume any stored flash toast (e.g. from hard page reload)
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('homenest_flash_toast');
        if (stored) {
          const parsed = JSON.parse(stored) as ToastMessage;
          sessionStorage.removeItem('homenest_flash_toast');
          if (parsed && parsed.detail) {
            // Small timeout to allow UI to settle after render
            setTimeout(() => {
              toastRef.current?.show({
                severity: parsed.severity || 'success',
                summary: parsed.summary,
                detail: parsed.detail,
                life: parsed.life ?? 3500,
              });
            }, 100);
          }
        }
      } catch {
        // ignore JSON parse or storage errors
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return <Toast ref={toastRef} position="top-right" />;
}

