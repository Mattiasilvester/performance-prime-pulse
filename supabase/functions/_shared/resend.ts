/**
 * Resend - invio email transazionali da Edge Functions (PrimePro).
 * Usa RESEND_API_KEY (Supabase secrets). Se assente, le chiamate sono no-op.
 */
const RESEND_SEND_URL = 'https://api.resend.com/emails';

export interface SendTransactionalOptions {
  to: string;
  subject: string;
  text: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Invia un'email transazionale via Resend.
 * Se RESEND_API_KEY non è impostata, non invia e restituisce { ok: false, skipped: true }.
 */
export async function sendTransactional(
  options: SendTransactionalOptions
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.log('[resend] RESEND_API_KEY non impostata, skip invio email');
    return { ok: false, skipped: true };
  }

  const fromEmail = options.fromEmail ?? Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@performanceprime.it';
  const fromName = options.fromName ?? Deno.env.get('RESEND_FROM_NAME') ?? 'PrimePro';
  const from = `${fromName} <${fromEmail}>`;

  try {
    const res = await fetch(RESEND_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        text: options.text,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = typeof data === 'object' && data.message ? data.message : String(data);
      console.error('[resend] Errore API:', res.status, errMsg);
      return { ok: false, error: errMsg };
    }

    const resendId = typeof data === 'object' && data !== null && 'id' in data ? (data as { id?: string }).id : undefined;
    console.log(`[resend] ✅ Email inviata con successo a ${options.to} - ID: ${resendId ?? 'N/A'} - Subject: ${options.subject}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[resend] Errore invio:', msg);
    return { ok: false, error: msg };
  }
}
