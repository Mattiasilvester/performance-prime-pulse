/**
 * URL base dell'app. In Capacitor window.location.origin è "capacitor://localhost";
 * per redirect (Stripe, Supabase auth, reset password) serve l'URL di produzione.
 * Su web resta il fallback a window.location.origin.
 */
export function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || window.location.origin;
}
