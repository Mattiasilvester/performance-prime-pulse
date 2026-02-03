const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// SuperAdmin usa bypass (localStorage), non sessione Supabase Auth → usiamo anon key per le Edge Function
function getAdminHeaders(): { Authorization: string; 'Content-Type': string } {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY non configurata');
  return {
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

export async function approveApplication(applicationId: string): Promise<{ ok: boolean; professionalId?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-application-action`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ applicationId, action: 'approve' }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || 'Errore approvazione');
  }
  return res.json();
}

export async function rejectApplication(
  applicationId: string,
  rejectionReason?: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-application-action`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ applicationId, action: 'reject', rejectionReason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || 'Errore rifiuto');
  }
  return res.json();
}
