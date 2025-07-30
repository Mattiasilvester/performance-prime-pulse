// Configurazione per gestire URL in base all'ambiente
export const config = {
  // Determina se siamo in ambiente di sviluppo
  isDevelopment: () => {
    return import.meta.env.VITE_APP_ENV === 'development' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  },

  // URL base dell'applicazione
  getBaseUrl: () => {
    return import.meta.env.VITE_APP_URL || 'http://localhost:8080';
  },

  // URL della dashboard
  getDashboardUrl: () => {
    return import.meta.env.VITE_DASHBOARD_URL || '/app';
  },

  // URL di redirect per Supabase
  getSupabaseRedirectUrl: () => {
    if (config.isDevelopment()) {
      return import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8080/app';
    }
    return 'https://performanceprime.it/app';
  },

  // URL per reset password
  getResetPasswordUrl: () => {
    if (config.isDevelopment()) {
      return `${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}/reset-password`;
    }
    return 'https://performanceprime.it/reset-password';
  },

  // Configurazione Supabase
  getSupabaseConfig: () => {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || "https://kfxoyucatvvcgmqalxsg.supabase.co",
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY"
    };
  }
}; 