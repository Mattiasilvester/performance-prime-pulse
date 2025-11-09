import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';

function useNewLanding(): boolean {
  const { user } = useAuth();
  const { enabled, percentage, forcedUsers } = FEATURES.NEW_LANDING;
  
  // Check URL parameter per testing
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('force-new-landing') === 'true') return true;
  if (urlParams.get('force-old-landing') === 'true') return false;
  
  // Force per utenti specifici
  if (user?.email && forcedUsers.includes(user.email)) return true;
  
  // A/B test basato su user ID o session
  if (enabled) {
    if (percentage === 100) return true;
    if (percentage === 0) return false;
    
    // Use sessionStorage per consistency durante la sessione
    const sessionKey = 'pp-landing-variant';
    let variant = sessionStorage.getItem(sessionKey);
    
    if (!variant) {
      const random = Math.random() * 100;
      variant = random < percentage ? 'new' : 'old';
      sessionStorage.setItem(sessionKey, variant);
    }
    
    return variant === 'new';
  }
  
  return false;
}

// Export come oggetto per compatibilità con il prompt
export function useFeatureFlag() {
  return {
    useNewLanding
  };
}

// Export diretto per retrocompatibilità
export { useNewLanding };

