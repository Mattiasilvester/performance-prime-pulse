import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ResetPassword from '@/pages/ResetPassword';

export const ResetPasswordDebug = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('=== RESET PASSWORD DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Hash:', window.location.hash);
    console.log('=== END DEBUG ===');
  }, [searchParams]);

  return <ResetPassword />;
};