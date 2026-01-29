import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

/**
 * Tipi di azioni supportate da PrimeBot
 */
export type ActionType = 'save_workout' | 'add_diary' | 'navigate' | 'start_workout';

/**
 * Payload per azione save_workout
 */
export interface SaveWorkoutPayload {
  name: string;
  workout_type?: 'cardio' | 'forza' | 'hiit' | 'mobilita' | 'personalizzato';
  exercises?: unknown[];
  duration?: number;
  scheduled_date?: string;
}

/**
 * Payload per azione add_diary
 */
export interface AddDiaryPayload {
  title?: string;
  content: string;
  category?: 'allenamento' | 'nutrizione' | 'progressi' | 'note' | 'obiettivi';
}

/**
 * Payload per azione navigate
 */
export interface NavigatePayload {
  path: string;
  label?: string;
}

/**
 * Payload per azione start_workout
 */
export interface StartWorkoutPayload {
  workout_type?: 'quick' | 'custom';
  exercises?: unknown[];
  title?: string;
}

/**
 * Risultato esecuzione azione
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * Salva un piano allenamento su custom_workouts
 */
export async function saveWorkoutPlan(
  userId: string,
  payload: SaveWorkoutPayload
): Promise<ActionResult> {
  try {
    console.log('💾 saveWorkoutPlan: Salvataggio workout:', payload);

    const { data, error } = await supabase
      .from('custom_workouts')
      .insert({
        user_id: userId,
        title: payload.name,
        workout_type: payload.workout_type || 'personalizzato',
        scheduled_date: payload.scheduled_date || new Date().toISOString().split('T')[0],
        exercises: payload.exercises || [],
        total_duration: payload.duration || null,
        completed: false,
      })
      .select('id, title, workout_type, scheduled_date')
      .single();

    if (error) {
      console.error('❌ Errore salvataggio workout:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il salvataggio del workout',
      };
    }

    console.log('✅ saveWorkoutPlan: Workout salvato con successo:', data);
    return {
      success: true,
      message: `Workout "${payload.name}" salvato con successo!`,
      data,
    };
  } catch (error) {
    console.error('❌ Errore completo salvataggio workout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    };
  }
}

/**
 * Aggiunge una nota al diario (tabella notes)
 */
export async function addToDiary(
  userId: string,
  payload: AddDiaryPayload
): Promise<ActionResult> {
  try {
    console.log('📝 addToDiary: Aggiunta nota:', payload);

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: payload.title || 'Nota da PrimeBot',
        content: payload.content,
      })
      .select('id, title, content, created_at')
      .single();

    if (error) {
      console.error('❌ Errore aggiunta nota:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il salvataggio della nota',
      };
    }

    console.log('✅ addToDiary: Nota aggiunta con successo:', data);
    return {
      success: true,
      message: 'Nota aggiunta al diario con successo!',
      data,
    };
  } catch (error) {
    console.error('❌ Errore completo aggiunta nota:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    };
  }
}

/**
 * Naviga a una pagina dell'app
 * Nota: Questa funzione deve essere chiamata dal componente React che ha accesso a useNavigate
 */
export function navigateToPage(path: string): ActionResult {
  try {
    console.log('🧭 navigateToPage: Navigazione a:', path);
    
    // La navigazione viene gestita dal componente React
    // Questa funzione serve solo per validare il path
    if (!path || !path.startsWith('/')) {
      return {
        success: false,
        error: 'Path non valido. Deve iniziare con /',
      };
    }

    return {
      success: true,
      message: `Navigazione a ${path}`,
      data: { path },
    };
  } catch (error) {
    console.error('❌ Errore navigazione:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    };
  }
}

/**
 * Avvia un allenamento rapido
 * Nota: Questa funzione prepara i dati per la navigazione a QuickWorkout
 */
export function startWorkout(payload: StartWorkoutPayload): ActionResult {
  try {
    console.log('🏋️ startWorkout: Avvio workout:', payload);

    // Prepara dati per navigazione
    const workoutData = {
      workout_type: payload.workout_type || 'quick',
      exercises: payload.exercises || [],
      title: payload.title || 'Allenamento Rapido',
    };

    return {
      success: true,
      message: 'Preparazione allenamento...',
      data: {
        path: '/workout/quick',
        state: workoutData,
      },
    };
  } catch (error) {
    console.error('❌ Errore avvio workout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    };
  }
}

/**
 * Esegue un'azione basata sul tipo e payload
 */
export async function executeAction(
  userId: string,
  actionType: ActionType,
  payload: SaveWorkoutPayload | AddDiaryPayload | NavigatePayload | StartWorkoutPayload,
  navigate?: (path: string, state?: unknown) => void
): Promise<ActionResult> {
  console.log('🎯 executeAction: Esecuzione azione:', { actionType, payload });

  switch (actionType) {
    case 'save_workout':
      return await saveWorkoutPlan(userId, payload as SaveWorkoutPayload);

    case 'add_diary':
      return await addToDiary(userId, payload as AddDiaryPayload);

    case 'navigate': {
      if (!navigate) {
        return {
          success: false,
          error: 'Funzione navigate non disponibile',
        };
      }
      const navPayload = payload as NavigatePayload;
      const navResult = navigateToPage(navPayload.path);
      if (navResult.success && navigate) {
        navigate(navPayload.path);
      }
      return navResult;
    }

    case 'start_workout': {
      if (!navigate) {
        return {
          success: false,
          error: 'Funzione navigate non disponibile',
        };
      }
      const workoutResult = startWorkout(payload as StartWorkoutPayload);
      if (workoutResult.success && workoutResult.data && navigate) {
        const data = workoutResult.data as { path: string; state?: unknown };
        navigate(data.path, data.state);
      }
      return workoutResult;
    }

    default:
      return {
        success: false,
        error: `Tipo azione non supportato: ${actionType}`,
      };
  }
}

/**
 * Lista azioni disponibili per PrimeBot
 */
export function getAvailableActions(): Array<{
  type: ActionType;
  description: string;
  example: string;
}> {
  return [
    {
      type: 'save_workout',
      description: 'Salva un piano allenamento su custom_workouts',
      example: '[ACTION:save_workout:Salva questo piano:{"name":"Piano Forza","workout_type":"forza"}]',
    },
    {
      type: 'add_diary',
      description: 'Aggiunge una nota al diario',
      example: '[ACTION:add_diary:Aggiungi al diario:{"content":"Ho completato 3 serie di squat oggi"}]',
    },
    {
      type: 'navigate',
      description: 'Naviga a una pagina dell\'app',
      example: '[ACTION:navigate:Vai agli allenamenti:/workouts]',
    },
    {
      type: 'start_workout',
      description: 'Avvia un allenamento rapido',
      example: '[ACTION:start_workout:Inizia allenamento:{"workout_type":"quick"}]',
    },
  ];
}

