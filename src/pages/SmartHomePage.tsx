import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Import landing page components
import LandingPage from '../landing/pages/LandingPage';
import '../landing/styles/landing.css';

const SmartHomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🔍 Homepage: Controllo stato autenticazione...');
        
        // Se siamo già nella pagina di auth, non fare controlli
        if (location.pathname === '/auth') {
          console.log('📍 Siamo nella pagina auth, mostra landing');
          setShowLanding(true);
          setIsLoading(false);
          return;
        }
        
        // Ottieni sessione corrente con timeout
        const authPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const { data: { session }, error } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error('❌ Errore controllo sessione:', error);
          // In caso di errore, mostra landing page
          setShowLanding(true);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // ✅ Utente autenticato → Dashboard
          console.log('✅ Utente autenticato, redirect a dashboard');
          console.log('👤 User ID:', session.user.id);
          navigate('/dashboard', { replace: true });
        } else {
          // ❌ Utente non autenticato → Mostra Landing Page
          console.log('❌ Utente non autenticato, mostra landing page');
          setShowLanding(true);
        }
      } catch (error) {
        console.error('💥 Errore imprevisto homepage:', error);
        // In caso di errore, mostra landing page
        setShowLanding(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Timeout di sicurezza per evitare caricamento infinito
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout homepage, mostra landing page');
      setShowLanding(true);
      setIsLoading(false);
    }, 10000);

    checkAuthAndRedirect().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [navigate, location.pathname]);

  // Loading screen mentre controlla l'autenticazione
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c89116] mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento Performance Prime...</p>
          <p className="text-gray-400 text-sm mt-2">Controllo accesso in corso</p>
        </div>
      </div>
    );
  }

  // Mostra landing page per utenti non autenticati
  if (showLanding) {
    return <LandingPage />;
  }

  // Fallback - mostra landing page
  return <LandingPage />;
};

export default SmartHomePage; 