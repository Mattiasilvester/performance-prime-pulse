/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase (obbligatorie)
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  // App config
  readonly VITE_APP_MODE?: 'development' | 'production'
  readonly VITE_API_URL?: string
  readonly VITE_DEBUG_MODE?: string

  // Stripe
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string

  // PayPal
  readonly VITE_PAYPAL_CLIENT_ID?: string
  readonly VITE_PAYPAL_PLAN_ID?: string
  readonly VITE_PAYPAL_MODE?: 'sandbox' | 'production'

  // Admin (per futuro SuperAdmin)
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_ADMIN_SECRET_KEY?: string

  // Email validation
  readonly VITE_EMAIL_VALIDATION_API_KEY?: string
  readonly VITE_EMAIL_VALIDATION_PROVIDER?: string

  // PrimeBot
  readonly VITE_ENABLE_PRIMEBOT?: string

  // Dev/Test (solo development)
  readonly VITE_DEV_TEST_EMAIL?: string
  readonly VITE_DEV_TEST_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
