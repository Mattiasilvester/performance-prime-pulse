import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/shared/ui/toaster';
import { Toaster as Sonner } from '@/shared/ui/sonner';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { AuthProvider } from '@/shared/hooks/useAuth';

// Componenti pubblici
import Landing from './public/pages/Landing';
import Auth from './public/pages/Auth';
import ResetPassword from './public/pages/ResetPassword';
import Dashboard from './public/pages/Dashboard';
import Workouts from './public/pages/Workouts';
import Schedule from './public/pages/Schedule';
import Profile from './public/pages/Profile';
import Notes from './public/pages/Notes';
import Timer from './public/pages/Timer';
import Subscriptions from './public/pages/Subscriptions';
import PrivacyPolicy from './public/pages/PrivacyPolicy';
import NotFound from './public/pages/NotFound';
import PersonalInfo from './public/pages/settings/PersonalInfo';
import Security from './public/pages/settings/Security';
import Notifications from './public/pages/settings/Notifications';
import Language from './public/pages/settings/Language';
import Privacy from './public/pages/settings/Privacy';
import Help from './public/pages/settings/Help';
import { ProtectedRoute } from './public/components/auth/ProtectedRoute';
import { AppLayout } from './public/components/layout/AppLayout';
import { supabase } from '@/shared/integrations/supabase/client';

// Componente Homepage intelligente per utenti pubblici
const PublicHomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          navigate('/dashboard');
        } else {
          navigate('/landing');
        }
      } catch (error) {
        navigate('/landing');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
      </div>
    );
  }

  return null;
};

const queryClient = new QueryClient();

function PublicApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Homepage intelligente */}
              <Route path="/" element={<PublicHomePage />} />
              
              {/* Landing Page */}
              <Route path="/landing" element={<Landing />} />
              
              {/* Autenticazione */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Pagine legali */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<PrivacyPolicy />} />
              
              {/* App protetta */}
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
              
              {/* Settings */}
              <Route path="/app/settings/personal-info" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PersonalInfo />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/security" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Security />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/notifications" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Notifications />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/language" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Language />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/privacy" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Privacy />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/privacy-policy" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PrivacyPolicy />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app/settings/help" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Help />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default PublicApp; 