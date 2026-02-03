import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';
import { safeLocalStorage } from '@pp/shared';

interface ProtectedRouteProps {
  session: Session | null;
  children: ReactNode;
}

export default function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation();

  // Permetti accesso all'onboarding anche senza auth
  if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
    const isOnboarding = safeLocalStorage.getItem('isOnboarding');
    if (isOnboarding === 'true') {
      return <>{children}</>;
    }
  }

  // ⚠️ BYPASS TEMPORANEO PER DEBUG - RIMUOVERE IN PRODUZIONE
  // Permette accesso a TUTTA L'APP senza autenticazione in modalità sviluppo
  // Esclude solo route pubbliche (auth, landing, onboarding)
  if (import.meta.env.DEV) {
    const publicRoutes = ['/', '/auth', '/auth/login', '/auth/register', '/onboarding'];
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(`${route}/`)
    );
    
    if (!isPublicRoute) {
      console.log('⚠️ BYPASS ATTIVO - Accesso app completa senza autenticazione (solo DEV)');
      return <>{children}</>;
    }
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return <>{children}</>;
} 