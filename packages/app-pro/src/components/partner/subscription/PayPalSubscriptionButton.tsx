import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { PAYPAL_CLIENT_ID, PAYPAL_PLAN_ID, isPayPalConfigured } from '@/lib/paypal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  onSuccess: () => void;
  onError?: (error: unknown) => void;
}

export function PayPalSubscriptionButton({ onSuccess, onError }: PayPalSubscriptionButtonProps) {
  if (!isPayPalConfigured()) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        PayPal non è configurato
      </div>
    );
  }

  const handleApprove = async (data: Record<string, unknown> & { subscriptionID?: string }) => {
    try {
      console.log('✅ PayPal subscription approved:', data);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non autenticato');
      }

      // Salva subscription nel database
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subscription_id: data.subscriptionID,
            plan_id: PAYPAL_PLAN_ID,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore nel salvataggio subscription');
      }

      toast.success('Abbonamento PayPal attivato con successo!');
      onSuccess();
    } catch (error: unknown) {
      console.error('Errore PayPal approval:', error);
      toast.error((error as Error)?.message || 'Errore nell\'attivazione dell\'abbonamento');
      onError?.(error);
    }
  };

  const handleError = (err: unknown) => {
    console.error('Errore PayPal:', err);
    toast.error('Errore durante il pagamento PayPal');
    onError?.(err);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: 'EUR',
        intent: 'subscription',
        vault: true,
      }}
    >
      <PayPalButtons
        style={{
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe',
        }}
        createSubscription={(data, actions) => {
          return actions.subscription.create({
            plan_id: PAYPAL_PLAN_ID,
          });
        }}
        onApprove={handleApprove}
        onError={handleError}
        onCancel={() => {
          toast.info('Pagamento annullato');
        }}
      />
    </PayPalScriptProvider>
  );
}
