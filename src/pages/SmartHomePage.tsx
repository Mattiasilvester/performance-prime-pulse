import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Import landing page components
import LandingPage from '../landing/pages/LandingPage';
import '../landing/styles/landing.css';

const SmartHomePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🔍 Homepage: Controllo stato autenticazione...');
        setDebugInfo('Controllo autenticazione in corso...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Utente autenticato, redirect alla dashboard');
          setDebugInfo('Utente autenticato, redirect...');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('❌ Utente non autenticato, mostra landing page');
          setDebugInfo('Utente non autenticato');
          setShowLanding(true);
        }
      } catch (error) {
        console.error('❌ Errore controllo autenticazione:', error);
        setDebugInfo('Errore controllo autenticazione');
        setShowLanding(true);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };
    checkAuthAndRedirect();
  }, [navigate]);

  // Loading screen breve
  if (isLoading) {
    return (
      <div className="homepage-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento Performance Prime...</p>
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