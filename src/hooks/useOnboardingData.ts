import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService, type OnboardingResponse } from '@/services/onboardingService';

/**
 * Hook per gestire dati onboarding con caricamento e salvataggio
 */
export const useOnboardingData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica dati all'avvio
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await onboardingService.loadOnboardingData(user.id);
      setData(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (
    newData: Partial<Omit<OnboardingResponse, 'user_id' | 'created_at' | 'last_modified_at'>>
  ) => {
    if (!user?.id) {
      setError('User not authenticated');
      return { success: false };
    }

    setError(null);

    const result = await onboardingService.saveOnboardingData(user.id, newData as any);

    if (result.success) {
      await loadData(); // Ricarica dati aggiornati
    } else {
      setError(result.error || 'Error saving data');
    }

    return result;
  };

  const markComplete = async () => {
    if (!user?.id) return false;

    const success = await onboardingService.markOnboardingComplete(user.id);
    if (success) {
      await loadData();
    }
    return success;
  };

  const isComplete = data?.onboarding_completed_at != null;

  return {
    data,
    loading,
    error,
    isComplete,
    loadData,
    saveData,
    markComplete,
  };
};

/**
 * Hook semplificato per ottenere solo riepilogo preferenze
 */
export const useOnboardingSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    obiettivo?: string;
    livello?: string;
    frequenza?: number;
    luoghi?: string[];
    durata?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Memoizza user.id per evitare re-render
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    console.log('📊 useEffect triggered, userId:', userId);
    
    if (!userId) {
      console.log('❌ No user ID, stopping');
      setLoading(false);
      return;
    }

    console.log('✅ User ID found, calling loadSummary');

    // ✅ FIX: Definisci loadSummary DENTRO useEffect
    const loadSummary = async () => {
      console.log('🔄 loadSummary: Starting for user:', userId);
      setLoading(true);
      
      try {
        console.log('📡 Calling onboardingService.getOnboardingSummary...');
        const result = await onboardingService.getOnboardingSummary(userId);
        console.log('✅ Summary loaded:', result);
        setSummary(result);
      } catch (error) {
        console.error('❌ Error loading summary:', error);
      } finally {
        console.log('🏁 loadSummary: Done, setting loading false');
        setLoading(false);
      }
    };

    // Chiama subito
    loadSummary();
  }, [userId]); // ← FIX: usa userId memoizzato invece di user?.id

  return {
    summary,
    loading,
    reload: () => {
      // Funzione reload separata se necessaria
      if (userId) {
        setLoading(true);
        onboardingService.getOnboardingSummary(userId)
          .then(setSummary)
          .catch((error) => {
            console.error('❌ Error reloading summary:', error);
          })
          .finally(() => {
            console.log('🏁 Reload: Done, setting loading false');
            setLoading(false);
          });
      }
    },
  };
};

