import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthListener = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event);
        console.log('👤 Session:', session?.user ? 'Active' : 'None');
        
        // Gestisci eventi auth
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in');
            break;
          case 'SIGNED_OUT':
            console.log('❌ User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('👤 User updated');
            break;
          case 'MFA_CHALLENGE_VERIFIED':
            console.log('🔐 MFA challenge verified');
            break;
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated');
            break;
          case 'INITIAL_SESSION':
            console.log('🚀 Initial session loaded');
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}; 