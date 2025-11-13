interface EmailUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    firstName?: string;
    lastName?: string;
  };
}

// N8N_WEBHOOKS rimosso - ora gestito tramite Edge Function proxy
// Le URL sono configurate server-side in supabase/functions/n8n-webhook-proxy/index.ts
// La secret è gestita server-side e non è più esposta nel bundle frontend

/**
 * Invia email di benvenuto tramite webhook n8n (via Edge Function proxy)
 */
export async function sendWelcomeEmail(user: EmailUser): Promise<void> {
  // Estrai nome dall'user o usa email come fallback
  const name = user.user_metadata?.full_name || 
               user.user_metadata?.firstName || 
               user.email?.split('@')[0] || 
               'Utente';
  
  const payload = {
    user_id: user.id,
    name: name,
    email: user.email
  };

  try {
    // Usa Edge Function proxy invece di chiamare direttamente N8N (secret server-side)
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook-proxy?type=welcome`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
    return;
    
  } catch (error) {
    // Log errore ma NON bloccare la registrazione
    console.error('⚠️ Errore invio email benvenuto (non bloccante):', error);
    // Non rilanciare l'errore - la registrazione deve continuare
  }
}

/**
 * Invia email reset password tramite webhook n8n (via Edge Function proxy)
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const payload = {
    email: email,
    reset_link: resetLink
  };

  try {
    // Usa Edge Function proxy invece di chiamare direttamente N8N (secret server-side)
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook-proxy?type=passwordReset`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
  } catch (error) {
    console.error('⚠️ Errore invio email reset (non bloccante):', error);
  }
}

/**
 * Invia email verifica account tramite webhook n8n (via Edge Function proxy)
 */
export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  const payload = {
    email: email,
    verification_link: verificationLink
  };

  try {
    // Usa Edge Function proxy invece di chiamare direttamente N8N (secret server-side)
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook-proxy?type=verification`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
  } catch (error) {
    console.error('⚠️ Errore invio email verifica (non bloccante):', error);
  }
}

// Export per retrocompatibilità
export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};
