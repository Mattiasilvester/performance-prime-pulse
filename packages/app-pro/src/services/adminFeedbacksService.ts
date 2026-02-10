/**
 * Servizio per gestione feedback landing in SuperAdmin.
 * Usa l'Edge Function admin-feedbacks (Service Role lato server) così i feedback
 * sono visibili anche quando il client non ha la Service Role Key (es. produzione).
 */

export interface LandingFeedback {
  id: string;
  name: string;
  category: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function getAuthHeader(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY non configurata');
  return {
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

export type FeedbackFilter = 'all' | 'pending' | 'approved';

/**
 * Lista feedback dalla tabella landing_feedbacks (tramite Edge Function, bypass RLS).
 */
export async function listFeedbacks(filter: FeedbackFilter = 'all'): Promise<LandingFeedback[]> {
  const url = `${FUNCTIONS_URL}/admin-feedbacks?filter=${filter}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore caricamento feedback');
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as LandingFeedback[]) : [];
}

/**
 * Restituisce il numero di feedback in attesa (per badge sidebar).
 */
export async function getPendingFeedbackCount(): Promise<number> {
  const url = `${FUNCTIONS_URL}/admin-feedbacks?filter=pending&countOnly=true`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({})) as { count?: number };
  return typeof data.count === 'number' ? data.count : 0;
}

/**
 * Approva un feedback.
 */
export async function approveFeedback(id: string): Promise<void> {
  const res = await fetch(`${FUNCTIONS_URL}/admin-feedbacks`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ action: 'approve', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Errore nell'approvazione");
  }
}

/**
 * Rimuove l'approvazione da un feedback.
 */
export async function unapproveFeedback(id: string): Promise<void> {
  const res = await fetch(`${FUNCTIONS_URL}/admin-feedbacks`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ action: 'unapprove', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore nella rimozione approvazione');
  }
}

/**
 * Elimina un feedback.
 */
export async function deleteFeedback(id: string): Promise<void> {
  const res = await fetch(`${FUNCTIONS_URL}/admin-feedbacks`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ action: 'delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore nell\'eliminazione');
  }
}
