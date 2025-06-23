
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Schedule from "./pages/Schedule";
import AICoach from "./pages/AICoach";
import Profile from "./pages/Profile";
import Notes from "./pages/Notes";
import Timer from "./pages/Timer";
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
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={
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
      <Route path="/timer" element={
        <ProtectedRoute>
          <AppLayout>
            <Timer />
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
      <Route path="/settings/privacy-policy" element={
        <ProtectedRoute>
          <PrivacyPolicy />
        </ProtectedRoute>
      } />
      <Route path="/settings/help" element={
        <ProtectedRoute>
          <Help />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
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
