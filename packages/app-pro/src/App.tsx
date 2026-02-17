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
import CookieBanner from '@/components/legal/CookieBanner'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

// Import componenti core (non lazy)
import { NewLandingPage } from '@/pages/landing/NewLandingPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import LoginPage from '@/pages/auth/LoginPage'
import Partner from '@/pages/Partner'
import PartnerLandingPage from '@/pages/partner/PartnerLandingPage'
import PartnerRegistration from '@/pages/partner/PartnerRegistration'
import PartnerLogin from '@/pages/partner/PartnerLogin'
import PartnerResetPassword from '@/pages/partner/PartnerResetPassword'
import UpdatePasswordPage from '@/pages/partner/UpdatePasswordPage'
import TermsConditions from '@/pages/partner/legal/TermsConditions'
import PartnerPrivacyPolicy from '@/pages/partner/legal/PrivacyPolicy'
import CookiePolicy from '@/pages/partner/legal/CookiePolicy'
import PartnerDashboard from '@/pages/partner/PartnerDashboard'
import OverviewPage from '@/pages/partner/dashboard/OverviewPage'
import CalendarioPage from '@/pages/partner/dashboard/CalendarioPage'
import PrenotazioniPage from '@/pages/partner/dashboard/PrenotazioniPage'
import ClientiPage from '@/pages/partner/dashboard/ClientiPage'
import ProgettiPage from '@/pages/partner/dashboard/ProgettiPage'
import ProfiloPage from '@/pages/partner/dashboard/ProfiloPage'
import ImpostazioniPage from '@/pages/partner/dashboard/ImpostazioniPage'
import FeedbackPage from '@/pages/partner/dashboard/FeedbackPage'
import ReviewsPage from '@/pages/partner/dashboard/ReviewsPage'
import ServiziTariffePage from '@/pages/partner/ServiziTariffePage'
import AbbonamentoPage from '@/pages/partner/dashboard/AbbonamentoPage'
import CostiSpesePage from '@/pages/partner/dashboard/CostiSpesePage'
import AndamentoPage from '@/pages/partner/dashboard/AndamentoPage'
import ReportSettimanale from '@/pages/partner/dashboard/ReportSettimanale'
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'))
const MainPrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const SonnerToaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })))

// Lazy loading per componenti pesanti
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
const AdminCancellations = lazy(() => import('@/pages/admin/AdminCancellations'))
const AdminFeedbacks = lazy(() => import('@/pages/admin/AdminFeedbacks'))
const AdminGuard = lazy(() => import('@/components/admin/AdminGuard'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))


// Componente wrapper per ai-coach che gestisce il footer condizionalmente
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

// Componente wrapper per FeedbackWidget che nasconde il feedback nella pagina timer
const ConditionalFeedbackWidget = () => {
  const location = useLocation();
  const isTimerPage = location.pathname === '/timer';
  
  if (isTimerPage) {
    return null;
  }
  
  return <FeedbackWidget />;
};

// Fallback: se path inizia con /partner → PrimePro home, altrimenti → Performance Prime landing
const FallbackRedirect = () => {
  const location = useLocation();
  const pathname = location.pathname ?? '';
  if (pathname.startsWith('/partner')) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/" replace />;
};

// Root "/": se il dominio è PrimePro (es. primepro.performanceprime.it) → vai a /partner
const LandingOrPartnerRedirect = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isPrimeProDomain = hostname.includes('primepro');
  if (isPrimeProDomain) {
    return <Navigate to="/" replace />;
  }
  return <NewLandingPage />;
};

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

    // Listen per cambi auth (incluso PASSWORD_RECOVERY → redirect a pagina nuova password)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/partner/update-password'
      }
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
                {/* ROUTE PUBBLICHE */}
                <Route path="/" element={<PartnerLandingPage />} />
                {/* Route /partner/* specifiche PRIMA del redirect, così /partner/login e /partner/dashboard non vengono intercettate */}
                <Route path="/partner/registrazione" element={<PartnerRegistration />} />
                <Route path="/partner/login" element={<PartnerLogin />} />
                <Route path="/partner/reset-password" element={<PartnerResetPassword />} />
                <Route path="/partner/update-password" element={<UpdatePasswordPage />} />
                <Route path="/partner/terms" element={<TermsConditions />} />
                <Route path="/partner/privacy" element={<PartnerPrivacyPolicy />} />
                <Route path="/partner/cookies" element={<CookiePolicy />} />
                <Route path="/partner/dashboard" element={<PartnerDashboard />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="calendario" element={<CalendarioPage />} />
                  <Route path="prenotazioni" element={<PrenotazioniPage />} />
                  <Route path="clienti" element={<ClientiPage />} />
                  <Route path="clienti/progetti" element={<ProgettiPage />} />
                  <Route path="profilo" element={<ProfiloPage />} />
                  <Route path="servizi" element={<ServiziTariffePage />} />
                  <Route path="costi-spese" element={<CostiSpesePage />} />
                  <Route path="andamento" element={<AndamentoPage />} />
                  <Route path="report-settimanale" element={<ReportSettimanale />} />
                  <Route path="recensioni" element={<ReviewsPage />} />
                  <Route path="abbonamento" element={<AbbonamentoPage />} />
                  <Route path="impostazioni" element={<ImpostazioniPage />} />
                  <Route path="feedback" element={<FeedbackPage />} />
                </Route>
                {/* Redirect solo per path esatto /partner (dopo tutte le /partner/*) */}
                <Route path="/partner" element={<Navigate to="/" replace />} />
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
                
                {/* ROUTE PROTETTE */}
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
                
                {/* ROUTE SUPERADMIN NASCOSTE - NON LINKATE DA NESSUNA PARTE */}
                <Route path="/nexus-prime-control" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <SuperAdminLogin />
                  </Suspense>
                } />
                <Route path="/test-db" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <TestConnection />
                  </Suspense>
                } />
                <Route path="/diagnostic" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <DatabaseDiagnostic />
                  </Suspense>
                } />
                <Route path="/nexus-prime-control/*" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminGuard>
                      <AdminLayout>
                        <Routes>
                          <Route index element={<Navigate to="dashboard" replace />} />
                          <Route path="dashboard" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <SuperAdminDashboard />
                            </Suspense>
                          } />
                          <Route path="users" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminUsers />
                            </Suspense>
                          } />
                          <Route path="analytics" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminAnalytics />
                            </Suspense>
                          } />
                          <Route path="feedbacks" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminFeedbacks />
                            </Suspense>
                          } />
                          <Route path="system" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminSystem />
                            </Suspense>
                          } />
                          <Route path="logs" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminAuditLogs />
                            </Suspense>
                          } />
                          <Route path="cancellations" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AdminCancellations />
                            </Suspense>
                          } />
                          <Route path="diagnostic" element={
                            <Suspense fallback={<PageSkeleton />}>
                              <DatabaseDiagnostic />
                            </Suspense>
                          } />
                        </Routes>
                      </AdminLayout>
                    </AdminGuard>
                  </Suspense>
                } />
                
                {/* Fallback: path /partner* → PrimePro, altrimenti → Performance Prime */}
                <Route path="*" element={<FallbackRedirect />} />
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
// console.log('Vercel deploy:', new Date());
