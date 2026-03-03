interface EmailUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Edge Function n8n-webhook-proxy rimossa da config. Le email sono gestite da Resend/Supabase Auth altrove.
// Le funzioni restano per retrocompatibilità (useAuth chiama sendWelcomeEmail) ma non effettuano chiamate esterne.

/**
 * Invia email di benvenuto (no-op: proxy n8n rimosso; email gestita da Resend/Supabase altrove).
 */
export async function sendWelcomeEmail(user: EmailUser): Promise<void> {
  if (import.meta.env.DEV) {
    console.info('[emailService] sendWelcomeEmail chiamato (no-op, n8n-webhook-proxy rimosso)', user.email);
  }
}

/**
 * Invia email reset password (no-op: proxy n8n rimosso).
 */
export async function sendPasswordResetEmail(_email: string, _resetLink: string): Promise<void> {
  if (import.meta.env.DEV) {
    console.info('[emailService] sendPasswordResetEmail chiamato (no-op, n8n-webhook-proxy rimosso)');
  }
}

/**
 * Invia email verifica account (no-op: proxy n8n rimosso).
 */
export async function sendVerificationEmail(_email: string, _verificationLink: string): Promise<void> {
  if (import.meta.env.DEV) {
    console.info('[emailService] sendVerificationEmail chiamato (no-op, n8n-webhook-proxy rimosso)');
  }
}

// Export per retrocompatibilità
export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};
