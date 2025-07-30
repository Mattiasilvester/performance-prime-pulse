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
    // Controlla la porta corrente
    const currentPort = window.location.port || '8080';
    return import.meta.env.VITE_APP_URL || `http://localhost:${currentPort}`;
  },

  // URL della dashboard
  getDashboardUrl: () => {
    // Controlla la porta corrente per development
    if (config.isDevelopment()) {
      const currentPort = window.location.port || '8080';
      return `http://localhost:${currentPort}/app`;
    }
    return '/app';
  },

  // URL di redirect per Supabase
  getSupabaseRedirectUrl: () => {
    if (config.isDevelopment()) {
      const currentPort = window.location.port || '8080';
      return `http://localhost:${currentPort}/app`;
    }
    return 'https://performanceprime.it/app';
  },

  // URL per reset password
  getResetPasswordUrl: () => {
    if (config.isDevelopment()) {
      const currentPort = window.location.port || '8080';
      return `http://localhost:${currentPort}/reset-password`;
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