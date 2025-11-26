import { useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { OnboardingData } from '@/stores/onboardingStore';
import { onboardingService } from '@/services/onboardingService';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const STEP_NAMES: Record<OnboardingStep, string> = {
  1: 'obiettivo',
  2: 'esperienza',
  3: 'preferenze',
  4: 'personalizzazione',
  5: 'limitazioni_fisiche',
};

type StepPayloads = {
  1: Pick<OnboardingData, 'obiettivo'>;
  2: Pick<OnboardingData, 'livelloEsperienza' | 'giorniSettimana'>;
  3: Pick<OnboardingData, 'luoghiAllenamento' | 'tempoSessione' | 'possiedeAttrezzatura' | 'attrezzi' | 'altriAttrezzi'>;
  4: Pick<OnboardingData, 'nome' | 'eta' | 'peso' | 'altezza' | 'consigliNutrizionali'>;
  5: Pick<OnboardingData, 'haLimitazioni' | 'limitazioniFisiche' | 'zoneEvitare' | 'condizioniMediche'>;
};

type StepConfigMap = {
  [S in OnboardingStep]: {
    shouldAutoAdvance: boolean;
    collectPayload: () => StepPayloads[S];
    save: (payload: StepPayloads[S]) => Promise<void>;
  };
};

type AnalyticsMetadata = {
  device: 'mobile' | 'desktop';
  browser: string;
  screen_width: number | null;
  screen_height: number | null;
  platform: string;
  language: string;
};

type AnalyticsPayload = {
  user_id: string;
  step_number: OnboardingStep;
  step_name: string;
  event_type: 'started' | 'completed' | 'abandoned';
  metadata: AnalyticsMetadata;
  started_at?: string;
  completed_at?: string;
  time_spent_seconds?: number;
};

export function useOnboardingNavigation(isEditMode: boolean = false) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, nextStep, previousStep, currentStep } = useOnboardingStore();
  const stepStartTimes = useRef<Record<number, number>>({});

  const stepConfig: StepConfigMap = {
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
        possiedeAttrezzatura: data.possiedeAttrezzatura,
        attrezzi: data.attrezzi,
        altriAttrezzi: data.altriAttrezzi,
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
    5: {
      shouldAutoAdvance: false,
      collectPayload: () => ({
        haLimitazioni: data.haLimitazioni,
        limitazioniFisiche: data.limitazioniFisiche,
        zoneEvitare: data.zoneEvitare,
        condizioniMediche: data.condizioniMediche,
      }),
      save: async (payload) => {
        await saveStep5ToDatabase(payload);
      },
    },
  };

  const saveAnalyticsEvent = useCallback(async (
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

      const metadata: AnalyticsMetadata = {
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

      const analyticsData: AnalyticsPayload = {
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
  }, []);

  const saveAndContinue = async <S extends OnboardingStep>(
    step: S,
    overridePayload?: StepPayloads[S]
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
      const payload: StepPayloads[S] = overridePayload ?? storePayload;
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

      // ✅ SOLUZIONE DEFINITIVA: Rimossa logica Step 4 edit mode da qui
      // La navigazione Step 4 → Step 5 è gestita da handleNext()

      if (config.shouldAutoAdvance) {
        console.log('Auto-advance attivo, passo allo step successivo');
        const nextStepNum = currentStep + 1;
        nextStep();
        
        // ✅ FIX: In edit mode, aggiorna anche l'URL
        if (isEditMode) {
          console.log('📤 Edit mode: auto-advance to step', nextStepNum, 'and updating URL');
          setSearchParams({ mode: 'edit', step: nextStepNum.toString() }, { replace: true });
        }
      }
    } catch (error) {
      console.error(`❌ Errore salvataggio Step ${step}:`, error);
    }
  };

  const trackStepStarted = useCallback((step: OnboardingStep) => {
    if (!stepStartTimes.current[step]) {
      stepStartTimes.current[step] = Date.now();
      console.log(`🕐 Timestamp step ${step} salvato:`, new Date().toLocaleTimeString());
      saveAnalyticsEvent(step, 'started');
    } else {
      console.log(`⚠️ Timestamp step ${step} già esistente, non sovrascrivo`);
    }
  }, [saveAnalyticsEvent]);

  // ✅ FIX: Gestisce TUTTI gli step incluso Step 4→5, 5→6 (completion)
  const handleNext = useCallback(() => {
    // Gestisce Step 0→1, 1→2, 2→3, 3→4, 4→5, 5→6
    if (currentStep >= 0 && currentStep < 6) {
      const nextStepNum = currentStep + 1;
      
      console.log(`📤 Advancing from step ${currentStep} to step ${nextStepNum}`);
      
      if (isEditMode) {
        console.log('🎨 Edit mode: updating both store and URL');
        nextStep();
        setSearchParams({ mode: 'edit', step: nextStepNum.toString() }, { replace: true });
      } else {
        // Comportamento normale
        console.log('🎨 Normal mode: updating store only');
        nextStep();
      }
    } else {
      console.log(`⚠️ Cannot advance: currentStep is ${currentStep} (must be 0-5)`);
    }
  }, [currentStep, isEditMode, nextStep, setSearchParams]);

  // ✅ FIX: Funzione wrapper per tornare allo step precedente aggiornando anche l'URL
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      const prevStepNum = currentStep - 1;
      
      // ✅ FIX: In edit mode, aggiorna anche l'URL
      if (isEditMode) {
        console.log('📤 Edit mode: going back to step', prevStepNum, 'and updating URL');
        previousStep();
        setSearchParams({ mode: 'edit', step: prevStepNum.toString() }, { replace: true });
      } else {
        // Comportamento normale
        previousStep();
      }
    }
  }, [currentStep, isEditMode, previousStep, setSearchParams]);

  return {
    saveAndContinue,
    stepConfig,
    trackStepStarted,
    isEditMode,
    handleNext,
    handleBack,
  };
}

async function saveStep1ToDatabase(payload: StepPayloads[1]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 1: utente non autenticato, skip salvataggio');
    return;
  }

  if (!payload.obiettivo) {
    console.warn('Step 1: obiettivo mancante, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Obiettivo:', payload.obiettivo);

  // ✅ SALVATAGGIO VECCHIA TABELLA (mantieni esistente)
  const { error } = await supabase
    .from('onboarding_obiettivo_principale')
    .upsert(
      {
        user_id: user.id,
        obiettivo: payload.obiettivo,
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
  console.log('Step 1: salvato in tabella vecchia');

  // ✅ NUOVO: SALVATAGGIO TABELLA UNIFICATA
  try {
    await onboardingService.saveOnboardingData(user.id, {
      obiettivo: payload.obiettivo,
    });
    console.log('Step 1: salvato in tabella unificata');
  } catch (error) {
    console.error('Step 1: errore salvataggio tabella unificata:', error);
    // Non bloccare il flusso se fallisce
  }
}

async function saveStep2ToDatabase(payload: StepPayloads[2]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 2: utente non autenticato, skip salvataggio');
    return;
  }

  if (!payload.livelloEsperienza || typeof payload.giorniSettimana !== 'number') {
    console.warn('Step 2: dati incompleti, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Livello esperienza:', payload.livelloEsperienza);
  console.log('Giorni settimana:', payload.giorniSettimana);

  // ✅ SALVATAGGIO VECCHIA TABELLA (mantieni esistente)
  const { error } = await supabase
    .from('onboarding_esperienza')
    .upsert(
      {
        user_id: user.id,
        livello_esperienza: payload.livelloEsperienza,
        giorni_settimana: payload.giorniSettimana,
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
  console.log('Step 2: salvato in tabella vecchia');

  // ✅ NUOVO: SALVATAGGIO TABELLA UNIFICATA
  try {
    await onboardingService.saveOnboardingData(user.id, {
      livello_esperienza: payload.livelloEsperienza,
      giorni_settimana: payload.giorniSettimana,
    });
    console.log('Step 2: salvato in tabella unificata');
  } catch (error) {
    console.error('Step 2: errore salvataggio tabella unificata:', error);
    // Non bloccare il flusso se fallisce
  }
}

async function saveStep3ToDatabase(payload: StepPayloads[3]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 3: utente non autenticato, skip salvataggio');
    return;
  }

  if (!payload.luoghiAllenamento || typeof payload.tempoSessione !== 'number') {
    console.warn('Step 3: dati incompleti, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Luoghi allenamento:', payload.luoghiAllenamento);
  console.log('Tempo sessione:', payload.tempoSessione);
  console.log('Possiede attrezzatura:', payload.possiedeAttrezzatura);
  console.log('Attrezzi:', payload.attrezzi);
  console.log('Altri attrezzi:', payload.altriAttrezzi);

  // ✅ SALVATAGGIO VECCHIA TABELLA (mantieni esistente)
  const { error } = await supabase
    .from('onboarding_preferenze')
    .upsert(
      {
        user_id: user.id,
        luoghi_allenamento: payload.luoghiAllenamento,
        tempo_sessione: payload.tempoSessione,
        possiede_attrezzatura: payload.possiedeAttrezzatura ?? null,
        attrezzi: payload.attrezzi ?? null,
        altri_attrezzi: payload.altriAttrezzi ?? null,
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
  console.log('Step 3: salvato in tabella vecchia');

  // ✅ NUOVO: SALVATAGGIO TABELLA UNIFICATA
  try {
    await onboardingService.saveOnboardingData(user.id, {
      luoghi_allenamento: payload.luoghiAllenamento,
      tempo_sessione: payload.tempoSessione,
      possiede_attrezzatura: payload.possiedeAttrezzatura ?? null,
      attrezzi: payload.attrezzi ?? null,
      altri_attrezzi: payload.altriAttrezzi ?? null,
    });
    console.log('Step 3: salvato in tabella unificata');
  } catch (error) {
    console.error('Step 3: errore salvataggio tabella unificata:', error);
    // Non bloccare il flusso se fallisce
  }
}

async function saveStep4ToDatabase(payload: StepPayloads[4]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 4: utente non autenticato, skip salvataggio');
    return;
  }

  if (
    !payload.nome ||
    typeof payload.eta !== 'number' ||
    typeof payload.peso !== 'number' ||
    typeof payload.altezza !== 'number' ||
    typeof payload.consigliNutrizionali !== 'boolean'
  ) {
    console.warn('Step 4: dati incompleti, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Nome:', payload.nome);
  console.log('Età:', payload.eta);
  console.log('Peso:', payload.peso);
  console.log('Altezza:', payload.altezza);
  console.log('Consigli nutrizionali:', payload.consigliNutrizionali);

  // ✅ SALVATAGGIO VECCHIA TABELLA (mantieni esistente)
  const { error } = await supabase
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
    );

  if (error) throw error;
  console.log('Step 4: salvato in tabella vecchia');

  // ✅ NUOVO: SALVATAGGIO TABELLA UNIFICATA + MARK AS COMPLETE
  try {
    await onboardingService.saveOnboardingData(user.id, {
      nome: payload.nome,
      eta: payload.eta,
      peso: payload.peso,
      altezza: payload.altezza,
      consigli_nutrizionali: payload.consigliNutrizionali,
    });

    // ✅ NOTA: NON marcare come completo qui - Step 5 lo farà

    console.log('Step 4: salvato in tabella unificata');
  } catch (error) {
    console.error('Step 4: errore salvataggio tabella unificata:', error);
    // Non bloccare il flusso se fallisce
  }
}

async function saveStep5ToDatabase(payload: StepPayloads[5]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Step 5: utente non autenticato, skip salvataggio');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Ha limitazioni:', payload.haLimitazioni);
  console.log('Limitazioni fisiche:', payload.limitazioniFisiche);
  console.log('Zone da evitare:', payload.zoneEvitare);
  console.log('Condizioni mediche:', payload.condizioniMediche);

  // ✅ SALVATAGGIO TABELLA UNIFICATA + MARK AS COMPLETE
  try {
    await onboardingService.saveOnboardingData(user.id, {
      ha_limitazioni: payload.haLimitazioni ?? null,
      limitazioni_fisiche: payload.limitazioniFisiche || null,
      zone_evitare: payload.zoneEvitare || [],
      condizioni_mediche: payload.condizioniMediche || null,
      limitazioni_compilato_at: new Date().toISOString(),
    });

    // ✅ IMPORTANTE: Marca onboarding come completato (Step 5 è l'ultimo)
    await onboardingService.markOnboardingComplete(user.id);

    console.log('Step 5: salvato in tabella unificata e marcato come completo');
  } catch (error) {
    console.error('Step 5: errore salvataggio tabella unificata:', error);
    // Non bloccare il flusso se fallisce
  }
}

