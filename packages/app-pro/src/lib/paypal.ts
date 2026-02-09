/**
 * Configurazione PayPal
 *
 * IMPORTANTE: Plan ID è legato all'ambiente (Sandbox vs Live).
 * - Piano creato su paypal.com/billing → ambiente LIVE
 * - Per Sandbox serve un piano creato via API Sandbox (stesso Client ID Sandbox)
 */

export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
export const PAYPAL_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID || '';
export const PAYPAL_MODE = (import.meta.env.VITE_PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live';

// Verifica se PayPal è configurato
export const isPayPalConfigured = (): boolean => {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_PLAN_ID);
};

// Opzioni per PayPalScriptProvider
export const paypalScriptOptions = {
  clientId: PAYPAL_CLIENT_ID,
  currency: 'EUR',
  intent: 'subscription',
  vault: true,
};
