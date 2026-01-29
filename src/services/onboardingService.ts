import { supabase } from '@/integrations/supabase/client';

/**
 * Interfaccia per risposte onboarding
 */
export interface OnboardingResponse {
  user_id: string;
  obiettivo?: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare' | null;
  livello_esperienza?: 'principiante' | 'intermedio' | 'avanzato' | null;
  giorni_settimana?: number | null;
  luoghi_allenamento?: string[] | null;
  tempo_sessione?: 15 | 30 | 45 | 60 | null;
  possiede_attrezzatura?: boolean | null;
  attrezzi?: string[] | null;
  altri_attrezzi?: string | null;
  nome?: string | null;
  eta?: number | null;
  peso?: number | null;
  altezza?: number | null;
  consigli_nutrizionali?: boolean | null;
  // Nuovi campi limitazioni fisiche e salute
  ha_limitazioni?: boolean | null;
  limitazioni_fisiche?: string | null;
  zone_evitare?: string[] | null;
  condizioni_mediche?: string | null;
  allergie_alimentari?: string[] | null;
  limitazioni_compilato_at?: string | null;
  onboarding_completed_at?: string | null;
  last_modified_at?: string | null;
  created_at?: string | null;
}

export interface OnboardingInsert {
  user_id: string;
  obiettivo?: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare' | null;
  livello_esperienza?: 'principiante' | 'intermedio' | 'avanzato' | null;
  giorni_settimana?: number | null;
  luoghi_allenamento?: string[] | null;
  tempo_sessione?: 15 | 30 | 45 | 60 | null;
  possiede_attrezzatura?: boolean | null;
  attrezzi?: string[] | null;
  altri_attrezzi?: string | null;
  nome?: string | null;
  eta?: number | null;
  peso?: number | null;
  altezza?: number | null;
  consigli_nutrizionali?: boolean | null;
  // Nuovi campi limitazioni fisiche e salute
  ha_limitazioni?: boolean | null;
  limitazioni_fisiche?: string | null;
  zone_evitare?: string[] | null;
  condizioni_mediche?: string | null;
  allergie_alimentari?: string[] | null;
  limitazioni_compilato_at?: string | null;
  onboarding_completed_at?: string | null;
}

/**
 * Service per gestione risposte onboarding
 */
export const onboardingService = {
  /**
   * Carica risposte onboarding per un utente
   */
  async loadOnboardingData(userId: string): Promise<OnboardingResponse | null> {
    try {
      console.log('🔍 loadOnboardingData: Querying for user:', userId);
      const { data, error } = await supabase
        .from('user_onboarding_responses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        const err = error as { code?: string; details?: string; hint?: string };
        console.error('❌ Error loading onboarding data:', error);
        console.error('Error details:', {
          code: err?.code,
          message: error.message,
          details: err?.details,
          hint: err?.hint
        });
        return null;
      }

      console.log('✅ loadOnboardingData: Data loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in loadOnboardingData:', error);
      return null;
    }
  },

  /**
   * Salva/aggiorna risposte onboarding
   */
  async saveOnboardingData(
    userId: string,
    data: Omit<OnboardingInsert, 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_onboarding_responses')
        .upsert(
          {
            user_id: userId,
            ...data,
            last_modified_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('Error saving onboarding data:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in saveOnboardingData:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Marca onboarding come completato
   */
  async markOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_onboarding_responses')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          last_modified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking onboarding complete:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markOnboardingComplete:', error);
      return false;
    }
  },

  /**
   * Verifica se onboarding è completo
   */
  async checkOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding_responses')
        .select('onboarding_completed_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return !!data.onboarding_completed_at;
    } catch (error) {
      console.error('Error in checkOnboardingComplete:', error);
      return false;
    }
  },

  /**
   * Ottieni riepilogo preferenze per UI
   */
  async getOnboardingSummary(userId: string): Promise<{
    obiettivo?: string;
    livello?: string;
    frequenza?: number;
    luoghi?: string[];
    durata?: number;
    attrezzatura?: boolean;
    attrezzi?: string[];
    altriAttrezzi?: string;
  } | null> {
    console.log('🔍 onboardingService.getOnboardingSummary called for:', userId);
    
    try {
      console.log('📡 Calling loadOnboardingData...');
      const data = await this.loadOnboardingData(userId);
      console.log('📦 loadOnboardingData returned:', data);

      if (!data) {
        console.log('❌ No data found for user');
        return null;
      }

      const summary = {
        obiettivo: data.obiettivo || undefined,
        livello: data.livello_esperienza || undefined,
        frequenza: data.giorni_settimana || undefined,
        luoghi: data.luoghi_allenamento || undefined,
        durata: data.tempo_sessione || undefined,
        attrezzatura: data.possiede_attrezzatura ?? undefined,
        attrezzi: data.attrezzi || undefined,
        altriAttrezzi: data.altri_attrezzi || undefined,
      };

      console.log('✅ Summary built:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Error in getOnboardingSummary:', error);
      return null;
    }
  },

  /**
   * Elimina risposte onboarding (per testing)
   */
  async deleteOnboardingData(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_onboarding_responses')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting onboarding data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteOnboardingData:', error);
      return false;
    }
  },

  /**
   * Calcola hash risposte per tracking modifiche
   */
  buildResponsesHash(data: OnboardingResponse): string {
    const hashData = {
      obiettivo: data.obiettivo,
      livello: data.livello_esperienza,
      giorni: data.giorni_settimana,
      luoghi: data.luoghi_allenamento?.sort(),
      tempo: data.tempo_sessione,
    };
    return JSON.stringify(hashData);
  },
};

