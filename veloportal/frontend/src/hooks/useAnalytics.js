import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Fires a GA4 page_view event on every route change.
// gtag() is defined in index.html — this hook is a no-op if GA is not loaded.
function gtrack(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    gtrack('event', 'page_view', {
      page_path:  location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);
}

// Convenience helpers for custom GA4 events
export const trackEvent = (eventName, params = {}) => gtrack('event', eventName, params);
export const trackPurchase = ({ orderId, value, items }) =>
  gtrack('event', 'purchase', { transaction_id: orderId, value, currency: 'KES', items });
