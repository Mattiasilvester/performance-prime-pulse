import { createRoot } from 'react-dom/client'
import './index.css'

// Debug: stampa la modalità
console.log('VITE_APP_MODE:', import.meta.env.VITE_APP_MODE);

// Import dinamico basato su modalità
const loadApp = async () => {
  try {
    let App;
    if (import.meta.env.VITE_APP_MODE === 'landing') {
      console.log('Loading landing app...');
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
