import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { PrimeBotProvider, usePrimeBot } from './contexts/PrimeBotContext'
import MobileScrollFix from '@/components/MobileScrollFix'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Header } from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'

// Import componenti core (non lazy)
import LandingPage from '@/landing/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import TermsAndConditions from '@/pages/TermsAndConditions'
import PrivacyPolicy from '@/pages/PrivacyPolicy'

// Lazy loading per componenti pesanti
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const Workouts = lazy(() => import('@/components/workouts/Workouts').then(m => ({ default: m.Workouts })))
const QuickWorkout = lazy(() => import('@/pages/QuickWorkout'))
const Timer = lazy(() => import('@/pages/Timer'))
const Schedule = lazy(() => import('@/components/schedule/Schedule').then(m => ({ default: m.Schedule })))
const AICoach = lazy(() => import('@/components/ai/AICoach').then(m => ({ default: m.AICoach })))
const Subscriptions = lazy(() => import('@/pages/Subscriptions'))
const Profile = lazy(() => import('@/components/profile/Profile').then(m => ({ default: m.Profile })))
const PersonalInfo = lazy(() => import('@/pages/settings/PersonalInfo'))
const Security = lazy(() => import('@/pages/settings/Security'))
const Notifications = lazy(() => import('@/pages/settings/Notifications'))
const Language = lazy(() => import('@/pages/settings/Language'))
const Privacy = lazy(() => import('@/pages/settings/Privacy'))
const Help = lazy(() => import('@/pages/settings/Help'))

// Lazy loading per SuperAdmin components
const SuperAdminLogin = lazy(() => import('@/pages/admin/SuperAdminLogin'))
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const TestConnection = lazy(() => import('@/pages/admin/TestConnection'))
const DatabaseDiagnostic = lazy(() => import('@/pages/admin/DatabaseDiagnostic'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminSystem = lazy(() => import('@/pages/admin/AdminSystem'))
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'))
const AdminGuard = lazy(() => import('@/components/admin/AdminGuard'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))

// Loading component per lazy loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EEBA2B]"></div>
  </div>
)

// Componente wrapper per ai-coach che gestisce il footer condizionalmente
const AICoachWrapper = ({ session }: { session: any }) => {
  const { isFullscreen } = usePrimeBot();
  
  return (
    <ProtectedRoute session={session}>
      <Header />
      <div className="min-h-screen pt-24 pb-20">
        <Suspense fallback={<LoadingSpinner />}>
          <AICoach />
        </Suspense>
      </div>
      {!isFullscreen && <BottomNavigation />}
      <FeedbackWidget />
    </ProtectedRoute>
  );
};

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Force cache invalidation and scroll fix
  useEffect(() => {
    // console.log('Build version:', new Date().toISOString());
    // console.log('Emergency scroll fix applied');
    
    // Force scroll enabled
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
  }, []);

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
      <MobileScrollFix />
      <AuthProvider>
        <NotificationProvider>
          <PrimeBotProvider>
            <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* ROUTE PUBBLICHE */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/login" element={
                  session ? <Navigate to="/dashboard" /> : <LoginPage />
                } />
                <Route path="/auth" element={<LoginPage />} />
                <Route path="/auth/register" element={
                  session ? <Navigate to="/dashboard" /> : <RegisterPage />
                } />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* ROUTE PROTETTE */}
                <Route path="/dashboard" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Dashboard />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/workouts" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Workouts />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/workout/quick" element={
                  <ProtectedRoute session={session}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <QuickWorkout />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/timer" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Timer />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/schedule" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Schedule />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/ai-coach" element={<AICoachWrapper session={session} />} />
                <Route path="/subscriptions" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Subscriptions />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Profile />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/personal-info" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <PersonalInfo />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/security" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Security />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/notifications" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Notifications />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/language" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Language />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/privacy" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Privacy />
                    </Suspense>
                    <BottomNavigation />
                    <FeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/help" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Help />
                    </Suspense>
                    <BottomNavigation />
                  </ProtectedRoute>
                } />
                
                {/* ROUTE SUPERADMIN NASCOSTE - NON LINKATE DA NESSUNA PARTE */}
                <Route path="/nexus-prime-control" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <SuperAdminLogin />
                  </Suspense>
                } />
                <Route path="/test-db" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <TestConnection />
                  </Suspense>
                } />
                <Route path="/diagnostic" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <DatabaseDiagnostic />
                  </Suspense>
                } />
                <Route path="/nexus-prime-control/*" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminGuard>
                      <AdminLayout>
                        <Routes>
                          <Route path="dashboard" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SuperAdminDashboard />
                            </Suspense>
                          } />
                          <Route path="users" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminUsers />
                            </Suspense>
                          } />
                          <Route path="analytics" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminAnalytics />
                            </Suspense>
                          } />
                          <Route path="system" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminSystem />
                            </Suspense>
                          } />
                          <Route path="logs" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminAuditLogs />
                            </Suspense>
                          } />
                          <Route path="diagnostic" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <DatabaseDiagnostic />
                            </Suspense>
                          } />
                        </Routes>
                      </AdminLayout>
                    </AdminGuard>
                  </Suspense>
                } />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
          <SonnerToaster />
        </PrimeBotProvider>
      </NotificationProvider>
    </AuthProvider>
  </ErrorBoundary>
  )
}

export default App
// console.log('Vercel deploy:', new Date());
