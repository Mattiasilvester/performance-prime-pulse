import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, AuthProvider } from '@pp/shared'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NotificationProvider } from './hooks/useNotifications'
import { PrimeBotProvider, usePrimeBot } from './contexts/PrimeBotContext'
import MobileScrollFix from '@/components/MobileScrollFix'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import CookieBanner from '@/components/legal/CookieBanner'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

import { NewLandingPage } from '@/pages/landing/NewLandingPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import LoginPage from '@/pages/auth/LoginPage'

const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'))
const MainPrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const SonnerToaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })))

const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const Workouts = lazy(() => import('@/components/workouts/Workouts').then(m => ({ default: m.Workouts })))
const QuickWorkout = lazy(() => import('@/pages/QuickWorkout'))
const Timer = lazy(() => import('@/pages/Timer'))
const Schedule = lazy(() => import('@/components/schedule/Schedule').then(m => ({ default: m.Schedule })))
const AICoach = lazy(() => import('@/components/ai/AICoach').then(m => ({ default: m.AICoach })))
const Subscriptions = lazy(() => import('@/pages/Subscriptions'))
const Professionals = lazy(() => import('@/pages/Professionals'))
const ProfessionalDetail = lazy(() => import('@/pages/ProfessionalDetail'))
const Profile = lazy(() => import('@/components/profile/Profile').then(m => ({ default: m.Profile })))
const DiaryPage = lazy(() => import('@/pages/diary/DiaryPage'))
const DiaryNotesPage = lazy(() => import('@/pages/diary/DiaryNotesPage'))
const PersonalInfo = lazy(() => import('@/pages/settings/PersonalInfo'))
const Security = lazy(() => import('@/pages/settings/Security'))
const Notifications = lazy(() => import('@/pages/settings/Notifications'))
const Language = lazy(() => import('@/pages/settings/Language'))
const Privacy = lazy(() => import('@/pages/settings/Privacy'))
const Help = lazy(() => import('@/pages/settings/Help'))

const PlansPage = lazy(() => import('@/pages/piani/PlansPage'))
const PlanCreationPage = lazy(() => import('@/pages/piani/PlanCreationPage'))
const ActivePlansPage = lazy(() => import('@/pages/piani/ActivePlansPage').then(m => ({ default: m.ActivePlansPage })))

const AICoachWrapper = ({ session }: { session: Session | null }) => {
  const { isFullscreen } = usePrimeBot();

  return (
    <ProtectedRoute session={session}>
      <Header />
      <div className="min-h-screen pt-24 pb-20">
        <Suspense fallback={<PageSkeleton />}>
          <AICoach />
        </Suspense>
      </div>
      {!isFullscreen && <BottomNavigation />}
      <ConditionalFeedbackWidget />
    </ProtectedRoute>
  );
};

const ConditionalFeedbackWidget = () => {
  const location = useLocation();
  const isTimerPage = location.pathname === '/timer';
  if (isTimerPage) return null;
  return <FeedbackWidget />;
};

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
            <CookieBanner />
            <Suspense fallback={<PageSkeleton variant="default" />}>
              <Routes>
                <Route path="/" element={<NewLandingPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth/login" element={
                  session ? <Navigate to="/dashboard" /> : <LoginPage />
                } />
                <Route path="/auth" element={<LoginPage />} />
                <Route path="/auth/register" element={
                  session ? <Navigate to="/dashboard" /> : (
                    <Suspense fallback={<PageSkeleton />}>
                      <RegisterPage />
                    </Suspense>
                  )
                } />
                <Route path="/terms-and-conditions" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <TermsAndConditions />
                  </Suspense>
                } />
                <Route path="/privacy-policy" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <MainPrivacyPolicy />
                  </Suspense>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<PageSkeleton variant="dashboard" />}>
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
                      <Suspense fallback={<PageSkeleton variant="dashboard" />}>
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
                    <Suspense fallback={<PageSkeleton variant="dashboard" />}>
                      <DiaryPage />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/diary/notes" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <DiaryNotesPage />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/workout/quick" element={
                  <ProtectedRoute session={session}>
                    <Suspense fallback={<PageSkeleton />}>
                      <QuickWorkout />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/timer" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
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
                      <Suspense fallback={<PageSkeleton />}>
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
                    <Suspense fallback={<PageSkeleton />}>
                      <Subscriptions />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/professionals" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<PageSkeleton />}>
                        <Professionals />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/professionals/:id" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<PageSkeleton />}>
                        <ProfessionalDetail />
                      </Suspense>
                    </div>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <div className="min-h-screen pt-24 pb-20">
                      <Suspense fallback={<PageSkeleton />}>
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
                      <Suspense fallback={<PageSkeleton variant="dashboard" />}>
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
                      <Suspense fallback={<PageSkeleton />}>
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
                      <Suspense fallback={<PageSkeleton />}>
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
                    <Suspense fallback={<PageSkeleton />}>
                      <PersonalInfo />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/security" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <Security />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/notifications" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <Notifications />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/language" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <Language />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/privacy" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <Privacy />
                    </Suspense>
                    <BottomNavigation />
                    <ConditionalFeedbackWidget />
                  </ProtectedRoute>
                } />
                <Route path="/settings/help" element={
                  <ProtectedRoute session={session}>
                    <Header />
                    <Suspense fallback={<PageSkeleton />}>
                      <Help />
                    </Suspense>
                    <BottomNavigation />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
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
