import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'

// Import componenti
import LandingPage from '@/landing/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import TermsAndConditions from '@/pages/TermsAndConditions'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import Auth from '@/pages/Auth'
import Workouts from '@/pages/Workouts'
import Timer from '@/pages/Timer'
import Schedule from '@/pages/Schedule'
import AICoach from '@/pages/AICoach'
import Subscriptions from '@/pages/Subscriptions'
import Profile from '@/pages/Profile'
import PersonalInfo from '@/pages/settings/PersonalInfo'
import Security from '@/pages/settings/Security'
import Notifications from '@/pages/settings/Notifications'
import Language from '@/pages/settings/Language'
import Privacy from '@/pages/settings/Privacy'
import Help from '@/pages/settings/Help'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import BottomNavigation from '@/components/layout/BottomNavigation'

// Import SuperAdmin components
import SuperAdminLogin from '@/pages/admin/SuperAdminLogin'
import SuperAdminDashboard from '@/pages/admin/SuperAdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import TestConnection from '@/pages/admin/TestConnection'
import DatabaseDiagnostic from '@/pages/admin/DatabaseDiagnostic'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminSystem from '@/pages/admin/AdminSystem'
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs'
import AdminGuard from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check sessione attuale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen per cambi auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* ROUTE PUBBLICHE */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={
                session ? <Navigate to="/dashboard" /> : <LoginPage />
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/register" element={
                session ? <Navigate to="/dashboard" /> : <RegisterPage />
              } />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* ROUTE PROTETTE */}
              <Route path="/dashboard" element={
                <ProtectedRoute session={session}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/workouts" element={
                <ProtectedRoute session={session}>
                  <Workouts />
                </ProtectedRoute>
              } />
              <Route path="/timer" element={
                <ProtectedRoute session={session}>
                  <Timer />
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute session={session}>
                  <Schedule />
                </ProtectedRoute>
              } />
              <Route path="/ai-coach" element={
                <ProtectedRoute session={session}>
                  <AICoach />
                </ProtectedRoute>
              } />
              <Route path="/subscriptions" element={
                <ProtectedRoute session={session}>
                  <Subscriptions />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute session={session}>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings/personal-info" element={
                <ProtectedRoute session={session}>
                  <PersonalInfo />
                </ProtectedRoute>
              } />
              <Route path="/settings/security" element={
                <ProtectedRoute session={session}>
                  <Security />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute session={session}>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/settings/language" element={
                <ProtectedRoute session={session}>
                  <Language />
                </ProtectedRoute>
              } />
              <Route path="/settings/privacy" element={
                <ProtectedRoute session={session}>
                  <Privacy />
                </ProtectedRoute>
              } />
              <Route path="/settings/help" element={
                <ProtectedRoute session={session}>
                  <Help />
                </ProtectedRoute>
              } />
              
              {/* ROUTE SUPERADMIN NASCOSTE - NON LINKATE DA NESSUNA PARTE */}
              <Route path="/nexus-prime-control" element={<SuperAdminLogin />} />
              <Route path="/test-db" element={<TestConnection />} />
              <Route path="/diagnostic" element={<DatabaseDiagnostic />} />
              <Route path="/nexus-prime-control/*" element={
                <AdminGuard>
                  <AdminLayout>
                    <Routes>
                      <Route path="dashboard" element={<SuperAdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="system" element={<AdminSystem />} />
                      <Route path="logs" element={<AdminAuditLogs />} />
                      <Route path="diagnostic" element={<DatabaseDiagnostic />} />
                    </Routes>
                  </AdminLayout>
                </AdminGuard>
              } />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
