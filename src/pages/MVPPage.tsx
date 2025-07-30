import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import Landing from './Landing';

const MVPPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-pp-gold text-xl">Caricamento...</div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  // If user is not authenticated, show the landing page
  return <Landing />;
};

export default MVPPage;