// Configurazione ambienti per Performance Prime
const environments = {
  development: {
    SUPABASE_URL: "https://kfxoyucatvvcgmqalxsg.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY",
    APP_URL: "http://localhost:8081",
    REDIRECT_URLS: [
      "http://localhost:8081/auth",
      "http://localhost:8081/reset-password",
      "http://localhost:8081/dashboard",
      "http://localhost:8081/auth",
      "http://localhost:8081/reset-password",
      "http://localhost:8081/dashboard",
      "http://localhost:8082/auth",
      "http://localhost:8082/reset-password",
      "http://localhost:8082/dashboard"
    ]
  },
  production: {
    SUPABASE_URL: "https://kfxoyucatvvcgmqalxsg.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc2NTksImV4cCI6MjA2NTgyMzY1OX0.hQhfOogGGc9kvOGvxjOv6QTKxSysbTa6En-0wG9_DCY",
    APP_URL: "https://performanceprime.it",
    REDIRECT_URLS: [
      "https://performanceprime.it/auth",
      "https://performanceprime.it/reset-password",
      "https://performanceprime.it/dashboard",
      "https://www.performanceprime.it/auth",
      "https://www.performanceprime.it/reset-password",
      "https://www.performanceprime.it/dashboard"
    ]
  }
};

// Determina l'ambiente corrente
const getCurrentEnvironment = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Sviluppo locale
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    // Produzione
    if (hostname === 'performanceprime.it' || hostname === 'www.performanceprime.it') {
      return 'production';
    }
  }
  
  // Default a development
  return 'development';
};

// Esporta la configurazione corrente
export const config = environments[getCurrentEnvironment()];

// Funzioni di utilità per URL
export const getAppUrl = () => {
  return config.APP_URL;
};

export const getRedirectUrl = (path = '') => {
  return `${config.APP_URL}${path}`;
};

export const getResetPasswordUrl = () => {
  return getRedirectUrl('/reset-password');
};

export const getAuthUrl = () => {
  return getRedirectUrl('/auth');
};

export const getDashboardUrl = () => {
  return getRedirectUrl('/dashboard');
};

// Esporta anche la configurazione completa per Supabase
export default config; 