import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/admin-override.css'
import { safeGetElement } from '@/utils/domHelpers'
import * as SWControl from "./sw-control";
void SWControl; // impedisce il tree-shaking del modulo a side-effect

if (import.meta.env.DEV) {
  import("./dev/mobile-hard-refresh");
  import("./dev/desktop-hard-refresh");
}

if (import.meta.env.PROD) {
  import("./pwa/registerProgressier").then(m => m.registerProgressier?.());
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
