import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GoogleWelcomeScreen } from './steps/GoogleWelcomeScreen';

export default function GoogleWelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'atleta';

  return (
    <GoogleWelcomeScreen
      userName={userName}
      onContinue={() => navigate('/onboarding?step=1', { replace: true })}
    />
  );
}
