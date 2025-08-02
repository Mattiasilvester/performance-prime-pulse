import { createRoot } from 'react-dom/client'
import './index.css'

// Debug: stampa la modalità
console.log('VITE_APP_MODE:', import.meta.env.VITE_APP_MODE);
console.log('Current port:', window.location.port);

// Import dinamico basato su modalità o porta
const loadApp = async () => {
  try {
    let App;
    
    // Se siamo sulla porta 8081, forziamo la landing page
    if (window.location.port === '8081' || import.meta.env.VITE_APP_MODE === 'landing') {
      console.log('Loading LANDING PAGE...');
      const module = await import('./landing/App');
      App = module.default;
    } else {
      console.log('Loading MVP app...');
      const module = await import('./App');
      App = module.default;
    }
    
    createRoot(document.getElementById("root")!).render(<App />);
  } catch (error) {
    console.error('Error loading app:', error);
    // Fallback al MVP app
    const module = await import('./App');
    const App = module.default;
    createRoot(document.getElementById("root")!).render(<App />);
  }
};

loadApp();
