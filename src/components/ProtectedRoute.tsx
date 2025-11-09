import { Navigate, useLocation } from 'react-router-dom'
import { safeLocalStorage } from '@/utils/domHelpers'

interface ProtectedRouteProps {
  session: any
  children: React.ReactNode
}

export default function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation();

  // Permetti accesso all'onboarding anche senza auth
  if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
    const isOnboarding = safeLocalStorage.getItem('isOnboarding');
    if (isOnboarding === 'true') {
      return <>{children}</>;
    }
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  
  return <>{children}</>
} 