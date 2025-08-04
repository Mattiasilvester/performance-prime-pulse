import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { useAuthListener } from '@/hooks/useAuthListener';

// Import diretto per MVP
import SmartHomePage from './pages/SmartHomePage';
import Auth from './public/pages/Auth';
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

const queryClient = new QueryClient();

const App = () => {
  // Monitora cambiamenti stato auth
  useAuthListener();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Homepage intelligente con redirect basato su auth */}
              <Route path="/" element={<SmartHomePage />} />
              
              {/* Pagina di autenticazione */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Pagina di reset password */}
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Route protette */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
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
              
              <Route path="/terms-and-conditions" element={
                <ProtectedRoute>
                  <TermsAndConditions />
                </ProtectedRoute>
              } />
              
              <Route path="/privacy-policy" element={
                <ProtectedRoute>
                  <PrivacyPolicy />
                </ProtectedRoute>
              } />
              
              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
