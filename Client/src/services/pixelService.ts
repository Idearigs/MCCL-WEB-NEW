/**
 * Facebook Meta Pixel Service
 *
 * Centralized service for tracking Facebook Pixel events.
 * All fbq() calls are wrapped with safety checks for ad-blockers.
 *
 * Pixel ID: 276484950137071 (initialized in index.html)
 */

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Safely call Facebook Pixel function
 * Returns false if fbq is blocked/unavailable
 */
const safeFbq = (
  action: string,
  eventName: string,
  params?: Record<string, unknown>
): boolean => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq(action, eventName, params);
      if (import.meta.env.DEV) {
        console.log(`[Pixel] ${action} - ${eventName}`, params || '');
      }
      return true;
    } catch (error) {
      console.warn('[Pixel] Error tracking event:', error);
      return false;
    }
  }
  if (import.meta.env.DEV) {
    console.warn('[Pixel] fbq not available (ad-blocker or not loaded)');
  }
  return false;
};

/**
 * Track PageView event
 * Called on SPA route changes
 */
export const trackPageView = (): boolean => {
  return safeFbq('track', 'PageView');
};

/**
 * Track ViewContent event
 * Called when user views a product detail page
 */
export interface ViewContentParams {
  content_name: string;
  content_ids: string[];
  content_type: 'product';
  value: number;
  currency: string;
}

export const trackViewContent = (params: ViewContentParams): boolean => {
  return safeFbq('track', 'ViewContent', params);
};

/**
 * Track AddToCart event
 * Called when user adds a product to cart
 */
export interface AddToCartParams {
  content_name: string;
  content_ids: string[];
  content_type: 'product';
  value: number;
  currency: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
}

export const trackAddToCart = (params: AddToCartParams): boolean => {
  return safeFbq('track', 'AddToCart', params);
};

/**
 * Track InitiateCheckout event
 * Called when user starts checkout process
 */
export interface InitiateCheckoutParams {
  content_ids: string[];
  content_type: 'product';
  value: number;
  currency: string;
  num_items: number;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
}

export const trackInitiateCheckout = (params: InitiateCheckoutParams): boolean => {
  return safeFbq('track', 'InitiateCheckout', params);
};

/**
 * Track AddPaymentInfo event
 * Called when user adds payment information
 */
export interface AddPaymentInfoParams {
  content_ids?: string[];
  content_type?: 'product';
  value: number;
  currency: string;
}

export const trackAddPaymentInfo = (params: AddPaymentInfoParams): boolean => {
  return safeFbq('track', 'AddPaymentInfo', params);
};

/**
 * Track Purchase event
 * Called on successful order completion
 */
export interface PurchaseParams {
  content_ids: string[];
  content_type: 'product';
  value: number;
  currency: string;
  num_items: number;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
}

export const trackPurchase = (params: PurchaseParams): boolean => {
  return safeFbq('track', 'Purchase', params);
};

/**
 * Track custom events
 * For any non-standard events
 */
export const trackCustomEvent = (
  eventName: string,
  params?: Record<string, unknown>
): boolean => {
  return safeFbq('trackCustom', eventName, params);
};

// Export all functions as a namespace for convenience
const pixelService = {
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackCustomEvent,
};

export default pixelService;
