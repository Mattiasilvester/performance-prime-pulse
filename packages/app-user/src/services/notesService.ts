import { supabase } from '@/integrations/supabase/client';

export type NoteCategory = 'allenamento' | 'nutrizione' | 'mentale' | 'generale';

export interface DiaryNote {
  id: string;
  user_id: string;
  content: string;
  title: string;
  category: NoteCategory;
  is_pinned: boolean;
  is_highlighted: boolean;
  primebot_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  content: string;
  category: NoteCategory;
  is_pinned?: boolean;
  primebot_visible?: boolean;
}

const CATEGORIES: NoteCategory[] = ['allenamento', 'nutrizione', 'mentale', 'generale'];

function toNoteCategory(value: string | null | undefined): NoteCategory {
  if (value && CATEGORIES.includes(value as NoteCategory)) {
    return value as NoteCategory;
  }
  return 'generale';
}

function rowToDiaryNote(row: {
  id: string;
  user_id: string;
  content: string;
  title: string;
  category: string | null;
  is_pinned: boolean;
  is_highlighted: boolean;
  primebot_visible: boolean;
  created_at: string;
  updated_at: string;
}): DiaryNote {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    title: row.title,
    category: toNoteCategory(row.category),
    is_pinned: row.is_pinned,
    is_highlighted: row.is_highlighted,
    primebot_visible: row.primebot_visible,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Tutte le note dell'utente, ordinate per data (più recenti prima) */
export async function getNotes(userId: string): Promise<DiaryNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToDiaryNote(row as Parameters<typeof rowToDiaryNote>[0]));
}

/** Inserisce nota; title = primi 50 caratteri del content */
export async function createNote(userId: string, data: CreateNoteData): Promise<DiaryNote> {
  const trimmed = data.content.trim();
  const title = trimmed.slice(0, 50) || 'Nota';

  const { data: row, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content: trimmed,
      category: data.category,
      is_pinned: data.is_pinned ?? false,
      is_highlighted: false,
      primebot_visible: data.primebot_visible ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToDiaryNote(row as Parameters<typeof rowToDiaryNote>[0]);
}

/** Aggiorna campi consentiti (non id/user_id) */
export async function updateNote(
  id: string,
  userId: string,
  updates: Partial<DiaryNote>
): Promise<DiaryNote> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.is_pinned !== undefined) payload.is_pinned = updates.is_pinned;
  if (updates.is_highlighted !== undefined) payload.is_highlighted = updates.is_highlighted;
  if (updates.primebot_visible !== undefined) payload.primebot_visible = updates.primebot_visible;

  const { data, error } = await supabase
    .from('notes')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Nota non trovata o accesso negato');
  return rowToDiaryNote(data as Parameters<typeof rowToDiaryNote>[0]);
}

export async function deleteNote(id: string, userId: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);

  if (error) throw error;
}

export async function togglePrimebotVisible(
  id: string,
  userId: string,
  visible: boolean
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ primebot_visible: visible, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function bulkSetPrimebotVisible(userId: string, visible: boolean): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ primebot_visible: visible, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
}

/** Note condivise con PrimeBot (max 15, più recenti per updated_at) */
export async function getPrimebotNotes(userId: string): Promise<DiaryNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('content, category, created_at, id, user_id, title, is_pinned, is_highlighted, primebot_visible, updated_at')
    .eq('user_id', userId)
    .eq('primebot_visible', true)
    .order('updated_at', { ascending: false })
    .limit(15);

  if (error) throw error;
  return (data ?? []).map((row) => rowToDiaryNote(row as Parameters<typeof rowToDiaryNote>[0]));
}
