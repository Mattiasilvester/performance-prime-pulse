import { supabase } from '@/integrations/supabase/client';
import type { NutritionPlanRecord } from '@/types/nutritionPlan';
import type { StructuredNutritionPlan } from '@/types/nutritionPlan';

/**
 * Recupera tutti i piani nutrizionali dell'utente ordinati per data creazione (più recenti prima).
 */
export async function fetchUserNutritionPlans(
  userId: string
): Promise<NutritionPlanRecord[]> {
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    contenuto: row.contenuto as StructuredNutritionPlan,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  })) as NutritionPlanRecord[];
}
