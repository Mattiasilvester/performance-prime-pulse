/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_MODE: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_EMAIL_VALIDATION_API_KEY?: string
  readonly VITE_EMAIL_VALIDATION_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
