import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/mobile-fix.css'
import { safeGetElement } from '@/utils/domHelpers'

// Bonifica PWA: mantieni solo sw.js per notifiche push
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => {
      if (r.scope && !r.scope.includes('/sw.js') && r.active?.scriptURL && !r.active.scriptURL.includes('sw.js')) {
        r.unregister();
      }
    });
  }).catch(() => {});
  if (typeof caches !== "undefined" && caches?.keys) {
    caches.keys().then(keys => {
      keys.forEach(k => {
        if (!k.includes('pp-push')) {
          caches.delete(k);
        }
      });
    }).catch(() => {});
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection', event.reason);
})

const initApp = () => {
  const rootElement = safeGetElement('root')
  if (!rootElement) {
    const fallback = document.createElement('div')
    fallback.id = 'root'
    document.body.appendChild(fallback)
    const newRoot = safeGetElement('root')
    if (newRoot) renderApp(newRoot)
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}
