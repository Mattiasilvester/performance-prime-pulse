import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  created: number;
}

/**
 * Recupera tutte le carte salvate
 */
export const listPaymentMethods = async (): Promise<{
  payment_methods: PaymentMethod[];
  default_payment_method: string | null;
}> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non autenticato');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-list-payment-methods`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Errore nel recupero delle carte');
  }

  return {
    payment_methods: data.payment_methods,
    default_payment_method: data.default_payment_method,
  };
};

/**
 * Imposta una carta come predefinita
 */
export const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non autenticato');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-set-default-payment-method`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ payment_method_id: paymentMethodId }),
    }
  );

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Errore nell\'impostazione della carta predefinita');
  }
};

/**
 * Rimuove una carta salvata
 */
export const detachPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non autenticato');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-detach-payment-method`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ payment_method_id: paymentMethodId }),
    }
  );

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Errore nella rimozione della carta');
  }
};

/**
 * Formatta il brand della carta
 */
export const formatCardBrand = (brand: string): string => {
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return brands[brand.toLowerCase()] || brand;
};
