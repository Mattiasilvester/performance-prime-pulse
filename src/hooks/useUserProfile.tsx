import { useState, useEffect, useCallback } from 'react';
import { fetchUserProfile, type UserProfile } from '@/services/userService';
import { useAuth } from './useAuth';

// Cache globale per evitare chiamate multiple
let profileCache: { profile: UserProfile | null; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 secondi

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    // Se non c'è utente, non fare nulla
    if (!user) {
      setProfile(null);
      setError(null);
      return;
    }

    // Controlla cache
    if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
      setProfile(profileCache.profile);
      return;
    }

    // Evita chiamate multiple
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const profileData = await fetchUserProfile();
      
      // Aggiorna cache
      profileCache = {
        profile: profileData,
        timestamp: Date.now()
      };
      
      setProfile(profileData);
    } catch (err) {
      setError('Errore nel caricamento del profilo');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // Carica profilo solo quando l'utente cambia
  useEffect(() => {
    loadProfile();
  }, [user?.id]); // Solo quando l'ID utente cambia

  // Invalida cache quando l'utente si disconnette
  useEffect(() => {
    if (!user) {
      profileCache = null;
      setProfile(null);
    }
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetch: loadProfile
  };
}






