import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Componenti MVP
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Schedule from './pages/Schedule';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import Timer from './pages/Timer';
import Subscriptions from './pages/Subscriptions';
import PersonalInfo from './pages/settings/PersonalInfo';
import Security from './pages/settings/Security';
import Notifications from './pages/settings/Notifications';
import Language from './pages/settings/Language';
import Privacy from './pages/settings/Privacy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Help from './pages/settings/Help';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Componente Homepage intelligente per utenti pubblici
const PublicHomePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🏠 PublicHomePage - Controllo autenticazione...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Utente autenticato → Dashboard
          console.log('✅ Utente autenticato, redirect a dashboard');
          navigate('/dashboard');
        } else {
          // Utente non autenticato → Landing Page
          console.log('🔑 Utente non autenticato, redirect a landing');
          navigate('/landing');
        }
      } catch (error) {
        console.error('❌ Errore controllo auth:', error);
        navigate('/landing');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Listener per cambiamenti auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔄 Auth state change: ${event}`, session?.user?.id);
        if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          navigate('/landing');
        }
      }
    );

    return () => subscription.unsubscribe();
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

function PublicApp() {
  return (
    <div className="public-app">
      <Routes>
        {/* Homepage intelligente */}
        <Route path="/" element={<PublicHomePage />} />
        
        {/* Landing Page per utenti non autenticati */}
        <Route path="/landing" element={<Landing />} />
        
        {/* Autenticazione */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<PrivacyPolicy />} />
        
        {/* App protetta - solo utenti autenticati */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/subscriptions" element={
          <ProtectedRoute>
            <AppLayout>
              <Subscriptions />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/workouts" element={
          <ProtectedRoute>
            <AppLayout>
              <Workouts />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/schedule" element={
          <ProtectedRoute>
            <AppLayout>
              <Schedule />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/timer" element={
          <ProtectedRoute>
            <AppLayout>
              <Timer />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/ai-coach" element={
          <ProtectedRoute>
            <AppLayout>
              <AICoach />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile" element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/notes" element={
          <ProtectedRoute>
            <AppLayout>
              <Notes />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/settings/personal-info" element={
          <ProtectedRoute>
            <PersonalInfo />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/security" element={
          <ProtectedRoute>
            <Security />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/language" element={
          <ProtectedRoute>
            <Language />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/privacy" element={
          <ProtectedRoute>
            <Privacy />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/privacy-policy" element={
          <ProtectedRoute>
            <PrivacyPolicy />
          </ProtectedRoute>
        } />
        <Route path="/app/settings/help" element={
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default PublicApp; 