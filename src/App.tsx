import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MVPHomePage } from "./components/MVPHomePage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Schedule from "./pages/Schedule";
import AICoach from "./pages/AICoach";
import Profile from "./pages/Profile";
import Notes from "./pages/Notes";
import Timer from "./pages/Timer";
import Subscriptions from "./pages/Subscriptions";
import PersonalInfo from "./pages/settings/PersonalInfo";
import Security from "./pages/settings/Security";
import Notifications from "./pages/settings/Notifications";
import Language from "./pages/settings/Language";
import Privacy from "./pages/settings/Privacy";
import PrivacyPolicy from "./pages/settings/PrivacyPolicy";
import Help from "./pages/settings/Help";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const AppContent = () => (
  <BrowserRouter>
    <Routes>
      {/* MVP Homepage - Redirect diretto al login */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      {/* Redirect legacy routes */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      <Route path="/app/ai-coach" element={
        <ProtectedRoute>
          <AppLayout>
            <AICoach />
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
      <Route path="/app/settings/personal-info" element={
        <ProtectedRoute>
          <PersonalInfo />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/security" element={
        <ProtectedRoute>
          <Security />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/language" element={
        <ProtectedRoute>
          <Language />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/privacy" element={
        <ProtectedRoute>
          <Privacy />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/privacy-policy" element={
        <ProtectedRoute>
          <PrivacyPolicy />
        </ProtectedRoute>
      } />
      <Route path="/app/settings/help" element={
        <ProtectedRoute>
          <Help />
        </ProtectedRoute>
      } />
      {/* Fallback - Qualsiasi route non trovata torna alla homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
