import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environments';

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🏠 HomePage MVP caricata');
        console.log('🌐 URL corrente:', window.location.href);
        console.log('🔍 Controllo autenticazione...');
        
        // Controlla se utente è già autenticato
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Errore controllo sessione:', error);
          console.log('🔄 Reindirizzamento al login...');
          navigate('/auth');
          return;
        }

        if (session?.user) {
          // Utente autenticato → Dashboard
          console.log('✅ Utente autenticato, redirect a dashboard');
          console.log('👤 User ID:', session.user.id);
          navigate('/app');
        } else {
          // Utente non autenticato → Login
          console.log('🔑 Utente non autenticato, redirect a login');
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ Errore imprevisto durante controllo auth:', error);
        console.log('🔄 Fallback: redirect al login');
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #EEBA2B',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }}></div>
        <p style={{ fontSize: '1.2rem', color: '#EEBA2B' }}>
          Caricamento Performance Prime...
        </p>
        <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>
          Verifica autenticazione in corso
        </p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null; // Componente fa solo redirect
};

export default HomePage; 