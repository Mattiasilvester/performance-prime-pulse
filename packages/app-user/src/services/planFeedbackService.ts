import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'workout' | 'nutrition';
export type Vote = 1 | -1;

export interface PlanFeedbackResult {
  vote: Vote;
  notes: string | null;
}

interface PlanFeedback {
  plan_id: string;
  plan_type: PlanType;
  vote: Vote;
}

export async function getFeedback(
  planId: string,
  userId: string
): Promise<PlanFeedbackResult | null> {
  const { data, error } = await supabase
    .from('plan_feedback')
    .select('vote, notes')
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return { vote: data.vote as Vote, notes: data.notes ?? null };
}

export async function getFeedbackByUser(
  userId: string
): Promise<Record<string, Vote>> {
  const { data, error } = await supabase
    .from('plan_feedback')
    .select('plan_id, plan_type, vote')
    .eq('user_id', userId);

  if (error || !data) return {};
  const out: Record<string, Vote> = {};
  for (const row of data as PlanFeedback[]) {
    out[`${row.plan_id}:${row.plan_type}`] = row.vote;
  }
  return out;
}

export async function upsertFeedback(
  planId: string,
  userId: string,
  planType: PlanType,
  vote: Vote,
  notes?: string
): Promise<void> {
  const { error } = await supabase.from('plan_feedback').upsert(
    {
      plan_id: planId,
      user_id: userId,
      plan_type: planType,
      vote,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'plan_id,user_id' }
  );

  if (error) throw new Error(error.message);
}

export async function deleteFeedback(
  planId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('plan_feedback')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
