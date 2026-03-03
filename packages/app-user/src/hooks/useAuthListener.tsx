import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthListener = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        
        // Gestisci eventi auth
        switch (event) {
          case 'SIGNED_IN':
            break;
          case 'SIGNED_OUT':
            break;
          case 'TOKEN_REFRESHED':
            break;
          case 'USER_UPDATED':
            break;
          case 'MFA_CHALLENGE_VERIFIED':
            break;
          case 'PASSWORD_RECOVERY':
            break;
          case 'INITIAL_SESSION':
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}; 