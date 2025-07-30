import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Import condizionale per evitare errori in produzione
let DevApp: React.ComponentType | null = null;
let PublicApp: React.ComponentType | null = null;

// Carica i componenti solo se esistono
try {
  DevApp = require('./development/DevApp').default;
} catch (e) {
  console.log('DevApp non disponibile in produzione');
}

try {
  PublicApp = require('./public/App').default;
} catch (e) {
  console.log('PublicApp non disponibile, usando fallback');
}

// Fallback per PublicApp se non disponibile
const FallbackApp = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', color: '#EEBA2B', marginBottom: '1rem' }}>
        Performance Prime
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#ccc' }}>
        App in caricamento...
      </p>
    </div>
  </div>
);

const queryClient = new QueryClient();

// Determina modalità in base all'ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const isDevMode = window.location.pathname.startsWith('/dev') || 
                  window.location.search.includes('dev=true');

const App = () => {
  // Se siamo in modalità sviluppo e DevApp è disponibile
  if (isDevMode && DevApp) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <DevApp />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  // Modalità pubblica
  const AppComponent = PublicApp || FallbackApp;
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppComponent />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
