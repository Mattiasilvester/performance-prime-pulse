import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import Landing from './Landing';

const MVPPage = () => {
  console.log('MVPPage rendering...');
  const { user, loading } = useAuth();
  
  console.log('Auth state:', { user: !!user, loading });

  if (loading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-pp-gold text-xl">Caricamento...</div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    console.log('User authenticated, showing dashboard');
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  // If user is not authenticated, show the landing page
  console.log('User not authenticated, showing landing');
  return <Landing />;
};

export default MVPPage;