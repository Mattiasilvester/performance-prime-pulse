import { supabase } from '@/integrations/supabase/client';
import { onboardingService, type OnboardingResponse } from './onboardingService';
import { fetchUserProfile } from './userService';

/**
 * Contesto utente completo per PrimeBot
 */
export interface UserContext {
  // Dati personali
  nome: string;
  eta?: number | null;
  peso?: number | null;
  altezza?: number | null;
  
  // Obiettivi e livello
  obiettivi: string[];
  livello_fitness: 'beginner' | 'intermediate' | 'advanced' | null;
  livello_fitness_it: string; // Versione italiana per display
  
  // Preferenze allenamento
  attrezzatura_disponibile: string[];
  tempo_allenamento: number | null; // minuti
  
  // Preferenze luogo
  luoghi_allenamento: string[];
  
  // Altro
  giorni_settimana?: number | null;
  consigli_nutrizionali?: boolean | null;
  
  // Flag onboarding completato
  onboarding_completed: boolean;
}

/**
 * Mappa livello esperienza italiano → inglese per primebot_preferences
 */
const mapFitnessLevel = (
  livello: 'principiante' | 'intermedio' | 'avanzato' | null | undefined
): 'beginner' | 'intermediate' | 'advanced' | null => {
  if (!livello) return null;
  
  const mapping: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
    'principiante': 'beginner',
    'intermedio': 'intermediate',
    'avanzato': 'advanced',
  };
  
  return mapping[livello] || null;
};

/**
 * Mappa obiettivo italiano → inglese per primebot_preferences
 */
const mapGoalToEnglish = (
  obiettivo: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare' | null | undefined
): string | null => {
  if (!obiettivo) return null;
  
  const mapping: Record<string, string> = {
    'massa': 'muscle_gain',
    'dimagrire': 'weight_loss',
    'resistenza': 'endurance',
    'tonificare': 'toning',
  };
  
  return mapping[obiettivo] || null;
};

/**
 * Mappa obiettivo italiano → label italiano per display
 */
const mapGoalToLabel = (
  obiettivo: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare' | null | undefined
): string => {
  if (!obiettivo) return 'fitness generale';
  
  const mapping: Record<string, string> = {
    'massa': 'aumentare massa muscolare',
    'dimagrire': 'perdere peso',
    'resistenza': 'migliorare resistenza',
    'tonificare': 'tonificare il corpo',
  };
  
  return mapping[obiettivo] || 'fitness generale';
};

/**
 * Costruisce lista attrezzatura disponibile
 */
const buildEquipmentList = (data: OnboardingResponse): string[] => {
  const equipment: string[] = [];
  
  if (data.possiede_attrezzatura) {
    if (data.attrezzi && data.attrezzi.length > 0) {
      equipment.push(...data.attrezzi);
    }
    if (data.altri_attrezzi) {
      equipment.push(data.altri_attrezzi);
    }
  }
  
  // Se non ha attrezzatura, aggiungi "corpo libero"
  if (!data.possiede_attrezzatura || equipment.length === 0) {
    equipment.push('corpo libero');
  }
  
  return equipment;
};

/**
 * Mappa luoghi allenamento a tipi workout preferiti
 */
const mapLocationsToWorkoutTypes = (
  luoghi: string[] | null | undefined
): string[] => {
  if (!luoghi || luoghi.length === 0) {
    return ['cardio', 'strength'];
  }
  
  const workoutTypes: string[] = [];
  
  if (luoghi.includes('casa')) {
    workoutTypes.push('bodyweight', 'hiit');
  }
  if (luoghi.includes('palestra')) {
    workoutTypes.push('strength', 'cardio');
  }
  if (luoghi.includes('outdoor')) {
    workoutTypes.push('cardio', 'outdoor');
  }
  
  return workoutTypes.length > 0 ? workoutTypes : ['cardio', 'strength'];
};

/**
 * Recupera il contesto completo dell'utente per PrimeBot
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  try {
    console.log('🔍 getUserContext: Recupero contesto utente per:', userId.substring(0, 8) + '...');
    
    // 1. Recupera dati onboarding
    const onboardingData = await onboardingService.loadOnboardingData(userId);
    
    // 2. Recupera profilo utente per nome
    const userProfile = await fetchUserProfile();
    const nome = onboardingData?.nome || userProfile?.name || 'Utente';
    
    // 3. Costruisci contesto con dati disponibili o default
    const context: UserContext = {
      nome,
      eta: onboardingData?.eta || null,
      peso: onboardingData?.peso || null,
      altezza: onboardingData?.altezza || null,
      
      obiettivi: onboardingData?.obiettivo
        ? [mapGoalToLabel(onboardingData.obiettivo)]
        : ['fitness generale'],
      
      livello_fitness: mapFitnessLevel(onboardingData?.livello_esperienza),
      livello_fitness_it: onboardingData?.livello_esperienza || 'principiante',
      
      attrezzatura_disponibile: buildEquipmentList(onboardingData || {} as OnboardingResponse),
      tempo_allenamento: onboardingData?.tempo_sessione || null,
      
      luoghi_allenamento: onboardingData?.luoghi_allenamento || [],
      giorni_settimana: onboardingData?.giorni_settimana || null,
      consigli_nutrizionali: onboardingData?.consigli_nutrizionali || false,
      
      onboarding_completed: !!onboardingData?.onboarding_completed_at,
    };
    
    console.log('✅ getUserContext: Contesto recuperato:', {
      nome: context.nome,
      obiettivi: context.obiettivi,
      livello: context.livello_fitness_it,
      attrezzatura: context.attrezzatura_disponibile,
      tempo: context.tempo_allenamento,
      onboarding_completed: context.onboarding_completed,
    });
    
    return context;
  } catch (error) {
    console.error('❌ Errore recupero contesto utente:', error);
    
    // Ritorna contesto di default se recupero fallisce
    return {
      nome: 'Utente',
      obiettivi: ['fitness generale'],
      livello_fitness: null,
      livello_fitness_it: 'principiante',
      attrezzatura_disponibile: ['corpo libero'],
      tempo_allenamento: null,
      luoghi_allenamento: [],
      onboarding_completed: false,
    };
  }
}

/**
 * Aggiorna primebot_preferences con i dati dell'utente
 */
export async function updatePrimeBotPreferences(
  userId: string,
  context: UserContext
): Promise<void> {
  try {
    console.log('💾 updatePrimeBotPreferences: Aggiornamento preferenze per:', userId.substring(0, 8) + '...');
    
    // Prepara dati per primebot_preferences
    const preferencesData: {
      fitness_level?: string | null;
      goals?: string[];
      preferred_workout_types?: string[];
      onboarding_completed?: boolean;
      communication_style?: string;
    } = {
      onboarding_completed: context.onboarding_completed,
    };
    
    // Mappa livello fitness
    if (context.livello_fitness) {
      preferencesData.fitness_level = context.livello_fitness;
    }
    
    // Mappa obiettivi (converti da italiano a inglese)
    if (context.obiettivi.length > 0) {
      // Estrai obiettivo principale dal contesto onboarding
      const onboardingData = await onboardingService.loadOnboardingData(userId);
      const obiettivoEn = mapGoalToEnglish(onboardingData?.obiettivo || null);
      
      if (obiettivoEn) {
        preferencesData.goals = [obiettivoEn];
      } else {
        preferencesData.goals = ['general_fitness'];
      }
    }
    
    // Mappa luoghi a tipi workout preferiti
    preferencesData.preferred_workout_types = mapLocationsToWorkoutTypes(
      context.luoghi_allenamento
    );
    
    // Communication style basato su livello (default: motivational)
    preferencesData.communication_style = 'motivational';
    
    // Upsert su primebot_preferences
    const { error } = await supabase
      .from('primebot_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferencesData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );
    
    if (error) {
      console.warn('⚠️ Errore aggiornamento primebot_preferences:', error);
      // Non bloccare il flusso se il salvataggio fallisce
      return;
    }
    
    console.log('✅ updatePrimeBotPreferences: Preferenze aggiornate con successo');
  } catch (error) {
    console.error('❌ Errore completo aggiornamento preferenze:', error);
    // Non bloccare il flusso se il salvataggio fallisce
  }
}

/**
 * Formatta il contesto utente per il System Prompt di OpenAI
 */
export function formatUserContextForPrompt(context: UserContext): string {
  const parts: string[] = [];
  
  // Nome utente
  parts.push(`Stai parlando con **${context.nome}**.`);
  
  // Obiettivi
  if (context.obiettivi.length > 0) {
    parts.push(`I suoi obiettivi principali sono: ${context.obiettivi.join(', ')}.`);
  }
  
  // Livello fitness
  if (context.livello_fitness_it) {
    parts.push(`Il suo livello di fitness è: **${context.livello_fitness_it}**.`);
  }
  
  // Attrezzatura disponibile
  if (context.attrezzatura_disponibile.length > 0) {
    const attrezziStr = context.attrezzatura_disponibile.join(', ');
    parts.push(`Ha a disposizione: ${attrezziStr}.`);
  }
  
  // Tempo allenamento
  if (context.tempo_allenamento) {
    parts.push(`Tempo disponibile per allenarsi: **${context.tempo_allenamento} minuti** per sessione.`);
  }
  
  // Luoghi preferiti
  if (context.luoghi_allenamento.length > 0) {
    const luoghiStr = context.luoghi_allenamento.join(', ');
    parts.push(`Preferisce allenarsi: ${luoghiStr}.`);
  }
  
  // Frequenza settimanale
  if (context.giorni_settimana) {
    parts.push(`Frequenza allenamento: **${context.giorni_settimana} giorni a settimana**.`);
  }
  
  // Consigli nutrizionali
  if (context.consigli_nutrizionali) {
    parts.push(`È interessato a consigli nutrizionali.`);
  }
  
  return parts.join('\n');
}

/**
 * Verifica se l'utente ha compilato i dati salute/limitazioni
 */
export async function checkMissingHealthData(userId: string): Promise<{
  hasLimitazioni: boolean | null;
  needsToAsk: boolean;
}> {
  try {
    const onboardingData = await onboardingService.loadOnboardingData(userId);
    
    return {
      hasLimitazioni: onboardingData?.ha_limitazioni ?? null,
      needsToAsk: onboardingData?.ha_limitazioni === null || onboardingData?.ha_limitazioni === undefined,
    };
  } catch (error) {
    console.error('❌ Errore verifica dati salute:', error);
    return {
      hasLimitazioni: null,
      needsToAsk: true,
    };
  }
}

/**
 * Aggiorna limitazioni fisiche dell'utente
 */
export async function updateHealthLimitations(
  userId: string,
  hasLimitazioni: boolean,
  limitazioniFisiche?: string,
  zoneEvitare?: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_onboarding_responses')
      .upsert(
        {
          user_id: userId,
          ha_limitazioni: hasLimitazioni,
          limitazioni_fisiche: limitazioniFisiche || null,
          zone_evitare: zoneEvitare || [],
          limitazioni_compilato_at: new Date().toISOString(),
          last_modified_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('❌ Errore aggiornamento limitazioni:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Errore completo aggiornamento limitazioni:', error);
    return false;
  }
}

/**
 * Risultato del controllo intelligente limitazioni
 */
export interface SmartLimitationsResult {
  hasExistingLimitations: boolean;      // true se ha indicato limitazioni
  limitations: string | null;            // testo delle limitazioni
  zones: string[] | null;                // zone da evitare
  medicalConditions: string | null;      // condizioni mediche
  lastUpdated: Date | null;              // quando ha compilato
  daysSinceUpdate: number | null;        // giorni passati dall'ultimo update
  needsToAsk: boolean;                   // true se PrimeBot deve chiedere
  suggestedQuestion: string | null;      // domanda da fare (null = non chiedere)
}

/**
 * Controllo intelligente delle limitazioni fisiche dell'utente
 * Decide se PrimeBot deve chiedere o può usare i dati salvati
 */
export async function getSmartLimitationsCheck(userId: string): Promise<SmartLimitationsResult> {
  console.log('🔍 getSmartLimitationsCheck INIZIO per userId:', userId.substring(0, 8) + '...');
  try {
    console.log('📡 Chiamando loadOnboardingData...');
    const onboardingData = await onboardingService.loadOnboardingData(userId);
    console.log('✅ loadOnboardingData completato:', {
      exists: !!onboardingData,
      ha_limitazioni: onboardingData?.ha_limitazioni,
    });
    
    // IMPORTANTE: Usa ?? null per gestire anche undefined
    const hasLimitazioni = onboardingData?.ha_limitazioni ?? null;
    const limitazioniFisiche = onboardingData?.limitazioni_fisiche || null;
    const zoneEvitare = onboardingData?.zone_evitare || null;
    const condizioniMediche = onboardingData?.condizioni_mediche || null;
    const limitazioniCompilatoAt = onboardingData?.limitazioni_compilato_at 
      ? new Date(onboardingData.limitazioni_compilato_at)
      : null;
    
    console.log('🔍 getSmartLimitationsCheck - dati recuperati:', {
      userId: userId.substring(0, 8) + '...',
      hasLimitazioni,
      hasLimitazioniType: typeof hasLimitazioni,
      isNull: hasLimitazioni === null,
      isUndefined: hasLimitazioni === undefined,
      limitazioniFisiche: limitazioniFisiche?.substring(0, 30) || null,
      limitazioniCompilatoAt: limitazioniCompilatoAt?.toISOString() || null,
      onboardingDataExists: !!onboardingData,
    });
    
    // Calcola giorni dall'ultimo update
    let daysSinceUpdate: number | null = null;
    if (limitazioniCompilatoAt) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - limitazioniCompilatoAt.getTime());
      daysSinceUpdate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // DECISIONE (in ordine di priorità)
    let needsToAsk = false;
    let suggestedQuestion: string | null = null;
    
    // CASO A: ha_limitazioni === true E limitazioni_fisiche non vuoto
    if (hasLimitazioni === true && limitazioniFisiche && limitazioniFisiche.trim().length > 0) {
      if (daysSinceUpdate !== null && daysSinceUpdate > 30) {
        // Passati più di 30 giorni, chiedi aggiornamento
        suggestedQuestion = `L'ultima volta mi avevi parlato di ${limitazioniFisiche}. Come sta andando? Il problema persiste o è migliorato?`;
        needsToAsk = true;
      } else {
        // Meno di 30 giorni, usa i dati salvati
        suggestedQuestion = null;
        needsToAsk = false;
      }
    }
    // CASO B: ha_limitazioni === false
    else if (hasLimitazioni === false) {
      if (daysSinceUpdate !== null && daysSinceUpdate > 60) {
        // Passati più di 60 giorni, chiedi se qualcosa è cambiato
        suggestedQuestion = `È passato un po' di tempo! Hai sviluppato dolori o limitazioni fisiche da considerare per il tuo piano?`;
        needsToAsk = true;
      } else {
        // Meno di 60 giorni, procedi senza chiedere
        suggestedQuestion = null;
        needsToAsk = false;
      }
    }
    // CASO C: ha_limitazioni === null O undefined (mai compilato)
    // IMPORTANTE: Anche se ha_limitazioni === false ma limitazioni_compilato_at è null, chiedi comunque
    else if (hasLimitazioni === null || hasLimitazioni === undefined || limitazioniCompilatoAt === null) {
      // Mai chiesto o mai compilato, chiedi sempre
      suggestedQuestion = `Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare? Questo mi aiuta a creare un programma sicuro per te! 💪`;
      needsToAsk = true;
      console.log('✅ CASO C: ha_limitazioni è null/undefined O limitazioni_compilato_at è null, imposto needsToAsk = true');
    }
    // CASO D: Fallback (non dovrebbe mai arrivare qui)
    else {
      console.warn('⚠️ CASO D (FALLBACK): Situazione non prevista, chiedo comunque per sicurezza');
      suggestedQuestion = `Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare? Questo mi aiuta a creare un programma sicuro per te! 💪`;
      needsToAsk = true;
    }
    
    console.log('🔍 getSmartLimitationsCheck - risultato finale:', {
      needsToAsk,
      hasExistingLimitations: hasLimitazioni === true,
      suggestedQuestion: suggestedQuestion?.substring(0, 50) + '...',
    });
    
    return {
      hasExistingLimitations: hasLimitazioni === true,
      limitations: limitazioniFisiche,
      zones: zoneEvitare,
      medicalConditions: condizioniMediche,
      lastUpdated: limitazioniCompilatoAt,
      daysSinceUpdate,
      needsToAsk,
      suggestedQuestion,
    };
  } catch (error) {
    console.error('❌ Errore controllo intelligente limitazioni:', error);
    // In caso di errore, chiedi sempre per sicurezza
    return {
      hasExistingLimitations: false,
      limitations: null,
      zones: null,
      medicalConditions: null,
      lastUpdated: null,
      daysSinceUpdate: null,
      needsToAsk: true,
      suggestedQuestion: `Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare? Questo mi aiuta a creare un programma sicuro per te! 💪`,
    };
  }
}

/**
 * Parsa la risposta dell'utente sulle limitazioni e la salva nel database
 */
export async function parseAndSaveLimitationsFromChat(
  userId: string,
  userMessage: string
): Promise<{ hasLimitations: boolean; parsed: string | null }> {
  try {
    const messageLower = userMessage.toLowerCase().trim();
    
    // Keywords per "NESSUNA limitazione"
    const noLimitationKeywords = [
      'no',
      'nessuna',
      'niente',
      'sto bene',
      'tutto ok',
      'tutto a posto',
      'nessun problema',
      'zero',
      'non ho',
      'non ho nessun',
      'non ho niente',
      'tutto perfetto',
      'niente di niente',
      'tutto normale',
    ];
    
    // Controlla se il messaggio contiene principalmente keywords negative
    const hasNoKeywords = noLimitationKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Se contiene keywords negative E il messaggio è corto (< 20 caratteri), probabilmente dice "no"
    const isShortNegative = hasNoKeywords && messageLower.length < 20;
    
    // Se contiene keywords negative E non contiene parole che indicano problemi
    const problemKeywords = ['dolore', 'male', 'problema', 'infortunio', 'limitazione', 'schiena', 'ginocchio', 'spalla'];
    const hasProblemKeywords = problemKeywords.some(keyword => messageLower.includes(keyword));
    
    let hasLimitations: boolean;
    let parsed: string | null;
    
    if (isShortNegative || (hasNoKeywords && !hasProblemKeywords)) {
      // Probabilmente dice "no limitazioni"
      hasLimitations = false;
      parsed = null;
    } else {
      // Ha limitazioni, salva il testo
      hasLimitations = true;
      parsed = userMessage.trim();
    }
    
    // Salva nel database
    const { error } = await supabase
      .from('user_onboarding_responses')
      .upsert(
        {
          user_id: userId,
          ha_limitazioni: hasLimitations,
          limitazioni_fisiche: parsed,
          limitazioni_compilato_at: new Date().toISOString(),
          last_modified_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );
    
    if (error) {
      console.error('❌ Errore salvataggio limitazioni da chat:', error);
      // Ritorna comunque il risultato anche se il salvataggio fallisce
    }
    
    console.log('✅ Limitazioni parsate e salvate:', { hasLimitations, parsed });
    
    return {
      hasLimitations,
      parsed,
    };
  } catch (error) {
    console.error('❌ Errore parsing limitazioni da chat:', error);
    // In caso di errore, assume che abbia limitazioni per sicurezza
    return {
      hasLimitations: true,
      parsed: userMessage.trim(),
    };
  }
}

