// src/config/environments.js
const environments = {
  development: {
    APP_URL: 'http://localhost:8081',
    API_URL: 'http://localhost:3000/api',
    DASHBOARD_URL: 'http://localhost:8081/app',
    LANDING_URL: 'http://localhost:8081/landing',
    MVP_URL: 'http://localhost:8081/auth' // MVP locale per sviluppo - punta al login
  },
  production: {
    APP_URL: 'https://performance-prime-pulse.lovable.app',
    API_URL: 'https://performance-prime-pulse.lovable.app/api',
    DASHBOARD_URL: 'https://performance-prime-pulse.lovable.app/app',
    LANDING_URL: 'https://performance-prime-pulse.lovable.app/landing',
    MVP_URL: 'https://performance-prime-pulse.lovable.app/auth' // MVP produzione - punta al login
  }
};

// Determina ambiente automaticamente
const getCurrentEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  return 'production';
};

// Esporta configurazione corrente
export const config = environments[getCurrentEnvironment()];
export const isDevelopment = getCurrentEnvironment() === 'development';
export const isProduction = getCurrentEnvironment() === 'production';

// Log per debug
console.log(`🌍 Ambiente: ${isDevelopment ? 'Sviluppo' : 'Produzione'}`);
console.log(`📱 MVP URL: ${config.MVP_URL}`);
console.log(`🛠️ Dashboard URL: ${config.DASHBOARD_URL}`);
console.log(`🏠 Landing URL: ${config.LANDING_URL}`);
console.log(`🌐 Hostname corrente: ${window.location.hostname}`); 