import { useMemo } from 'react';
import { useSubscription, type Subscription } from '@/hooks/useSubscription';

/**
 * Determina se l'accesso è consentito in base a status e trial_end.
 * Accesso libero solo se:
 * - status === 'trialing' E trial_end > NOW (trial attivo)
 * - status === 'active' (ha pagato)
 * Tutti gli altri casi (trial scaduto, past_due, canceled, unpaid, incomplete) → bloccato.
 */
export function isAccessAllowedBySubscription(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'trialing' && sub.trial_end) {
    const now = new Date();
    const end = new Date(sub.trial_end);
    return end.getTime() > now.getTime();
  }
  return false;
}

/**
 * Trial scaduto: era in trialing ma trial_end <= NOW.
 */
export function isTrialExpired(sub: Subscription | null): boolean {
  if (!sub || sub.status !== 'trialing' || !sub.trial_end) return false;
  const now = new Date();
  const end = new Date(sub.trial_end);
  return end.getTime() <= now.getTime();
}

/**
 * Giorni rimanenti di trial (0 se scaduto o non in trial).
 */
export function getTrialDaysRemaining(sub: Subscription | null): number {
  if (!sub?.trial_end) return 0;
  const now = new Date();
  const end = new Date(sub.trial_end);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export interface SubscriptionStatusResult {
  subscription: Subscription | null;
  loading: boolean;
  isAccessAllowed: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  trialDaysRemaining: number;
  refetch: () => Promise<void>;
}

/**
 * Hook che espone lo stato dell'abbonamento e se l'accesso è consentito.
 * Usa useSubscription come fonte dati (professional_subscriptions).
 */
export function useSubscriptionStatus(): SubscriptionStatusResult {
  const { subscription, loading, refetch } = useSubscription();

  const isAccessAllowed = useMemo(
    () => isAccessAllowedBySubscription(subscription),
    [subscription]
  );

  const isTrialing = useMemo(
    () => subscription?.status === 'trialing',
    [subscription]
  );

  const isExpired = useMemo(
    () => isTrialExpired(subscription),
    [subscription]
  );

  const trialDaysRemaining = useMemo(
    () => getTrialDaysRemaining(subscription),
    [subscription]
  );

  return {
    subscription,
    loading,
    isAccessAllowed,
    isTrialing,
    isExpired,
    trialDaysRemaining,
    refetch,
  };
}
