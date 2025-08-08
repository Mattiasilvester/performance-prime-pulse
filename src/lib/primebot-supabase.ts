// PrimeBot Supabase Integration
// Gestione dati utente e interazioni per PrimeBot

import { supabase } from '@/integrations/supabase/client';
import { UserContext } from './voiceflow-api';

export interface ChatInteraction {
  user_id: string;
  session_id: string;
  message_content: string;
  bot_response: string;
  interaction_type: 'text' | 'choice' | 'system';
  user_context?: any;
  bot_intent?: string;
  timestamp?: Date;
}

export interface PrimeBotPreferences {
  user_id: string;
  communication_style: 'motivational' | 'technical' | 'casual';
  preferred_workout_types: string[];
  reminder_frequency: 'daily' | 'weekly' | 'monthly';
  onboarding_completed: boolean;
  last_interaction?: Date;
  total_messages: number;
  favorite_topics: string[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  duration: number;
  calories_burned?: number;
  completed_at: Date;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
}

/**
 * Ottiene il contesto utente per PrimeBot
 */
export async function getUserContextForBot(userID: string): Promise<UserContext | null> {
  try {
    // Ottieni dati utente base
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', userID)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    // Ottieni preferenze PrimeBot
    const { data: preferences, error: prefError } = await supabase
      .from('primebot_preferences')
      .select('*')
      .eq('user_id', userID)
      .single();

    // Ottieni workout recenti
    const { data: recentWorkouts, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userID)
      .order('created_at', { ascending: false })
      .limit(5);

    // Ottieni metriche progresso
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userID)
      .order('created_at', { ascending: false })
      .limit(1);

    // Costruisci il contesto utente
    const userContext: UserContext = {
      user_id: userID,
      name: userData?.name || 'Utente',
      fitness_level: preferences?.fitness_level || 'beginner',
      goals: preferences?.goals || ['general_fitness'],
      recent_workouts: recentWorkouts || [],
      progress_metrics: {
        weight: progressData?.[0]?.weight,
        body_fat: progressData?.[0]?.body_fat,
        last_updated: progressData?.[0]?.created_at || new Date().toISOString()
      },
      has_trainer: preferences?.has_trainer || false,
      subscription_status: preferences?.subscription_status || 'free',
      preferences: {
        workout_types: preferences?.preferred_workout_types || ['cardio', 'strength'],
        reminder_frequency: preferences?.reminder_frequency || 'daily',
        communication_style: preferences?.communication_style || 'motivational'
      }
    };

    return userContext;
  } catch (error) {
    console.error('Error getting user context for bot:', error);
    return null;
  }
}

/**
 * Registra un'interazione chat con PrimeBot
 */
export async function logChatInteraction(interaction: ChatInteraction): Promise<void> {
  try {
    const { error } = await supabase
      .from('primebot_interactions')
      .insert({
        user_id: interaction.user_id,
        session_id: interaction.session_id,
        message_content: interaction.message_content,
        bot_response: interaction.bot_response,
        interaction_type: interaction.interaction_type,
        user_context: interaction.user_context,
        bot_intent: interaction.bot_intent,
        timestamp: interaction.timestamp || new Date()
      });

    if (error) {
      console.error('Error logging chat interaction:', error);
    }
  } catch (error) {
    console.error('Error logging chat interaction:', error);
  }
}

/**
 * Aggiorna le preferenze utente basate sulla chat
 */
export async function updateUserPreferencesFromChat(
  userID: string, 
  preferences: Partial<PrimeBotPreferences>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('primebot_preferences')
      .upsert({
        user_id: userID,
        ...preferences,
        last_interaction: new Date()
      });

    if (error) {
      console.error('Error updating user preferences:', error);
    }
  } catch (error) {
    console.error('Error updating user preferences from chat:', error);
  }
}

/**
 * Ottiene la cronologia chat recente
 */
export async function getRecentChatHistory(
  userID: string, 
  limit: number = 10
): Promise<ChatInteraction[]> {
  try {
    const { data, error } = await supabase
      .from('primebot_interactions')
      .select('*')
      .eq('user_id', userID)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent chat history:', error);
    return [];
  }
}

/**
 * Incrementa il contatore messaggi totali
 */
export async function incrementMessageCount(userID: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('primebot_preferences')
      .update({
        total_messages: supabase.sql`total_messages + 1`,
        last_interaction: new Date()
      })
      .eq('user_id', userID);

    if (error) {
      console.error('Error incrementing message count:', error);
    }
  } catch (error) {
    console.error('Error incrementing message count:', error);
  }
}

/**
 * Ottiene statistiche utente per PrimeBot
 */
export async function getUserStats(userID: string): Promise<{
  total_messages: number;
  favorite_topics: string[];
  last_interaction?: Date;
  onboarding_completed: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('primebot_preferences')
      .select('total_messages, favorite_topics, last_interaction, onboarding_completed')
      .eq('user_id', userID)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        total_messages: 0,
        favorite_topics: [],
        onboarding_completed: false
      };
    }

    return {
      total_messages: data?.total_messages || 0,
      favorite_topics: data?.favorite_topics || [],
      last_interaction: data?.last_interaction,
      onboarding_completed: data?.onboarding_completed || false
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total_messages: 0,
      favorite_topics: [],
      onboarding_completed: false
    };
  }
}

/**
 * Crea le tabelle PrimeBot se non esistono
 */
export async function initializePrimeBotTables(): Promise<void> {
  try {
    // Crea tabella interazioni chat
    const { error: interactionsError } = await supabase.rpc('create_primebot_interactions_table');
    
    // Crea tabella preferenze
    const { error: preferencesError } = await supabase.rpc('create_primebot_preferences_table');

    if (interactionsError) {
      console.warn('PrimeBot interactions table might already exist:', interactionsError);
    }
    
    if (preferencesError) {
      console.warn('PrimeBot preferences table might already exist:', preferencesError);
    }
  } catch (error) {
    console.error('Error initializing PrimeBot tables:', error);
  }
}

/**
 * Verifica se l'utente ha completato l'onboarding
 */
export async function checkOnboardingStatus(userID: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('primebot_preferences')
      .select('onboarding_completed')
      .eq('user_id', userID)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Marca l'onboarding come completato
 */
export async function completeOnboarding(userID: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('primebot_preferences')
      .upsert({
        user_id: userID,
        onboarding_completed: true,
        last_interaction: new Date()
      });

    if (error) {
      console.error('Error completing onboarding:', error);
    }
  } catch (error) {
    console.error('Error completing onboarding:', error);
  }
}
