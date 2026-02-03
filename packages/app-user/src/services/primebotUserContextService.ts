import { supabase } from '@pp/shared';
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
 * Resetta i dati di limitazioni fisiche per un utente
 * Utile per test e debug
 */
export async function resetHealthLimitations(userId: string): Promise<boolean> {
  try {
    console.log('🔄 Reset limitazioni fisiche per userId:', userId.substring(0, 8) + '...');
    
    const { error } = await supabase
      .from('user_onboarding_responses')
      .update({
        ha_limitazioni: null,
        limitazioni_fisiche: null,
        zone_evitare: [],
        condizioni_mediche: null,
        limitazioni_compilato_at: null,
        last_modified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Errore reset limitazioni:', error);
      return false;
    }

    console.log('✅ Limitazioni fisiche resettate con successo');
    return true;
  } catch (error) {
    console.error('❌ Errore completo reset limitazioni:', error);
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
  hasAnsweredBefore: boolean;            // true se ha già risposto alla domanda (ha_limitazioni !== null E limitazioni_compilato_at !== null)
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
    
    // IMPORTANTE: Normalizza hasLimitazioni per gestire tutti i casi edge
    // Il database potrebbe ritornare: null, undefined, "", false, true, "false", "true"
    let hasLimitazioni: boolean | null = null;
    const rawHasLimitazioni = onboardingData?.ha_limitazioni;
    
    if (rawHasLimitazioni === true || String(rawHasLimitazioni) === 'true') {
      hasLimitazioni = true;
    } else if (rawHasLimitazioni === false || String(rawHasLimitazioni) === 'false') {
      hasLimitazioni = false;
    } else if (rawHasLimitazioni === null || rawHasLimitazioni === undefined || rawHasLimitazioni === '') {
      // Stringa vuota, null, undefined → considera come mai compilato
      hasLimitazioni = null;
    } else {
      // Valore non previsto → considera come mai compilato per sicurezza
      console.warn('⚠️ Valore non previsto per ha_limitazioni:', rawHasLimitazioni, '→ considero come null');
      hasLimitazioni = null;
    }
    
    const limitazioniFisiche = onboardingData?.limitazioni_fisiche || null;
    const zoneEvitare = onboardingData?.zone_evitare || null;
    const condizioniMediche = onboardingData?.condizioni_mediche || null;
    const limitazioniCompilatoAt = onboardingData?.limitazioni_compilato_at 
      ? new Date(onboardingData.limitazioni_compilato_at)
      : null;
    
    console.log('🔍 getSmartLimitationsCheck - dati recuperati:', {
      userId: userId.substring(0, 8) + '...',
      rawHasLimitazioni,
      rawHasLimitazioniType: typeof rawHasLimitazioni,
      rawHasLimitazioniValue: JSON.stringify(rawHasLimitazioni),
      hasLimitazioni,
      hasLimitazioniType: typeof hasLimitazioni,
      isNull: hasLimitazioni === null,
      isTrue: hasLimitazioni === true,
      isFalse: hasLimitazioni === false,
      limitazioniFisiche: limitazioniFisiche?.substring(0, 30) || null,
      limitazioniFisicheLength: limitazioniFisiche?.length || 0,
      limitazioniCompilatoAt: limitazioniCompilatoAt?.toISOString() || null,
      onboardingDataExists: !!onboardingData,
      onboardingDataFull: onboardingData ? {
        ha_limitazioni: onboardingData.ha_limitazioni,
        limitazioni_fisiche: onboardingData.limitazioni_fisiche,
        limitazioni_compilato_at: onboardingData.limitazioni_compilato_at,
      } : null,
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
    console.log('🔍 VERIFICA CASO A:', {
      hasLimitazioni,
      hasLimitazioniIsTrue: hasLimitazioni === true,
      limitazioniFisiche,
      limitazioniFisicheExists: !!limitazioniFisiche,
      limitazioniFisicheTrimLength: limitazioniFisiche?.trim().length || 0,
      conditionA: hasLimitazioni === true && limitazioniFisiche && limitazioniFisiche.trim().length > 0,
    });
    
    if (hasLimitazioni === true && limitazioniFisiche && limitazioniFisiche.trim().length > 0) {
      console.log('✅ CASO A: ha_limitazioni === true E limitazioni_fisiche non vuoto');
      if (daysSinceUpdate !== null && daysSinceUpdate > 30) {
        // Passati più di 30 giorni, chiedi aggiornamento
        console.log('⚠️ CASO A1: Passati più di 30 giorni, chiedi aggiornamento');
        suggestedQuestion = `L'ultima volta mi avevi parlato di ${limitazioniFisiche}. Come sta andando? Il problema persiste o è migliorato?`;
        needsToAsk = true;
      } else {
        // Meno di 30 giorni, usa i dati salvati
        console.log('✅ CASO A2: Meno di 30 giorni, usa i dati salvati (needsToAsk = false)');
        suggestedQuestion = null;
        needsToAsk = false;
      }
    }
    // CASO B: ha_limitazioni === false
    else if (hasLimitazioni === false) {
      console.log('✅ CASO B: ha_limitazioni === false');
      if (daysSinceUpdate !== null && daysSinceUpdate > 60) {
        // Passati più di 60 giorni, chiedi se qualcosa è cambiato
        console.log('⚠️ CASO B1: Passati più di 60 giorni, chiedi se qualcosa è cambiato');
        suggestedQuestion = `È passato un po' di tempo! Hai sviluppato dolori o limitazioni fisiche da considerare per il tuo piano?`;
        needsToAsk = true;
      } else {
        // Meno di 60 giorni, procedi senza chiedere
        console.log('✅ CASO B2: Meno di 60 giorni, procedi senza chiedere (needsToAsk = false)');
        suggestedQuestion = null;
        needsToAsk = false;
      }
    }
    // CASO C: ha_limitazioni === null O undefined (mai compilato)
    // IMPORTANTE: Anche se ha_limitazioni === false ma limitazioni_compilato_at è null, chiedi comunque
    else if (hasLimitazioni === null || hasLimitazioni === undefined || limitazioniCompilatoAt === null) {
      // Mai chiesto o mai compilato, chiedi sempre
      console.log('✅ CASO C: ha_limitazioni è null/undefined O limitazioni_compilato_at è null, imposto needsToAsk = true');
      console.log('🔍 CASO C - dettagli:', {
        hasLimitazioni,
        hasLimitazioniIsNull: hasLimitazioni === null,
        hasLimitazioniIsUndefined: hasLimitazioni === undefined,
        limitazioniCompilatoAt,
        limitazioniCompilatoAtIsNull: limitazioniCompilatoAt === null,
      });
      suggestedQuestion = `Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare? Questo mi aiuta a creare un programma sicuro per te! 💪`;
      needsToAsk = true;
    }
    // CASO D: Fallback (non dovrebbe mai arrivare qui)
    else {
      console.warn('⚠️ CASO D (FALLBACK): Situazione non prevista, chiedo comunque per sicurezza');
      suggestedQuestion = `Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare? Questo mi aiuta a creare un programma sicuro per te! 💪`;
      needsToAsk = true;
    }
    
    // IMPORTANTE: hasAnsweredBefore deve essere true SOLO se:
    // 1. limitazioni_compilato_at è presente (ha compilato qualcosa)
    // 2. ha_limitazioni NON è null (ha effettivamente risposto alla domanda: true o false)
    // Se ha_limitazioni è null, significa che non ha mai risposto, anche se limitazioni_compilato_at potrebbe essere presente per errore
    const hasAnsweredBefore = limitazioniCompilatoAt !== null && hasLimitazioni !== null;
    
    // ⭐ FIX 1: Se ha_limitazioni = false, forza limitations/zones/medicalConditions a null
    // Questo evita che dati residui nel database vengano passati all'AI
    if (hasLimitazioni === false) {
      console.log('🧹 FIX 1: ha_limitazioni = false, forzando limitations/zones/medicalConditions a null (ignoro dati residui)');
    }
    
    console.log('🔍 getSmartLimitationsCheck - risultato finale:', {
      needsToAsk,
      hasExistingLimitations: hasLimitazioni === true,
      hasLimitazioni,
      hasLimitazioniType: typeof hasLimitazioni,
      limitazioniCompilatoAt: limitazioniCompilatoAt?.toISOString() || null,
      hasAnsweredBefore,
      hasAnsweredBeforeCalculation: `${limitazioniCompilatoAt !== null} && ${hasLimitazioni !== null} = ${limitazioniCompilatoAt !== null && hasLimitazioni !== null}`,
      suggestedQuestion: suggestedQuestion?.substring(0, 50) + '...',
      daysSinceUpdate,
    });
    
    return {
      hasExistingLimitations: hasLimitazioni === true,
      // ⭐ FIX 1: Se ha_limitazioni = false, forza limitations/zones/medicalConditions a null
      // Questo evita che dati residui nel database vengano passati all'AI
      limitations: hasLimitazioni === true ? limitazioniFisiche : null,
      zones: hasLimitazioni === true ? zoneEvitare : null,
      medicalConditions: hasLimitazioni === true ? condizioniMediche : null,
      lastUpdated: limitazioniCompilatoAt,
      daysSinceUpdate,
      needsToAsk,
      suggestedQuestion,
      // Aggiungo questo campo esplicito per chiarezza
      hasAnsweredBefore,
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
      hasAnsweredBefore: false,
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
  console.log('🏥 STEP 1 - Messaggio utente:', userMessage);
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
      console.log('🏥 STEP 2 - Limitazione estratta:', parsed);
    }
    
    console.log('🏥 STEP 3 - Limitazione passata al generatore:', parsed);
    
    // ⭐ FIX 2: Se hasLimitations = false, pulisci TUTTI i campi relativi
    if (!hasLimitations) {
      console.log('🧹 FIX 2: Utente ha detto "Nessuna limitazione", pulisco tutti i campi relativi nel database');
    }
    
    // Prepara i dati per l'upsert
    // ⭐ FIX 2: Se hasLimitations = false, forza TUTTI i campi a null/array vuoto
    // Se hasLimitations = true, setta solo limitazioni_fisiche (altri campi non toccati)
    const updateData: Record<string, unknown> = {
      user_id: userId,
      ha_limitazioni: hasLimitations,
      limitazioni_fisiche: hasLimitations ? parsed : null,
      limitazioni_compilato_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString(),
    };
    
    // Se hasLimitations = false, pulisci TUTTI i campi relativi
    if (!hasLimitations) {
      updateData.zone_evitare = [];
      updateData.zone_dolori_dettagli = [];
      updateData.condizioni_mediche = null;
    }
    // Se hasLimitations = true, non tocchiamo zone_evitare, zone_dolori_dettagli, condizioni_mediche
    // (mantengono i valori esistenti se già presenti)
    
    // Salva nel database
    const { error } = await supabase
      .from('user_onboarding_responses')
      .upsert(updateData, {
        onConflict: 'user_id',
      });
    
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

/**
 * Genera un messaggio di riepilogo con tutti i dati onboarding dell'utente
 * Da mostrare prima di generare un piano per conferma
 */
export async function generateOnboardingSummaryMessage(userId: string): Promise<string | null> {
  try {
    console.log('📋 Generando riepilogo onboarding per utente:', userId);
    
    const { data, error } = await supabase
      .from('user_onboarding_responses')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      console.log('❌ Nessun dato onboarding trovato');
      return null;
    }
    
    // Label mapping per valori più leggibili
    const obiettivoLabels: Record<string, string> = {
      'massa': 'Aumento massa muscolare',
      'dimagrire': 'Perdita peso / Dimagrimento',
      'resistenza': 'Migliorare resistenza',
      'tonificare': 'Tonificazione',
      'forza': 'Aumentare forza',
      'benessere': 'Benessere generale',
      'flessibilita': 'Migliorare flessibilità'
    };
    
    const livelloLabels: Record<string, string> = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzato': 'Avanzato'
    };
    
    // Formatta luoghi allenamento
    const formatLuoghi = (luoghi: string | string[] | null): string => {
      if (!luoghi) return 'Non specificato';
      const luoghiArray = Array.isArray(luoghi) ? luoghi : luoghi.split(',');
      const luoghiLabels: Record<string, string> = {
        'casa': 'Casa',
        'palestra': 'Palestra',
        'outdoor': 'All\'aperto',
        'parco': 'Parco'
      };
      return luoghiArray.map(l => luoghiLabels[l.trim()] || l.trim()).join(', ');
    };
    
    // Formatta attrezzi
    const formatAttrezzi = (attrezzi: string | string[] | null): string => {
      if (!attrezzi) return 'Nessuno / Corpo libero';
      const attrezziArray = Array.isArray(attrezzi) ? attrezzi : attrezzi.split(',');
      if (attrezziArray.length === 0 || (attrezziArray.length === 1 && !attrezziArray[0])) {
        return 'Nessuno / Corpo libero';
      }
      return attrezziArray.map(a => a.trim()).join(', ');
    };
    
    // Costruisci il messaggio
    const obiettivo = obiettivoLabels[data.obiettivo] || data.obiettivo || 'Non specificato';
    const livello = livelloLabels[data.livello_esperienza] || data.livello_esperienza || 'Non specificato';
    const giorni = data.giorni_settimana || 'Non specificato';
    const luoghi = formatLuoghi(data.luoghi_allenamento);
    const tempo = data.tempo_sessione ? `${data.tempo_sessione} minuti` : 'Non specificato';
    const attrezzi = formatAttrezzi(data.attrezzi);
    
    // Gestione limitazioni
    let limitazioniText = 'Nessuna indicata';
    if (data.ha_limitazioni === true && data.limitazioni_fisiche) {
      limitazioniText = data.limitazioni_fisiche;
    } else if (data.ha_limitazioni === false) {
      limitazioniText = 'Nessuna';
    }
    
    const summary = `📋 **Secondo le tue risposte durante l'onboarding:**


- **Obiettivo**: ${obiettivo}
- **Livello**: ${livello}
- **Frequenza**: ${giorni} giorni a settimana
- **Luogo**: ${luoghi}
- **Durata sessione**: ${tempo}
- **Attrezzatura**: ${attrezzi}
- **Limitazioni fisiche**: ${limitazioniText}


**Procedo con la creazione del piano o vuoi modificare qualcosa?**`;

    console.log('✅ Riepilogo onboarding generato');
    return summary;
    
  } catch (err) {
    console.error('❌ Errore generazione riepilogo:', err);
    return null;
  }
}

/**
 * Aggiorna una singola preferenza onboarding dell'utente
 * @param userId - ID dell'utente
 * @param field - Campo da aggiornare (obiettivo, livello_esperienza, giorni_settimana, luoghi_allenamento, tempo_sessione, attrezzi)
 * @param value - Nuovo valore
 * @returns true se aggiornato con successo, false altrimenti
 */
export async function updateOnboardingPreference(
  userId: string,
  field: string,
  value: string | number | string[]
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Aggiornamento preferenza onboarding:', { userId: userId.substring(0, 8), field, value });
    
    // Mappa dei campi validi
    const validFields = [
      'obiettivo',
      'livello_esperienza', 
      'giorni_settimana',
      'luoghi_allenamento',
      'tempo_sessione',
      'attrezzi'
    ];
    
    if (!validFields.includes(field)) {
      console.error('❌ Campo non valido:', field);
      return { success: false, message: `Campo "${field}" non valido` };
    }
    
    // Prepara il valore per il database
    let dbValue: unknown = value;
    
    // Gestione specifica per tipo di campo
    if (field === 'luoghi_allenamento' || field === 'attrezzi') {
      // Campi TEXT[] - deve essere un array
      if (typeof value === 'string') {
        dbValue = [value]; // Converti stringa singola in array
      } else if (Array.isArray(value)) {
        dbValue = value; // Mantieni come array
      }
    } else if (field === 'giorni_settimana') {
      // Deve essere numero 1-7
      const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
      if (isNaN(num) || num < 1 || num > 7) {
        return { success: false, message: 'Giorni deve essere tra 1 e 7' };
      }
      dbValue = num;
    } else if (field === 'tempo_sessione') {
      // Deve essere uno dei valori validi: 15, 30, 45, 60
      const validTimes = [15, 30, 45, 60];
      const minutes = typeof value === 'string' ? parseInt(value, 10) : value as number;
      
      if (isNaN(minutes)) {
        return { success: false, message: 'Durata non valida' };
      }
      
      // Arrotonda al valore valido più vicino
      const closest = validTimes.reduce((prev, curr) => 
        Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev
      );
      dbValue = closest;
      
      if (minutes !== closest) {
        console.log(`⚠️ Tempo ${minutes} arrotondato a ${closest} (valori validi: 15, 30, 45, 60)`);
      }
    } else if (Array.isArray(value)) {
      // Altri campi con array - converti in stringa
      dbValue = value.join(',');
    }
    
    const { error } = await supabase
      .from('user_onboarding_responses')
      .update({ [field]: dbValue })
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Errore aggiornamento database:', error);
      return { success: false, message: 'Errore nel salvataggio. Riprova!' };
    }
    
    console.log('✅ Preferenza aggiornata con successo');
    return { success: true, message: 'Preferenza aggiornata!' };
    
  } catch (err) {
    console.error('❌ Errore updateOnboardingPreference:', err);
    return { success: false, message: 'Errore imprevisto. Riprova!' };
  }
}

/**
 * Parsing per riconoscere MULTIPLI campi da modificare in una singola frase
 * Ritorna un array di {field, value} invece di un singolo oggetto
 */
export function parseModifyRequest(message: string): Array<{field: string, value: string | number}> {
  const lower = message.toLowerCase();
  const results: Array<{field: string, value: string | number}> = [];
  
  // === OBIETTIVO ===
  const obiettivoKeywords: Record<string, string> = {
    'massa': 'massa',
    'mettere massa': 'massa',
    'muscoli': 'massa',
    'dimagrire': 'dimagrire',
    'perdere peso': 'dimagrire',
    'dimagrimento': 'dimagrire',
    'tonificare': 'tonificare',
    'tonificazione': 'tonificare',
    'definizione': 'tonificare',
    'resistenza': 'resistenza',
    'cardio': 'resistenza',
    'fiato': 'resistenza',
    'forza': 'forza',
    'forte': 'forza',
    'benessere': 'benessere',
    'salute': 'benessere',
    'stare bene': 'benessere'
  };
  
  for (const [keyword, value] of Object.entries(obiettivoKeywords)) {
    if (lower.includes(keyword)) {
      // Evita duplicati
      if (!results.find(r => r.field === 'obiettivo')) {
        results.push({ field: 'obiettivo', value });
      }
      break;
    }
  }
  
  // === GIORNI ===
  const giorniPatterns = [
    /(\d+)\s*(giorni|volte|sessioni)/i,
    /(\d+)\s*(?:giorni\s*)?(?:a\s*|alla\s*)?settimana/i,
    /giorni\s*[=:]\s*(\d+)/i
  ];
  
  for (const pattern of giorniPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const days = parseInt(match[1]);
      if (days >= 1 && days <= 7) {
        if (!results.find(r => r.field === 'giorni_settimana')) {
          results.push({ field: 'giorni_settimana', value: days });
        }
        break;
      }
    }
  }
  
  // === TEMPO/DURATA ===
  const tempoPatterns = [
    /(\d+)\s*(minuti|min)/i,
    /durata\s*[=:]\s*(\d+)/i
  ];
  
  for (const pattern of tempoPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const minutes = parseInt(match[1]);
      if (minutes >= 15 && minutes <= 120) {
        if (!results.find(r => r.field === 'tempo_sessione')) {
          results.push({ field: 'tempo_sessione', value: minutes });
        }
        break;
      }
    }
  }
  
  // === LUOGO ===
  const luogoKeywords: Record<string, string> = {
    'casa': 'casa',
    'a casa': 'casa',
    'palestra': 'palestra',
    'in palestra': 'palestra',
    'outdoor': 'outdoor',
    'aperto': 'outdoor',
    'aria aperta': 'outdoor',
    'parco': 'outdoor',
    'fuori': 'outdoor'
  };
  
  for (const [keyword, value] of Object.entries(luogoKeywords)) {
    if (lower.includes(keyword)) {
      if (!results.find(r => r.field === 'luoghi_allenamento')) {
        results.push({ field: 'luoghi_allenamento', value });
      }
      break;
    }
  }
  
  // === LIVELLO ===
  const livelloKeywords: Record<string, string> = {
    'principiante': 'principiante',
    'base': 'principiante',
    'inizio': 'principiante',
    'intermedio': 'intermedio',
    'medio': 'intermedio',
    'avanzato': 'avanzato',
    'esperto': 'avanzato',
    'alto': 'avanzato',
    'pro': 'avanzato'
  };
  
  for (const [keyword, value] of Object.entries(livelloKeywords)) {
    if (lower.includes(keyword)) {
      if (!results.find(r => r.field === 'livello_esperienza')) {
        results.push({ field: 'livello_esperienza', value });
      }
      break;
    }
  }
  
  return results;
}

