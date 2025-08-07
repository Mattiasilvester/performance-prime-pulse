import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { useAuthListener } from '@/hooks/useAuthListener';
import { NotificationProvider } from '@/hooks/useNotifications';
import { NotesProvider } from '@/hooks/useNotes';
import { FileAccessBanner } from '@/components/ui/file-access-banner';
import { useFileAccess } from '@/hooks/useFileAccess';
// import { AnalyticsConsent } from '@/components/ui/AnalyticsConsent';
// import { analytics } from '@/services/analytics';

// Import MVP pages
import SmartHomePage from './pages/SmartHomePage';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Schedule from './pages/Schedule';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Subscriptions from './pages/Subscriptions';
import Timer from './pages/Timer';
import Notes from './pages/Notes';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// Import Settings pages
import PersonalInfo from './pages/settings/PersonalInfo';
import Security from './pages/settings/Security';
import Notifications from './pages/settings/Notifications';
import Language from './pages/settings/Language';
import Privacy from './pages/settings/Privacy';
import Help from './pages/settings/Help';

// Import Landing page components
import LandingPage from './landing/pages/LandingPage';
import AuthPage from './landing/pages/AuthPage';
import PrivacyPolicyLanding from './landing/pages/PrivacyPolicy';
import './landing/styles/landing.css';

const queryClient = new QueryClient();

// Componente per tracciare le pagine - DISABILITATO TEMPORANEAMENTE
const PageTracker = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    // Temporaneamente disabilitato per risolvere il problema di caricamento
    console.log('📊 Analytics temporaneamente disabilitato per debugging');
    
    // const currentPath = window.location.pathname;
    // const pageName = currentPath === '/' ? 'homepage' : currentPath.slice(1);
    
    // // Traccia visualizzazione pagina
    // analytics.trackPageView(pageName, {
    //   path: currentPath,
    //   timestamp: Date.now()
    // });
  }, []);

  return <>{children}</>;
};

const App = () => {
  // Monitora cambiamenti stato auth
  useAuthListener();
  
  // Hook per gestire il consenso ai file
  const { showBanner, acceptFileAccess, declineFileAccess } = useFileAccess();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <NotesProvider>
            <TooltipProvider>
              <BrowserRouter>
                <PageTracker>
                  <Routes>
                {/* HOMEPAGE: Landing page per utenti non autenticati */}
                <Route path="/" element={<SmartHomePage />} />
                
                {/* AUTH: Pagina di autenticazione unificata */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/register" element={<Navigate to="/auth" replace />} />
                
                {/* RESET PASSWORD */}
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* MVP DASHBOARD: Route protette per utenti autenticati */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/workouts" element={
                  <ProtectedRoute>
                    <Workouts />
                  </ProtectedRoute>
                } />
                
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } />
                
                <Route path="/ai-coach" element={
                  <ProtectedRoute>
                    <AICoach />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/subscriptions" element={
                  <ProtectedRoute>
                    <Subscriptions />
                  </ProtectedRoute>
                } />
                
                <Route path="/timer" element={
                  <ProtectedRoute>
                    <Timer />
                  </ProtectedRoute>
                } />
                
                <Route path="/notes" element={
                  <ProtectedRoute>
                    <Notes />
                  </ProtectedRoute>
                } />
                
                {/* SETTINGS: Route protette per le impostazioni */}
                <Route path="/settings/personal-info" element={
                  <ProtectedRoute>
                    <PersonalInfo />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/security" element={
                  <ProtectedRoute>
                    <Security />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/language" element={
                  <ProtectedRoute>
                    <Language />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/privacy" element={
                  <ProtectedRoute>
                    <Privacy />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/help" element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                } />
                
                {/* PAGINE LEGALI: Accessibili a tutti */}
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* COMPATIBILITÀ: Route legacy */}
                <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTracker>
          </BrowserRouter>
          <Toaster />
          <Sonner />
          {/* <AnalyticsConsent /> */}
          
          {/* Banner per consenso accesso file */}
          <FileAccessBanner
            isVisible={showBanner}
            onAccept={acceptFileAccess}
            onDecline={declineFileAccess}
          />
        </TooltipProvider>
        </NotesProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
