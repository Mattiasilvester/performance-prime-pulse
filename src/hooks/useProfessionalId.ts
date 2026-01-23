// src/hooks/useProfessionalId.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useProfessionalId(): string | null {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfessionalId = async () => {
      if (!user?.id) {
        setProfessionalId(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Errore caricamento professional_id:', error);
          setProfessionalId(null);
          return;
        }

        setProfessionalId(data?.id || null);
      } catch (err: any) {
        console.error('Errore caricamento professional_id:', err);
        setProfessionalId(null);
      }
    };

    loadProfessionalId();
  }, [user]);

  return professionalId;
}
