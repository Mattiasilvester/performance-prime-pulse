import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testAuthConfiguration, simulateAuthFlow, checkAuthPersistence } from '@/utils/authTest';

const SmartHomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🔍 Homepage: Controllo stato autenticazione...');
        setDebugInfo('Controllo autenticazione in corso...');
        
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
          // In caso di errore, vai al login
          navigate('/auth', { replace: true });
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
          // ❌ Utente non autenticato → Auth
          console.log('❌ Utente non autenticato, redirect a auth');
          setDebugInfo('Utente non autenticato, redirect a auth');
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('💥 Errore imprevisto homepage:', error);
        setDebugInfo('Errore imprevisto durante controllo auth');
        // In caso di errore, vai comunque al login
        navigate('/auth', { replace: true });
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

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

  // Questo componente fa solo redirect, non dovrebbe mai renderizzare contenuto
  return null;
};

export default SmartHomePage; 