// src/hooks/useProfessionalId.ts

import { useState, useEffect } from 'react';
import { supabase, useAuth } from '@pp/shared';
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

        // Profilo non trovato: se l'utente è un professionista (metadata), crea il profilo da metadata o attendi trigger
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        if (meta?.role === 'professional') {
          const created = await professionalAuthService.ensureProfessionalFromMetadata(user);
          if (created) {
            setProfessionalId(created.id);
            return;
          }
          // Retry con delay (trigger signup può creare il record in ritardo)
          const delays = [1500, 3000];
          for (const delay of delays) {
            await new Promise((r) => setTimeout(r, delay));
            const { data: retryData } = await supabase
              .from('professionals')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            if (retryData?.id) {
              setProfessionalId(retryData.id);
              return;
            }
          }
          setProfessionalId(null);
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
