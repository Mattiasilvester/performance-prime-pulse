import { supabase } from '@/integrations/supabase/client';
import type { WorkoutPlan, PlanType, PlanSource, ExperienceLevel, Equipment } from '@/types/plan';

/**
 * Service per operazioni CRUD sui piani di allenamento
 */

/**
 * Converte un piano dal database al formato app
 * Il database usa nomi italiani: tipo, durata, obiettivo, esercizi, luogo
 */
function mapDbToWorkoutPlan(dbRecord: Record<string, unknown>): WorkoutPlan {
  const metadata = (dbRecord.metadata as Record<string, unknown>) || {};
  
  return {
    id: dbRecord.id as string,
    user_id: dbRecord.user_id as string,
    name: (dbRecord.nome ?? dbRecord.name ?? 'Piano senza nome') as string,
    description: (dbRecord.description as string | undefined) ?? undefined,
    plan_type: (dbRecord.tipo ?? dbRecord.plan_type ?? 'weekly') as PlanType,
    source: (dbRecord.source ?? 'custom') as PlanSource,
    goal: (dbRecord.obiettivo ?? dbRecord.goal) as WorkoutPlan['goal'],
    level: (metadata.level ?? dbRecord.level) as ExperienceLevel | undefined,
    duration_weeks: (dbRecord.durata ?? dbRecord.duration_weeks) as WorkoutPlan['duration_weeks'],
    frequency_per_week: (metadata.frequency_per_week ?? dbRecord.frequency_per_week) as number | undefined,
    equipment: (metadata.equipment ?? dbRecord.equipment) as Equipment | undefined,
    limitations: (metadata.limitations ?? dbRecord.limitations) as string | undefined,
    workouts: (dbRecord.esercizi ?? dbRecord.workouts ?? []) as WorkoutPlan['workouts'],
    status: (dbRecord.status ?? 'pending') as 'pending' | 'active' | 'completed',
    created_at: dbRecord.created_at as string,
    updated_at: (dbRecord.updated_at as string | undefined) ?? undefined,
    is_active: (dbRecord.is_active as boolean | undefined) ?? true,
    metadata: {
      ...metadata,
      luogo: dbRecord.luogo,
    } as WorkoutPlan['metadata'],
  };
}

/**
 * Converte un piano dal formato app al database
 * Il database usa nomi italiani: tipo, durata, obiettivo, esercizi
 * frequency_per_week, equipment, level, limitations vanno in metadata (non esistono come colonne)
 * IMPORTANTE: luogo è obbligatorio (NOT NULL) e ha constraint UNIQUE(user_id, luogo)
 */
function mapWorkoutPlanToDb(plan: Omit<WorkoutPlan, 'id' | 'created_at'>): Record<string, unknown> {
  // Genera un luogo unico per evitare constraint UNIQUE(user_id, luogo)
  // Se non specificato, usa nome piano o timestamp per garantire unicità
  let luogo = plan.metadata?.luogo;
  if (!luogo) {
    if (plan.name) {
      // Usa nome piano sanitizzato (max 50 caratteri per evitare problemi)
      const sanitizedName = plan.name
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Rimuovi caratteri speciali
        .replace(/\s+/g, '-') // Sostituisci spazi con trattini
        .substring(0, 50)
        .toLowerCase();
      luogo = `Personalizzato-${sanitizedName}-${Date.now()}`;
    } else {
      // Fallback: usa timestamp
      luogo = `Personalizzato-${Date.now()}`;
    }
  }

  return {
    user_id: plan.user_id,
    nome: plan.name, // Database usa 'nome'
    tipo: plan.plan_type, // Database usa 'tipo' invece di 'plan_type'
    obiettivo: plan.goal || null, // Database usa 'obiettivo' invece di 'goal'
    durata: plan.duration_weeks || (plan.plan_type === 'daily' ? 1 : null), // FIX: default 1 per daily (NOT NULL constraint)
    esercizi: plan.workouts || [], // Database usa 'esercizi' invece di 'workouts'
    luogo: luogo, // FIX: valore unico per evitare constraint UNIQUE(user_id, luogo)
    description: plan.description || null,
    status: plan.status || 'pending', // Status del piano: default 'pending' per nuovi piani
    is_active: plan.is_active !== undefined ? plan.is_active : true,
    metadata: {
      ...(plan.metadata || {}),
      // Campi che non esistono come colonne separate vanno in metadata
      frequency_per_week: plan.frequency_per_week,
      equipment: plan.equipment,
      level: plan.level,
      limitations: plan.limitations,
    },
    source: plan.source || 'custom',
    updated_at: plan.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch tutti i piani dell'utente
 */
export async function fetchUserPlans(userId: string): Promise<WorkoutPlan[]> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user plans:', error);
    throw error;
  }
  
  return (data || []).map(mapDbToWorkoutPlan);
}

/**
 * Fetch singolo piano per ID
 */
export async function fetchPlanById(planId: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (error) {
    console.error('Error fetching plan:', error);
    throw error;
  }
  
  return data ? mapDbToWorkoutPlan(data) : null;
}

/**
 * Salva nuovo piano
 */
export async function savePlan(plan: Omit<WorkoutPlan, 'id' | 'created_at'>): Promise<WorkoutPlan> {
  const dbRecord = mapWorkoutPlanToDb(plan);
  
  const { data, error } = await supabase
    .from('workout_plans')
    .insert(dbRecord)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving plan:', error);
    throw error;
  }
  
  return mapDbToWorkoutPlan(data);
}

/**
 * Aggiorna piano esistente
 * Usa nomi colonne italiani: tipo, durata, obiettivo, esercizi
 */
export async function updatePlan(planId: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
  const dbUpdates: Record<string, unknown> = {};
  
  // Colonne dirette del database (nomi italiani)
  if (updates.name !== undefined) dbUpdates.nome = updates.name;
  if (updates.plan_type !== undefined) dbUpdates.tipo = updates.plan_type; // Database usa 'tipo'
  if (updates.goal !== undefined) dbUpdates.obiettivo = updates.goal; // Database usa 'obiettivo'
  if (updates.duration_weeks !== undefined) dbUpdates.durata = updates.duration_weeks; // Database usa 'durata'
  if (updates.workouts !== undefined) dbUpdates.esercizi = updates.workouts; // Database usa 'esercizi'
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status; // Status del piano
  if (updates.source !== undefined) dbUpdates.source = updates.source;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
  // luogo è obbligatorio - se non specificato, usa default da metadata o 'Personalizzato'
  if (updates.metadata?.luogo !== undefined) {
    dbUpdates.luogo = updates.metadata.luogo;
  } else if (!dbUpdates.luogo) {
    // Se non c'è luogo nell'update, mantieni quello esistente o usa default
    // Non aggiorniamo luogo se non specificato esplicitamente
  }
  
  // Campi che vanno in metadata (non esistono come colonne separate)
  const metadataUpdates: Record<string, unknown> = {};
  if (updates.frequency_per_week !== undefined) metadataUpdates.frequency_per_week = updates.frequency_per_week;
  if (updates.equipment !== undefined) metadataUpdates.equipment = updates.equipment;
  if (updates.level !== undefined) metadataUpdates.level = updates.level;
  if (updates.limitations !== undefined) metadataUpdates.limitations = updates.limitations;
  
  // Se ci sono aggiornamenti a metadata o ai campi che vanno in metadata, aggiorna metadata
  if (Object.keys(metadataUpdates).length > 0 || updates.metadata !== undefined) {
    dbUpdates.metadata = {
      ...(updates.metadata || {}),
      ...metadataUpdates,
    };
  }
  
  dbUpdates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('workout_plans')
    .update(dbUpdates)
    .eq('id', planId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
  
  return mapDbToWorkoutPlan(data);
}

/**
 * Elimina piano (soft delete - set is_active = false)
 */
export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_plans')
    .update({ is_active: false })
    .eq('id', planId);
  
  if (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
}

/**
 * Conta piani attivi utente
 */
export async function countUserPlans(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('workout_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error counting plans:', error);
    throw error;
  }
  
  return count || 0;
}

/**
 * Attiva un piano e disattiva tutti gli altri dell'utente
 * Solo UN piano può essere attivo alla volta
 */
export async function activatePlan(userId: string, planId: string): Promise<boolean> {
  try {
    // 1. Disattiva tutti i piani dell'utente (status -> pending)
    await supabase
      .from('workout_plans')
      .update({ status: 'pending' })
      .eq('user_id', userId)
      .neq('id', planId);

    // 2. Attiva il piano selezionato (status -> active)
    const { error } = await supabase
      .from('workout_plans')
      .update({ status: 'active' })
      .eq('id', planId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error activating plan:', error);
    return false;
  }
}

/**
 * Completa un piano (status -> completed)
 */
export async function completePlan(planId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workout_plans')
      .update({ status: 'completed' })
      .eq('id', planId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error completing plan:', error);
    return false;
  }
}

/**
 * Export del service come oggetto per compatibilità
 */
export const planService = {
  fetchUserPlans,
  fetchPlanById,
  savePlan,
  updatePlan,
  deletePlan,
  countUserPlans,
  activatePlan,
  completePlan,
};

