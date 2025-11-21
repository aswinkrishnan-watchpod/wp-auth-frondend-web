/**
 * Custom hook for viewport height fix in mobile browsers / WebView
 * Addresses the issue where 100vh doesn't account for browser UI elements
 */

import { useEffect } from 'react';

export const useViewportHeight = () => {
  useEffect(() => {
    const setVh = () => {
      if (typeof window === 'undefined') return;
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);
};
