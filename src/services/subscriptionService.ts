// Servizio per gestire abbonamenti Stripe PrimePro
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface Subscription {
  id: string;
  professional_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: 'business';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  price_cents: number;
  currency: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  payment_method_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerResponse {
  success: boolean;
  customer_id: string;
  setup_intent_client_secret: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription_id: string;
  status: string;
  client_secret: string | null;
  requires_action: boolean;
}

// ============================================
// CREATE CUSTOMER AND SETUP INTENT
// ============================================

/**
 * Crea customer Stripe e setup intent per aggiungere payment method
 * @returns SetupIntent client_secret per Stripe Elements
 */
export async function createCustomerAndSetupIntent(): Promise<CreateCustomerResponse> {
  try {
    // Verifica sessione prima di chiamare la funzione
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Utente non autenticato. Effettua il login.');
    }

    console.log('[SUBSCRIPTION] Chiamata stripe-create-customer...');
    const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
      body: {},
    });

    if (error) {
      console.error('[SUBSCRIPTION] Errore creazione customer:', error);
      console.error('[SUBSCRIPTION] Error details:', {
        message: error.message,
        status: (error as any).status,
        context: (error as any).context
      });
      
      // Messaggio più dettagliato per 404
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('Edge Function stripe-create-customer non trovata. Verifica che sia stata deployata correttamente su Supabase.');
      }
      
      throw new Error(error.message || 'Errore creazione customer Stripe');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Errore creazione customer Stripe');
    }

    return {
      success: true,
      customer_id: data.customer_id,
      setup_intent_client_secret: data.setup_intent_client_secret,
    };
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in createCustomerAndSetupIntent:', error);
    throw error;
  }
}

// ============================================
// CREATE SUBSCRIPTION
// ============================================

/**
 * Crea subscription Stripe dopo che l'utente ha aggiunto payment method
 * @returns Subscription ID e client_secret se serve completare pagamento
 */
export async function createSubscription(): Promise<CreateSubscriptionResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
      body: {},
    });

    if (error) {
      console.error('[SUBSCRIPTION] Errore creazione subscription:', error);
      throw new Error(error.message || 'Errore creazione subscription Stripe');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Errore creazione subscription Stripe');
    }

    return {
      success: true,
      subscription_id: data.subscription_id,
      status: data.status,
      client_secret: data.client_secret,
      requires_action: data.requires_action || false,
    };
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in createSubscription:', error);
    throw error;
  }
}

// ============================================
// GET SUBSCRIPTION
// ============================================

/**
 * Recupera subscription del professionista corrente
 * @param professionalId - ID del professionista (opzionale, se non fornito usa quello della sessione)
 * @returns Subscription o null se non trovata
 */
export async function getSubscription(professionalId?: string): Promise<Subscription | null> {
  try {
    // Se professionalId non fornito, recuperalo dalla sessione
    let profId = professionalId;
    
    if (!profId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Utente non autenticato');
      }

      // Recupera professional_id dal database
      const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profError || !professional) {
        throw new Error('Professional not found');
      }

      profId = professional.id;
    }

    // Recupera subscription
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('*')
      .eq('professional_id', profId)
      .maybeSingle();

    if (subError) {
      console.error('[SUBSCRIPTION] Errore recupero subscription:', subError);
      throw subError;
    }

    return subscription as Subscription | null;
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in getSubscription:', error);
    throw error;
  }
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

/**
 * Helper per recuperare solo lo status della subscription
 * @param professionalId - ID del professionista (opzionale)
 * @returns Status della subscription o null se non trovata
 */
export async function getSubscriptionStatus(professionalId?: string): Promise<Subscription['status'] | null> {
  try {
    const subscription = await getSubscription(professionalId);
    return subscription?.status || null;
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in getSubscriptionStatus:', error);
    return null;
  }
}

// ============================================
// CHECK IF SUBSCRIPTION IS ACTIVE
// ============================================

/**
 * Verifica se la subscription è attiva (active o trialing)
 * @param professionalId - ID del professionista (opzionale)
 * @returns true se subscription è attiva, false altrimenti
 */
export async function isSubscriptionActive(professionalId?: string): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus(professionalId);
    return status === 'active' || status === 'trialing';
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in isSubscriptionActive:', error);
    return false;
  }
}

// ============================================
// CHECK IF TRIAL IS EXPIRED
// ============================================

/**
 * Verifica se il trial è scaduto
 * @param professionalId - ID del professionista (opzionale)
 * @returns true se trial scaduto, false altrimenti
 */
export async function isTrialExpired(professionalId?: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(professionalId);
    
    if (!subscription || !subscription.trial_end) {
      return false; // Se non c'è trial_end, considera non scaduto
    }

    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    
    return now > trialEnd;
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in isTrialExpired:', error);
    return false;
  }
}

// ============================================
// GET DAYS REMAINING IN TRIAL
// ============================================

/**
 * Calcola giorni rimanenti nel trial
 * @param professionalId - ID del professionista (opzionale)
 * @returns Numero di giorni rimanenti o null se non in trial
 */
export async function getTrialDaysRemaining(professionalId?: string): Promise<number | null> {
  try {
    const subscription = await getSubscription(professionalId);
    
    if (!subscription || !subscription.trial_end || subscription.status !== 'trialing') {
      return null;
    }

    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('[SUBSCRIPTION] Errore in getTrialDaysRemaining:', error);
    return null;
  }
}
