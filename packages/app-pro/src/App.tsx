import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from '@pp/shared'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@pp/shared'
import { NotificationProvider } from './hooks/useNotifications'
import { Toaster } from '@/components/ui/toaster'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import CookieBanner from '@/components/legal/CookieBanner'
import PartnerLandingPage from '@/pages/partner/PartnerLandingPage'

// Partner - direct imports
import PartnerLogin from '@/pages/partner/PartnerLogin'
import PartnerRegistration from '@/pages/partner/PartnerRegistration'
import PartnerResetPassword from '@/pages/partner/PartnerResetPassword'
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
import ReviewsPage from '@/pages/partner/dashboard/ReviewsPage'
import ServiziTariffePage from '@/pages/partner/ServiziTariffePage'
import AbbonamentoPage from '@/pages/partner/dashboard/AbbonamentoPage'
import CostiSpesePage from '@/pages/partner/dashboard/CostiSpesePage'
import AndamentoPage from '@/pages/partner/dashboard/AndamentoPage'
import ReportSettimanale from '@/pages/partner/dashboard/ReportSettimanale'

// Admin - lazy
const SuperAdminLogin = lazy(() => import('@/pages/admin/SuperAdminLogin'))
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const TestConnection = lazy(() => import('@/pages/admin/TestConnection'))
const DatabaseDiagnostic = lazy(() => import('@/pages/admin/DatabaseDiagnostic'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminSystem = lazy(() => import('@/pages/admin/AdminSystem'))
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'))
const AdminCancellations = lazy(() => import('@/pages/admin/AdminCancellations'))
const AdminGuard = lazy(() => import('@/components/admin/AdminGuard'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const SonnerToaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })))

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.height = 'auto'
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center">Caricamento...</div>
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <CookieBanner />
            <Suspense fallback={<PageSkeleton variant="default" />}>
              <Routes>
                <Route path="/" element={<PartnerLandingPage />} />
                <Route path="/partner" element={<Navigate to="/partner/login" replace />} />

                {/* Partner public */}
                <Route path="/partner/registrazione" element={<PartnerRegistration />} />
                <Route path="/partner/login" element={<PartnerLogin />} />
                <Route path="/partner/reset-password" element={<PartnerResetPassword />} />
                <Route path="/partner/terms" element={<TermsConditions />} />
                <Route path="/partner/privacy" element={<PartnerPrivacyPolicy />} />
                <Route path="/partner/cookies" element={<CookiePolicy />} />

                {/* Partner dashboard */}
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
                </Route>

                {/* SuperAdmin */}
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
                          <Route path="dashboard" element={<Suspense fallback={<PageSkeleton />}><SuperAdminDashboard /></Suspense>} />
                          <Route path="users" element={<Suspense fallback={<PageSkeleton />}><AdminUsers /></Suspense>} />
                          <Route path="analytics" element={<Suspense fallback={<PageSkeleton />}><AdminAnalytics /></Suspense>} />
                          <Route path="system" element={<Suspense fallback={<PageSkeleton />}><AdminSystem /></Suspense>} />
                          <Route path="logs" element={<Suspense fallback={<PageSkeleton />}><AdminAuditLogs /></Suspense>} />
                          <Route path="cancellations" element={<Suspense fallback={<PageSkeleton />}><AdminCancellations /></Suspense>} />
                          <Route path="diagnostic" element={<Suspense fallback={<PageSkeleton />}><DatabaseDiagnostic /></Suspense>} />
                        </Routes>
                      </AdminLayout>
                    </AdminGuard>
                  </Suspense>
                } />

                <Route path="*" element={<Navigate to="/partner/login" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
            <Suspense fallback={null}>
              <SonnerToaster position="top-center" />
            </Suspense>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
