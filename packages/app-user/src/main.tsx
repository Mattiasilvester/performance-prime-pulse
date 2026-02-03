import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/admin-override.css'
import { safeGetElement } from '@pp/shared/utils/domHelpers'
// SW Control rimosso - bonifica PWA integrata direttamente

// Dev imports rimossi - file non esistenti

// TEMP: Bonifica PWA/Service Worker (rimuovere dopo 1–2 release)
// NOTA: NON deregistrare sw.js (service worker per notifiche push)
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => {
      // Mantieni sw.js per notifiche push, deregistra solo altri service worker
      if (r.scope && !r.scope.includes('/sw.js') && r.active?.scriptURL && !r.active.scriptURL.includes('sw.js')) {
        r.unregister();
      }
    });
  }).catch(() => {});
  if (typeof caches !== "undefined" && caches?.keys) {
    caches.keys().then(keys => {
      // Mantieni cache per push notifications, elimina solo altre cache
      keys.forEach(k => {
        if (!k.includes('pp-push')) {
          caches.delete(k);
        }
      });
    }).catch(() => {});
  }
}

// Gestione errori globale
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Potresti inviare a un servizio di error tracking qui
})

// Attendi che il DOM sia pronto
const initApp = () => {
  const rootElement = safeGetElement('root')
  
  if (!rootElement) {
    console.error('Root element not found, creating fallback')
    const fallback = document.createElement('div')
    fallback.id = 'root'
    document.body.appendChild(fallback)
    
    // Riprova dopo aver creato l'elemento
    const newRoot = safeGetElement('root')
    if (newRoot) {
      renderApp(newRoot)
    }
  } else {
    renderApp(rootElement)
  }
}

const renderApp = (element: HTMLElement) => {
  const root = ReactDOM.createRoot(element)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Assicurati che il DOM sia caricato
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}
