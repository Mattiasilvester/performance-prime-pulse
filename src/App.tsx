import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

// Layout e componenti principali
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pagine principali
import SmartHomePage from '@/pages/SmartHomePage';
import Dashboard from '@/pages/Dashboard';
import Workouts from '@/pages/Workouts';
import Schedule from '@/pages/Schedule';
import AICoach from '@/pages/AICoach';
import Profile from '@/pages/Profile';
import Notes from '@/pages/Notes';

// Pagine di impostazioni
import Notifications from '@/pages/settings/Notifications';
import Language from '@/pages/settings/Language';
import Help from '@/pages/settings/Help';
import Privacy from '@/pages/settings/Privacy';
import PrivacyPolicy from '@/pages/settings/PrivacyPolicy';
import TermsAndConditions from '@/pages/TermsAndConditions';

// Landing page
import LandingPage from '@/landing/pages/LandingPage';
import AuthPage from '@/landing/pages/AuthPage';
import PrivacyPolicyLanding from '@/landing/pages/PrivacyPolicy';

// Test di integrazione (solo in development)
import { runSimpleIntegrationTests } from '@/utils/simple-integration-test';
import { quickSupabaseTest } from '@/utils/quick-test';

function App() {
  const { toast } = useToast();

  // Esegui test di integrazione solo in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🧪 Avvio test integrazione semplificato in development mode...');
      
      // Test rapido Supabase
      quickSupabaseTest().then(success => {
        if (success) {
          console.log('✅ Test rapido Supabase PASSATO');
        } else {
          console.log('❌ Test rapido Supabase FALLITO');
        }
      });
      
      // Test integrazione completo
      runSimpleIntegrationTests()
        .then(results => {
          const failedTests = results.filter(r => r.status === 'FAIL');
          if (failedTests.length > 0) {
            console.warn('⚠️ Alcuni test di integrazione sono falliti:', failedTests);
            toast({
              title: "Test Integrazione",
              description: `${failedTests.length} test falliti. Controlla la console per i dettagli.`,
              variant: "destructive"
            });
          } else {
            console.log('✅ Tutti i test di integrazione sono passati!');
            toast({
              title: "Test Integrazione",
              description: "Tutti i test sono passati! Integrazione OK al 100%",
            });
          }
        })
        .catch(error => {
          console.error('❌ Errore durante i test di integrazione:', error);
          toast({
            title: "Errore Test",
            description: "Errore durante l'esecuzione dei test di integrazione",
            variant: "destructive"
          });
        });
    }
  }, [toast]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing e Auth */}
          <Route path="/" element={<SmartHomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* App principale con layout protetto */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/workouts" element={
            <ProtectedRoute>
              <AppLayout>
                <Workouts />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/schedule" element={
            <ProtectedRoute>
              <AppLayout>
                <Schedule />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/ai-coach" element={
            <ProtectedRoute>
              <AppLayout>
                <AICoach />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/notes" element={
            <ProtectedRoute>
              <AppLayout>
                <Notes />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Impostazioni */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Help />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/notifications" element={
            <ProtectedRoute>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/language" element={
            <ProtectedRoute>
              <AppLayout>
                <Language />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/help" element={
            <ProtectedRoute>
              <AppLayout>
                <Help />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/privacy" element={
            <ProtectedRoute>
              <AppLayout>
                <Privacy />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/terms" element={
            <ProtectedRoute>
              <AppLayout>
                <TermsAndConditions />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/about" element={
            <ProtectedRoute>
              <AppLayout>
                <PrivacyPolicy />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Redirect di default */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
