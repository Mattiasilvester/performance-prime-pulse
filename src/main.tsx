import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Debug: stampa la modalità
console.log('🚀 Performance Prime - Caricamento app...');
console.log('VITE_APP_MODE:', import.meta.env.VITE_APP_MODE);
console.log('Current port:', window.location.port);

// Caricamento diretto dell'app unificata
const loadApp = async () => {
  try {
    console.log('📦 Loading UNIFIED app...');
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Elemento 'root' non trovato nel DOM");
    }
    
    console.log('✅ Root element trovato, creando React app...');
    const root = createRoot(rootElement);
    
    console.log('🎨 Rendering App component...');
    root.render(<App />);
    
    console.log('✅ App caricata con successo!');
  } catch (error) {
    console.error('❌ Error loading app:', error);
    
    // Mostra errore visibile
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="
          color: white; 
          padding: 40px; 
          font-family: Arial, sans-serif;
          background: #1A1A1A;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <h1 style="color: #FFD700; margin-bottom: 20px;">🚨 Errore di caricamento</h1>
          <p style="margin-bottom: 10px;">Si è verificato un errore nel caricamento dell'applicazione Performance Prime.</p>
          <p style="margin-bottom: 20px; color: #A0A0A0;">Errore: ${error}</p>
          <button onclick="location.reload()" style="
            background: #FFD700;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">🔄 Ricarica pagina</button>
        </div>
      `;
    }
  }
};

// Avvia il caricamento
loadApp();
