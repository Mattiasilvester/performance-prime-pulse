import React from 'react';
import ReactDOM from 'react-dom/client';
import LandingApp from './landing/App';
import './landing/styles/landing.css';

console.log('🟢 LANDING PAGE: Avvio landing-main.tsx');
console.log('🌐 URL corrente:', window.location.href);
console.log('🔧 Modalità:', import.meta.env.VITE_APP_MODE);

// FORZA CARICAMENTO LANDING PAGE
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <LandingApp />
  </React.StrictMode>
);

console.log('✅ LANDING PAGE: Caricamento completato'); 