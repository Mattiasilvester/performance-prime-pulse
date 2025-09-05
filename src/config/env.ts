// Configurazione centralizzata per le variabili d'ambiente
export const env = {
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // App Config
  APP_MODE: import.meta.env.VITE_APP_MODE || 'development',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  
  // Debug
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // Email Validation
  EMAIL_VALIDATION_API_KEY: import.meta.env.VITE_EMAIL_VALIDATION_API_KEY,
  EMAIL_VALIDATION_PROVIDER: import.meta.env.VITE_EMAIL_VALIDATION_PROVIDER || 'abstractapi',
  
  // Development
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Validazione variabili obbligatorie
export const validateEnv = () => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Variabili d'ambiente mancanti: ${missing.join(', ')}`);
    console.error('Verifica che il file .env sia presente e contenga le variabili corrette');
    return false;
  }
  
  console.log('✅ Tutte le variabili d\'ambiente sono configurate correttamente');
  return true;
};
