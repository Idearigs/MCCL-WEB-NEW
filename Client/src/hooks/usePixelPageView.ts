/**
 * usePixelPageView Hook
 *
 * Tracks Facebook Pixel PageView events on SPA route changes.
 * Place this hook in your root App component or layout.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/pixelService';

/**
 * Hook that fires PageView event on every route change
 * Skips the initial mount since index.html already fires PageView
 */
export const usePixelPageView = (): void => {
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the first render - PageView is already fired in index.html
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Fire PageView on subsequent route changes
    trackPageView();
  }, [location.pathname]);
};

export default usePixelPageView;
