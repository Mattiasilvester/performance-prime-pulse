/**
 * Step 8: Servizio CRUD costi/spese professionista (Costi & Spese PrimePro).
 * Nessuna modifica a servizi esistenti.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProfessionalCostRow = Database['public']['Tables']['professional_costs']['Row'];
type ProfessionalCostInsert = Database['public']['Tables']['professional_costs']['Insert'];
type ProfessionalCostUpdate = Database['public']['Tables']['professional_costs']['Update'];

export type ProfessionalCost = ProfessionalCostRow;

export const COST_CATEGORIES = [
  'affitto',
  'utilities',
  'assicurazione',
  'attrezzatura',
  'percentuale_palestra',
  'software',
  'marketing',
  'formazione',
  'trasporti',
  'altro',
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_CATEGORY_LABELS: Record<string, string> = {
  affitto: 'Affitto studio',
  utilities: 'Utenze',
  assicurazione: 'Assicurazione',
  attrezzatura: 'Attrezzatura',
  percentuale_palestra: 'Percentuale palestra',
  software: 'Software / App',
  marketing: 'Marketing',
  formazione: 'Formazione',
  trasporti: 'Trasporti',
  altro: 'Altro',
};

export const COST_TYPES = ['fisso', 'variabile', 'una_tantum'] as const;
export type CostType = (typeof COST_TYPES)[number];

export const COST_TYPE_LABELS: Record<CostType, string> = {
  fisso: 'Fisso',
  variabile: 'Variabile',
  una_tantum: 'Una tantum',
};

/**
 * Lista costi per professional_id, opzionale filtro per mese/anno.
 */
export async function getProfessionalCosts(
  professionalId: string,
  options?: { year?: number; month?: number }
): Promise<{ data: ProfessionalCost[]; error: Error | null }> {
  let query = supabase
    .from('professional_costs')
    .select('*')
    .eq('professional_id', professionalId)
    .order('cost_date', { ascending: false });

  if (options?.year != null && options?.month != null) {
    const y = options.year;
    const m = String(options.month).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const lastDay = new Date(y, options.month, 0).getDate();
    const endStr = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    query = query.gte('cost_date', startStr).lte('cost_date', endStr);
  } else if (options?.year != null) {
    const start = `${options.year}-01-01`;
    const end = `${options.year}-12-31`;
    query = query.gte('cost_date', start).lte('cost_date', end);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as ProfessionalCost[], error: error as Error | null };
}

/**
 * Totale costi per un mese (costi con cost_date nel mese; ricorrenti contati solo nella data inserita).
 */
export async function getMonthlyCostsTotal(
  professionalId: string,
  year: number,
  month: number
): Promise<{ total: number; error: Error | null }> {
  const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: costs, error } = await supabase
    .from('professional_costs')
    .select('amount')
    .eq('professional_id', professionalId)
    .gte('cost_date', startStr)
    .lte('cost_date', endStr);

  if (error) return { total: 0, error: error as Error };
  const total = (costs ?? []).reduce((sum, c) => sum + Number((c as { amount: number }).amount), 0);
  return { total, error: null };
}

/**
 * Crea un costo.
 */
export async function createProfessionalCost(
  professionalId: string,
  payload: Omit<ProfessionalCostInsert, 'id' | 'professional_id' | 'created_at' | 'updated_at'>
): Promise<{ data: ProfessionalCost | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('professional_costs')
    .insert({
      professional_id: professionalId,
      amount: payload.amount,
      category: payload.category,
      description: payload.description ?? null,
      cost_date: payload.cost_date,
      cost_type: payload.cost_type ?? 'variabile',
      is_recurring: payload.is_recurring ?? false,
      recurrence: payload.recurrence ?? null,
    })
    .select()
    .maybeSingle();

  return { data: data as ProfessionalCost | null, error: error as Error | null };
}

/**
 * Aggiorna un costo.
 */
export async function updateProfessionalCost(
  id: string,
  payload: ProfessionalCostUpdate
): Promise<{ data: ProfessionalCost | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('professional_costs')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();

  return { data: data as ProfessionalCost | null, error: error as Error | null };
}

/**
 * Elimina un costo.
 */
export async function deleteProfessionalCost(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('professional_costs').delete().eq('id', id);
  return { error: error as Error | null };
}

/**
 * Costi ricorrenti: dal mese precedente replica nel mese target se non esistono già.
 * Evita duplicati controllando category + amount + is_recurring per il mese target.
 */
export async function replicateRecurringCosts(
  professionalId: string,
  targetYear: number,
  targetMonth: number
): Promise<{ replicated: number; error: Error | null }> {
  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

  const targetStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const targetLastDay = new Date(targetYear, targetMonth, 0).getDate();
  const targetEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetLastDay).padStart(2, '0')}`;

  const { data: recurring, error: fetchError } = await supabase
    .from('professional_costs')
    .select('id, amount, category, description, recurrence')
    .eq('professional_id', professionalId)
    .eq('is_recurring', true)
    .gte('cost_date', prevStart)
    .lte('cost_date', prevEnd);

  if (fetchError) return { replicated: 0, error: fetchError as Error };
  if (!recurring?.length) return { replicated: 0, error: null };

  const { data: existingInTarget } = await supabase
    .from('professional_costs')
    .select('id, category, amount')
    .eq('professional_id', professionalId)
    .gte('cost_date', targetStart)
    .lte('cost_date', targetEnd);

  const existingSet = new Set(
    (existingInTarget ?? []).map((r) => `${(r as { category: string }).category}|${(r as { amount: number }).amount}`)
  );

  let replicated = 0;
  const targetDate = targetMonth === 1 ? `${targetYear}-01-01` : `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

  for (const row of recurring as Array<{ amount: number; category: string; description: string | null; recurrence: string | null }>) {
    const key = `${row.category}|${row.amount}`;
    if (existingSet.has(key)) continue;
    const { error: insertError } = await supabase.from('professional_costs').insert({
      professional_id: professionalId,
      amount: row.amount,
      category: row.category,
      description: row.description,
      cost_date: targetDate,
      cost_type: 'fisso',
      is_recurring: true,
      recurrence: row.recurrence ?? 'monthly',
    });
    if (!insertError) {
      replicated += 1;
      existingSet.add(key);
    }
  }

  return { replicated, error: null };
}

/**
 * Riepilogo costi ricorrenti attivi: conteggio distinti (category|amount) e totale mensile (per banner).
 */
export async function getRecurringCostsSummary(
  professionalId: string
): Promise<{ count: number; totalPerMonth: number; error: Error | null }> {
  const { data: rows, error } = await supabase
    .from('professional_costs')
    .select('amount, category, recurrence')
    .eq('professional_id', professionalId)
    .eq('is_recurring', true);

  if (error) return { count: 0, totalPerMonth: 0, error: error as Error };
  const list = (rows ?? []) as Array<{ amount: number; category: string; recurrence: string | null }>;
  const seen = new Set<string>();
  let totalPerMonth = 0;
  for (const r of list) {
    const key = `${r.category}|${r.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    totalPerMonth += r.recurrence === 'yearly' ? Number(r.amount) / 12 : Number(r.amount);
  }
  return { count: seen.size, totalPerMonth, error: null };
}
