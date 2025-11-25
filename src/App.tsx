import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { PrimeBotProvider, usePrimeBot } from './contexts/PrimeBotContext'
import MobileScrollFix from '@/components/MobileScrollFix'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import { FeatureFlagDebug } from '@/components/FeatureFlagDebug'

// Import componenti core (non lazy)
import LandingPage from '@/landing/pages/LandingPage'
import { NewLandingPage } from '@/pages/landing/NewLandingPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import LoginPage from '@/pages/auth/LoginPage'
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const SonnerToaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })))

// Lazy loading per componenti pesanti
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const Workouts = lazy(() => import('@/components/workouts/Workouts').then(m => ({ default: m.Workouts })))
const QuickWorkout = lazy(() => import('@/pages/QuickWorkout'))
const Timer = lazy(() => import('@/pages/Timer'))
const Schedule = lazy(() => import('@/components/schedule/Schedule').then(m => ({ default: m.Schedule })))
const AICoach = lazy(() => import('@/components/ai/AICoach').then(m => ({ default: m.AICoach })))
const Subscriptions = lazy(() => import('@/pages/Subscriptions'))
const Profile = lazy(() => import('@/components/profile/Profile').then(m => ({ default: m.Profile })))
const DiaryPage = lazy(() => import('@/pages/diary/DiaryPage'))
const DiaryNotesPage = lazy(() => import('@/pages/diary/DiaryNotesPage'))
const PersonalInfo = lazy(() => import('@/pages/settings/PersonalInfo'))
const Security = lazy(() => import('@/pages/settings/Security'))
const Notifications = lazy(() => import('@/pages/settings/Notifications'))
const Language = lazy(() => import('@/pages/settings/Language'))
const Privacy = lazy(() => import('@/pages/settings/Privacy'))
const Help = lazy(() => import('@/pages/settings/Help'))

// Lazy loading per Piano Personalizzato
const PlansPage = lazy(() => import('@/pages/piani/PlansPage'))
const PlanCreationPage = lazy(() => import('@/pages/piani/PlanCreationPage'))
const ActivePlansPage = lazy(() => import('@/pages/piani/ActivePlansPage').then(m => ({ default: m.ActivePlansPage })))

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
const AICoachWrapper = ({ session }: { session: Session | null }) => {
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
      <ConditionalFeedbackWidget />
    </ProtectedRoute>
  );
};

// Componente wrapper per FeedbackWidget che nasconde il feedback nella pagina timer
const ConditionalFeedbackWidget = () => {
  const location = useLocation();
  const isTimerPage = location.pathname === '/timer';
  
  if (isTimerPage) {
    return null;
  }
  
  return <FeedbackWidget />;
};

// Componente wrapper per A/B testing landing page
const LandingPageWrapper = () => {
  const { useNewLanding } = useFeatureFlag();
  const showNewLanding = useNewLanding();
  
  return showNewLanding ? <NewLandingPage /> : <LandingPage />;
};

// Componente wrapper per FeatureFlagDebug che accede alla location
function FeatureFlagDebugWrapper() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  
  return (
    <>
      {/* 
        🔒 FEATURE FLAGS DEBUG
        Visibile solo in landing page, nascosto in dashboard e route protette
        TODO: Rimuovere definitivamente in futuro
      */}
      {import.meta.env.DEV && !isDashboardRoute && <FeatureFlagDebug />}
    </>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
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
                <Route path="/" element={<LandingPageWrapper />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/landing-v1" element={<LandingPage />} />
                <Route path="/landing-new" element={<NewLandingPage />} />
                <Route path="/auth/login" element={
                  session ? <Navigate to="/dashboard" /> : <LoginPage />
                } />
                <Route path="/auth" element={<LoginPage />} />
                <Route path="/auth/register" element={
                  session ? <Navigate to="/dashboard" /> : (
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Caricamento...</div>}>
                      <RegisterPage />
                    </Suspense>
                  )
                } />
                <Route path="/terms-and-conditions" element={
                  <Suspense fallback={<div className="min-h-screen bg-black" />}>
                    <TermsAndConditions />
                  </Suspense>
                } />
                <Route path="/privacy-policy" element={
                  <Suspense fallback={<div className="min-h-screen bg-black" />}>
                    <PrivacyPolicy />
                  </Suspense>
                } />
                
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
                    <ConditionalFeedbackWidget />
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
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/diary" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <DiaryPage />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/diary/notes" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <DiaryNotesPage />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
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
                    <ConditionalFeedbackWidget />
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
                    <ConditionalFeedbackWidget />
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
                    <ConditionalFeedbackWidget />
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
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/piani" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <PlansPage />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/piani/nuovo" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <PlanCreationPage />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/piani-attivi" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<LoadingSpinner />}>
                        <ActivePlansPage />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/personal-info" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <PersonalInfo />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/security" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Security />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/notifications" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Notifications />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/language" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Language />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/privacy" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Privacy />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
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
            <FeatureFlagDebugWrapper />
          </Router>
          <Toaster />
          <Suspense fallback={null}>
            <SonnerToaster position="top-center" />
          </Suspense>
        </PrimeBotProvider>
      </NotificationProvider>
    </AuthProvider>
  </ErrorBoundary>
  )
}

export default App
// console.log('Vercel deploy:', new Date());
