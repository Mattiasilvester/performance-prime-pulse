import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@pp/shared';
import { useAuth } from '@pp/shared';

export interface Subscription {
  id: string;
  professional_id: string;
  plan: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  price_cents: number;
  currency: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancellation_reason: string | null; // Motivo cancellazione
  card_last4: string | null;
  card_brand: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  payment_provider: 'stripe' | 'paypal' | null;
}

export interface Invoice {
  id: string;
  stripe_invoice_id: string | null;
  invoice_number: string | null;
  amount: number; // DECIMAL nel database, viene convertito a number
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  description: string | null;
  invoice_pdf_url: string | null;
  invoice_date: string;
  paid_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder data per development (simula trial attivo con 10 giorni rimanenti)
  const getPlaceholderSubscription = (professionalId: string): Subscription => {
    const now = new Date();
    const trialStart = new Date(now);
    trialStart.setDate(trialStart.getDate() - 80); // Trial iniziato 80 giorni fa (10 giorni rimanenti su 90)
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 10); // Trial scade tra 10 giorni

    return {
      id: 'placeholder-sub-123',
      professional_id: professionalId,
      plan: 'business',
      status: 'trialing',
      price_cents: 5000, // €50
      currency: 'EUR',
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      cancellation_reason: null,
      card_last4: '4242', // Carta salvata per vedere PaymentMethodCard
      card_brand: 'visa',
      card_exp_month: 12,
      card_exp_year: 2026,
      stripe_customer_id: 'cus_placeholder',
      stripe_subscription_id: 'sub_placeholder',
      paypal_subscription_id: null,
      paypal_plan_id: null,
      payment_provider: 'stripe',
    };
  };

  const getPlaceholderInvoices = (): Invoice[] => {
    return [
      {
        id: 'inv-1',
        stripe_invoice_id: 'in_placeholder1',
        invoice_number: 'INV-2025-001',
        amount: 50.00,
        currency: 'EUR',
        status: 'paid',
        description: 'Abbonamento Prime Business - Gennaio 2025',
        invoice_pdf_url: null,
        invoice_date: new Date(2025, 0, 15).toISOString(),
        paid_at: new Date(2025, 0, 15).toISOString(),
      },
      {
        id: 'inv-2',
        stripe_invoice_id: 'in_placeholder2',
        invoice_number: 'INV-2024-012',
        amount: 50.00,
        currency: 'EUR',
        status: 'paid',
        description: 'Abbonamento Prime Business - Dicembre 2024',
        invoice_pdf_url: null,
        invoice_date: new Date(2024, 11, 15).toISOString(),
        paid_at: new Date(2024, 11, 15).toISOString(),
      },
    ];
  };

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const isDev = import.meta.env.DEV;

      // Recupera professional_id
      const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profError) {
        throw profError;
      }

      if (!professional) {
        setError('Professionista non trovato');
        setLoading(false);
        return;
      }

      // Recupera subscription
      const { data: sub, error: subError } = await supabase
        .from('professional_subscriptions')
        .select('*')
        .eq('professional_id', professional.id)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Usa sempre i dati reali dal DB. Nessun placeholder per la subscription così
      // il trial senza carta (ensure-partner-subscription) e il blocco a scadenza funzionano.
      setSubscription(sub || null);
      if (isDev && sub) {
        console.log('[DEV] Usando dati reali dal database (non placeholder)');
      }

      // Recupera fatture usando professional_id (non subscription_id)
      const { data: invs, error: invError } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('professional_id', professional.id)
        .order('invoice_date', { ascending: false })
        .limit(10);

      if (invError && invError.code !== 'PGRST116') {
        console.error('Errore recupero fatture:', invError);
        // Non bloccare se ci sono errori nelle fatture
      } else {
        // In development, usa placeholder solo se non ci sono fatture reali
        if (isDev && (!invs || invs.length === 0)) {
          console.log('[PLACEHOLDER] Modalità DEV attiva - Nessuna fattura reale, usando dati placeholder');
          setInvoices(getPlaceholderInvoices());
        } else {
          // Usa dati reali (anche in DEV se esistono)
          setInvoices(invs || []);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento dei dati';
      console.error('Errore useSubscription:', err);
      setError(message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Utility functions
  const getTrialDaysRemaining = (): number => {
    if (!subscription?.trial_end) return 0;
    const now = new Date();
    const end = new Date(subscription.trial_end);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTrialProgress = (): number => {
    if (!subscription?.trial_start || !subscription?.trial_end) return 0;
    const start = new Date(subscription.trial_start).getTime();
    const end = new Date(subscription.trial_end).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const isTrialExpiringSoon = (): boolean => {
    const daysRemaining = getTrialDaysRemaining();
    return daysRemaining <= 14 && daysRemaining > 0;
  };

  const formatPrice = (cents: number): string => {
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatInvoiceAmount = (amount: number): string => {
    // amount è già in euro (DECIMAL nel database)
    return `€${amount.toFixed(2).replace('.', ',')}`;
  };

  return {
    subscription,
    invoices,
    loading,
    error,
    refetch: fetchSubscription,
    getTrialDaysRemaining,
    getTrialProgress,
    isTrialExpiringSoon,
    formatPrice,
    formatInvoiceAmount,
  };
}
