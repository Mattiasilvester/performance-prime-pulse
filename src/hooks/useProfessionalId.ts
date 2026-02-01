// src/hooks/useProfessionalId.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { professionalAuthService } from '@/services/professionalAuthService';

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

        if (data?.id) {
          setProfessionalId(data.id);
          return;
        }

        // Profilo non trovato: se l'utente è un professionista (metadata), crea il profilo da metadata
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        if (meta?.role === 'professional') {
          const created = await professionalAuthService.ensureProfessionalFromMetadata(user);
          if (created) {
            setProfessionalId(created.id);
            return;
          }
          // Retry dopo breve attesa (trigger o commit in ritardo)
          await new Promise((r) => setTimeout(r, 1500));
          const { data: retryData } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          setProfessionalId(retryData?.id ?? null);
          return;
        }

        setProfessionalId(null);
      } catch (err: unknown) {
        console.error('Errore caricamento professional_id:', err);
        setProfessionalId(null);
      }
    };

    loadProfessionalId();
  }, [user]);

  return professionalId;
}
