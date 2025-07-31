// src/config/environments.js
const environments = {
  development: {
    // Ambiente di sviluppo - App completa con landing page
    APP_URL: 'http://localhost:8080',
    MVP_URL: 'http://localhost:8080',
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    IS_MVP_MODE: false, // App completa
    ENABLE_LANDING_PAGE: true,
    ENABLE_OVERLAY_BLOCKS: false, // Disabilita overlay nell'ambiente sviluppo
  },
  production: {
    // Ambiente produzione - MVP con overlay di blocco
    APP_URL: 'https://performanceprime.it',
    MVP_URL: 'https://performanceprime.it',
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    IS_MVP_MODE: true, // MVP con overlay
    ENABLE_LANDING_PAGE: false,
    ENABLE_OVERLAY_BLOCKS: true, // Abilita overlay nell'MVP
  }
};

const config = {
  getCurrentEnvironment: () => {
    const env = process.env.NODE_ENV || 'development';
    return environments[env] || environments.development;
  },

  getAppUrl: () => {
    return config.getCurrentEnvironment().APP_URL;
  },

  getMvpUrl: () => {
    return config.getCurrentEnvironment().MVP_URL;
  },

  getSupabaseUrl: () => {
    return config.getCurrentEnvironment().SUPABASE_URL;
  },

  getSupabaseAnonKey: () => {
    return config.getCurrentEnvironment().SUPABASE_ANON_KEY;
  },

  isMvpMode: () => {
    return config.getCurrentEnvironment().IS_MVP_MODE;
  },

  shouldEnableLandingPage: () => {
    return config.getCurrentEnvironment().ENABLE_LANDING_PAGE;
  },

  shouldEnableOverlayBlocks: () => {
    return config.getCurrentEnvironment().ENABLE_OVERLAY_BLOCKS;
  },

  getSupabaseRedirectUrl: () => {
    return `${config.getAppUrl()}/auth`;
  },

  getResetPasswordUrl: () => {
    return `${config.getAppUrl()}/reset-password`;
  },

  getDashboardUrl: () => {
    return `${config.getAppUrl()}/app`;
  }
};

export { config }; 