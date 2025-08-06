import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testAuthConfiguration, simulateAuthFlow, checkAuthPersistence } from '@/utils/authTest';

// Import landing page components
import LandingPage from '../landing/pages/LandingPage';
import '../landing/styles/landing.css';

const SmartHomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showLanding, setShowLanding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🔍 Homepage: Controllo stato autenticazione...');
        setDebugInfo('Controllo autenticazione in corso...');
        
        // Se siamo già nella pagina di auth, non fare controlli
        if (location.pathname === '/auth') {
          console.log('📍 Siamo nella pagina auth, non fare controlli');
          setIsLoading(false);
          return;
        }
        
        // Test configurazione auth (solo in development)
        if (process.env.NODE_ENV === 'development') {
          await testAuthConfiguration();
          await simulateAuthFlow();
          checkAuthPersistence();
        }
        
        // Ottieni sessione corrente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Errore controllo sessione:', error);
          setDebugInfo('Errore controllo sessione');
          // In caso di errore, mostra landing page
          setShowLanding(true);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // ✅ Utente autenticato → Dashboard
          console.log('✅ Utente autenticato, redirect a dashboard');
          console.log('👤 User ID:', session.user.id);
          console.log('📧 User Email:', session.user.email);
          setDebugInfo('Utente autenticato, redirect a dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          // ❌ Utente non autenticato → Mostra Landing Page
          console.log('❌ Utente non autenticato, mostra landing page');
          setDebugInfo('Utente non autenticato, mostra landing page');
          setShowLanding(true);
        }
      } catch (error) {
        console.error('💥 Errore imprevisto homepage:', error);
        setDebugInfo('Errore imprevisto durante controllo auth');
        // In caso di errore, mostra landing page
        setShowLanding(true);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [navigate, location.pathname]);

  // Loading screen mentre controlla l'autenticazione
  if (isLoading) {
    return (
      <div className="homepage-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento Performance Prime...</p>
          <p className="loading-subtitle">Controllo accesso in corso</p>
          {debugInfo && (
            <p className="debug-info">{debugInfo}</p>
          )}
        </div>
      </div>
    );
  }

  // Mostra landing page per utenti non autenticati
  if (showLanding) {
    return <LandingPage />;
  }

  // Questo componente fa solo redirect, non dovrebbe mai renderizzare contenuto
  return null;
};

export default SmartHomePage; 