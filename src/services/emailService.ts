interface EmailUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Configurazione webhook n8n
const N8N_WEBHOOKS = {
  welcome: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-welcome',
  passwordReset: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-password-reset',
  verification: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-email-verification'
} as const;

/**
 * Invia email di benvenuto tramite webhook n8n
 */
export async function sendWelcomeEmail(user: EmailUser): Promise<void> {
  const webhookUrl = N8N_WEBHOOKS.welcome;
  
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Aggiungi secret se configurato
    const secret = import.meta.env.VITE_N8N_WEBHOOK_SECRET;
    if (secret) {
      headers['x-pp-secret'] = secret;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
    console.log('✅ Email di benvenuto inviata via n8n a:', user.email);
    return;
    
  } catch (error) {
    // Log errore ma NON bloccare la registrazione
    console.error('⚠️ Errore invio email benvenuto (non bloccante):', error);
    // Non rilanciare l'errore - la registrazione deve continuare
  }
}

/**
 * Invia email reset password tramite webhook n8n
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const webhookUrl = N8N_WEBHOOKS.passwordReset;
  
  const payload = {
    email: email,
    reset_link: resetLink
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Aggiungi secret se configurato
    const secret = import.meta.env.VITE_N8N_WEBHOOK_SECRET;
    if (secret) {
      headers['x-pp-secret'] = secret;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
    console.log('✅ Email reset password inviata via n8n a:', email);
    
  } catch (error) {
    console.error('⚠️ Errore invio email reset (non bloccante):', error);
  }
}

/**
 * Invia email verifica account tramite webhook n8n
 */
export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  const webhookUrl = N8N_WEBHOOKS.verification;
  
  const payload = {
    email: email,
    verification_link: verificationLink
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Aggiungi secret se configurato
    const secret = import.meta.env.VITE_N8N_WEBHOOK_SECRET;
    if (secret) {
      headers['x-pp-secret'] = secret;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n fallito: ${response.status}`);
    }
    
    console.log('✅ Email verifica inviata via n8n a:', email);
    
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
