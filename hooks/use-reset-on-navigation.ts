'use client';

import { useEffect, useRef } from 'react';

export interface UseResetOnNavigationOptions {
  /**
   * Whether to trigger onReset when the component unmounts (navigating away).
   * Defaults to true.
   */
  resetOnUnmount?: boolean;
  /**
   * Whether to trigger onReset when the page is restored from browser Back/Forward Cache (bfcache).
   * Defaults to true.
   */
  resetOnBfcache?: boolean;
  /**
   * Whether to trigger onReset when browser back/forward buttons (popstate) are used.
   * Defaults to true.
   */
  resetOnPopstate?: boolean;
  /**
   * Whether to clean transient query parameters (e.g. ?toast=created) from URL.
   * Defaults to false.
   */
  cleanQueryToast?: boolean;
}

/**
 * Universal hook ensuring consistent form and table state reset across
 * page navigation, unmount, and browser back/forward history transitions.
 */
export function useResetOnNavigation(
  onReset: () => void,
  options: UseResetOnNavigationOptions = {}
) {
  const {
    resetOnUnmount = true,
    resetOnBfcache = true,
    resetOnPopstate = true,
    cleanQueryToast = false,
  } = options;

  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    // 1. Handle browser Back/Forward Cache (bfcache) restoration
    const handlePageShow = (e: PageTransitionEvent) => {
      if (resetOnBfcache && e.persisted) {
        onResetRef.current();
      }
    };

    // 2. Handle popstate navigation (browser back/forward button clicks)
    const handlePopState = () => {
      if (resetOnPopstate) {
        onResetRef.current();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);

    // 3. Optional URL query cleaning (e.g. removing transient ?toast=created)
    if (cleanQueryToast && typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('toast')) {
          url.searchParams.delete('toast');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {
        // ignore in non-browser env
      }
    }

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);

      // 4. Trigger reset when unmounting (leaving page)
      if (resetOnUnmount) {
        onResetRef.current();
      }
    };
  }, [resetOnUnmount, resetOnBfcache, resetOnPopstate, cleanQueryToast]);
}

