import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingStore } from '@/stores/onboardingStore';

type OnboardingStep = 1 | 2 | 3 | 4;

const STEP_NAMES: Record<OnboardingStep, string> = {
  1: 'obiettivo',
  2: 'esperienza',
  3: 'preferenze',
  4: 'personalizzazione',
};

interface StepConfig {
  shouldAutoAdvance: boolean;
  collectPayload: () => Record<string, any>;
  save: (payload: any) => Promise<void>;
}

export function useOnboardingNavigation() {
  const { data, nextStep } = useOnboardingStore();
  const stepStartTimes = useRef<Record<number, number>>({});

  const stepConfig: Record<OnboardingStep, StepConfig> = {
    1: {
      shouldAutoAdvance: true,
      collectPayload: () => ({
        obiettivo: data.obiettivo,
      }),
      save: async (payload) => {
        await saveStep1ToDatabase(payload);
      },
    },
    2: {
      shouldAutoAdvance: false,
      collectPayload: () => ({
        livelloEsperienza: data.livelloEsperienza,
        giorniSettimana: data.giorniSettimana,
      }),
      save: async (payload) => {
        await saveStep2ToDatabase(payload);
      },
    },
    3: {
      shouldAutoAdvance: false,
      collectPayload: () => ({
        luoghiAllenamento: data.luoghiAllenamento,
        tempoSessione: data.tempoSessione,
      }),
      save: async (payload) => {
        await saveStep3ToDatabase(payload);
      },
    },
    4: {
      shouldAutoAdvance: false,
      collectPayload: () => ({
        nome: data.nome,
        eta: data.eta,
        peso: data.peso,
        altezza: data.altezza,
        consigliNutrizionali: data.consigliNutrizionali,
      }),
      save: async (payload) => {
        await saveStep4ToDatabase(payload);
      },
    },
  };

  const saveAnalyticsEvent = async (
    step: OnboardingStep,
    eventType: 'started' | 'completed' | 'abandoned',
    startTime?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log(`Analytics: utente non autenticato, skip evento ${eventType} step ${step}`);
        return;
      }

      const now = new Date();
      const timeSpentSeconds = startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : null;

      const metadata = {
        device: typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
        screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      };

      console.log(`📊 Analytics: ${eventType} step ${step}`, {
        step_name: STEP_NAMES[step],
        time_spent: timeSpentSeconds,
        metadata,
      });

      const analyticsData: Record<string, any> = {
        user_id: user.id,
        step_number: step,
        step_name: STEP_NAMES[step],
        event_type: eventType,
        metadata,
      };

      if (eventType === 'started') {
        analyticsData.started_at = now.toISOString();
      } else if (eventType === 'completed') {
        analyticsData.started_at = startTime
          ? new Date(startTime).toISOString()
          : now.toISOString();
        analyticsData.completed_at = now.toISOString();
        if (timeSpentSeconds !== null) {
          analyticsData.time_spent_seconds = timeSpentSeconds;
        }
      }

      const { error } = await supabase
        .from('onboarding_analytics')
        .insert(analyticsData);

      if (error) {
        console.error(`❌ Errore salvataggio analytics ${eventType} step ${step}:`, error);
      } else {
        console.log(`✅ Analytics ${eventType} step ${step} salvato`);
      }
    } catch (err) {
      console.error(`❌ Errore imprevisto analytics step ${step}:`, err);
    }
  };

  const saveAndContinue = async (
    step: OnboardingStep,
    overridePayload?: Record<string, any>
  ) => {
    const config = stepConfig[step];
    if (!config) {
      console.error(`[Onboarding] Step ${step} non configurato`);
      return;
    }

    console.log(`=== STEP ${step}: Salvataggio ===`);

    const startTime = Date.now();

    try {
      const storePayload = config.collectPayload();
      const payload = overridePayload || storePayload;
      console.log('Payload:', payload);

      await config.save(payload);
      console.log(`✅ Step ${step} salvato`);
      const stepStartTime = stepStartTimes.current[step];

      if (stepStartTime) {
        const durationMs = Date.now() - stepStartTime;
        console.log(`⏱️ Step ${step} completato in ${Math.floor(durationMs / 1000)} secondi`);
        await saveAnalyticsEvent(step, 'completed', stepStartTime);
      } else {
        console.warn(`⚠️ Step ${step}: timestamp inizio non trovato`);
        await saveAnalyticsEvent(step, 'completed');
      }

      if (config.shouldAutoAdvance) {
        console.log('Auto-advance attivo, passo allo step successivo');
        nextStep();
      }
    } catch (error) {
      console.error(`❌ Errore salvataggio Step ${step}:`, error);
    }
  };

  return {
    saveAndContinue,
    stepConfig,
    trackStepStarted: (step: OnboardingStep) => {
      if (!stepStartTimes.current[step]) {
        stepStartTimes.current[step] = Date.now();
        console.log(`🕐 Timestamp step ${step} salvato:`, new Date().toLocaleTimeString());
        saveAnalyticsEvent(step, 'started');
      } else {
        console.log(`⚠️ Timestamp step ${step} già esistente, non sovrascrivo`);
      }
    },
  };
}

async function saveStep1ToDatabase(payload: { obiettivo: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 1: utente non autenticato, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Obiettivo:', payload.obiettivo);

  const { data, error } = await supabase
    .from('onboarding_obiettivo_principale')
    .upsert(
      {
        user_id: user.id,
        obiettivo: payload.obiettivo,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;

  console.log('Risultato salvataggio:', data);
}

async function saveStep2ToDatabase(payload: { livelloEsperienza: string; giorniSettimana: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 2: utente non autenticato, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Livello esperienza:', payload.livelloEsperienza);
  console.log('Giorni settimana:', payload.giorniSettimana);

  const { data, error } = await supabase
    .from('onboarding_esperienza')
    .upsert(
      {
        user_id: user.id,
        livello_esperienza: payload.livelloEsperienza,
        giorni_settimana: payload.giorniSettimana,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;

  console.log('Risultato salvataggio:', data);
}

async function saveStep3ToDatabase(payload: { luoghiAllenamento: string[]; tempoSessione: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 3: utente non autenticato, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Luoghi allenamento:', payload.luoghiAllenamento);
  console.log('Tempo sessione:', payload.tempoSessione);

  const { data, error } = await supabase
    .from('onboarding_preferenze')
    .upsert(
      {
        user_id: user.id,
        luoghi_allenamento: payload.luoghiAllenamento,
        tempo_sessione: payload.tempoSessione,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;

  console.log('Risultato salvataggio:', data);
}

async function saveStep4ToDatabase(payload: {
  nome: string;
  eta: number;
  peso: number;
  altezza: number;
  consigliNutrizionali: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 4: utente non autenticato, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Nome:', payload.nome);
  console.log('Età:', payload.eta);
  console.log('Peso:', payload.peso);
  console.log('Altezza:', payload.altezza);
  console.log('Consigli nutrizionali:', payload.consigliNutrizionali);

  const { data, error } = await supabase
    .from('onboarding_personalizzazione')
    .upsert(
      {
        user_id: user.id,
        nome: payload.nome,
        eta: payload.eta,
        peso: payload.peso,
        altezza: payload.altezza,
        consigli_nutrizionali: payload.consigliNutrizionali,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;

  console.log('Risultato salvataggio:', data);
}

