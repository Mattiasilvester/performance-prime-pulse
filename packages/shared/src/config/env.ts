// packages/shared/src/config/env.ts
export const env = {
  SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '',
  OPENAI_API_KEY: import.meta.env?.VITE_OPENAI_API_KEY ?? '',
  STRIPE_PUBLISHABLE_KEY: import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
};

export default env;
