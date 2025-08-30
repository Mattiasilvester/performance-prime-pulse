
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  session: any;
  children: React.ReactNode;
}

export const ProtectedRoute = ({ session, children }: ProtectedRouteProps) => {
  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};
