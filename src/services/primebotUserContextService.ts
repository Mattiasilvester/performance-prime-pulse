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

