// Componente per aggiungere carta di credito con Stripe Elements
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { createCustomerAndSetupIntent } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';

interface AddStripeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professionalId: string;
}

// Inizializza Stripe con la chiave pubblicabile
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Componente interno per il form di pagamento
function PaymentForm({ onSuccess, onClose, professionalId }: { onSuccess: () => void; onClose: () => void; professionalId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica che Stripe sia pronto
  if (!stripe || !elements) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#EEBA2B] animate-spin mb-3" />
        <p className="text-gray-600 text-sm">Caricamento form di pagamento...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Conferma il SetupIntent
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/partner/dashboard/impostazioni',
        },
        redirect: 'if_required', // Non reindirizza se non necessario
      });

      if (confirmError) {
        console.error('[STRIPE] Errore conferma SetupIntent:', confirmError);
        setError(confirmError.message || 'Errore durante la conferma della carta');
        setLoading(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        setError('Impossibile recuperare i dati della carta');
        setLoading(false);
        return;
      }

      const paymentMethodId = typeof setupIntent.payment_method === 'string' 
        ? setupIntent.payment_method 
        : setupIntent.payment_method.id;

      if (!paymentMethodId) {
        throw new Error('Payment method ID non trovato');
      }

      console.log('[STRIPE] SetupIntent confermato:', {
        setupIntentId: setupIntent.id,
        paymentMethodId,
      });

      // Recupera i dettagli del SetupIntent per ottenere i dati della carta
      const retrievedSetupIntent = await stripe.retrieveSetupIntent(setupIntent.client_secret!);
      
      if (retrievedSetupIntent.error) {
        throw new Error(retrievedSetupIntent.error.message);
      }

      const setupIntentData = retrievedSetupIntent.setupIntent;
      
      // Il payment_method può essere una stringa (ID) o un oggetto PaymentMethod
      let pmDetails: any = null;
      
      if (typeof setupIntentData.payment_method === 'object' && setupIntentData.payment_method !== null) {
        // Se è un oggetto, abbiamo già i dettagli
        pmDetails = setupIntentData.payment_method;
      } else {
        // Se è solo un ID, dobbiamo recuperare i dettagli tramite Edge Function
        // Per ora salviamo solo l'ID e i dettagli verranno aggiornati dal webhook o quando necessario
        // Oppure possiamo chiamare un'Edge Function per recuperare i dettagli
        console.warn('[STRIPE] Payment method è solo un ID, i dettagli verranno aggiornati automaticamente');
      }

      // Se abbiamo i dettagli della carta, usiamoli, altrimenti salveremo solo l'ID
      const cardLast4 = pmDetails?.card?.last4 || null;
      const cardBrand = pmDetails?.card?.brand || null;
      const cardExpMonth = pmDetails?.card?.exp_month || null;
      const cardExpYear = pmDetails?.card?.exp_year || null;

      // Salva nel database professional_subscriptions
      const { data: subscription, error: subError } = await supabase
        .from('professional_subscriptions')
        .select('id')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Aggiorna o crea subscription record
      const updateData: any = {
        professional_id: professionalId,
        payment_method_id: paymentMethodId,
        updated_at: new Date().toISOString(),
      };

      // Aggiungi dettagli carta solo se disponibili
      if (cardLast4) updateData.card_last4 = cardLast4;
      if (cardBrand) updateData.card_brand = cardBrand;
      if (cardExpMonth) updateData.card_exp_month = cardExpMonth;
      if (cardExpYear) updateData.card_exp_year = cardExpYear;

      if (subscription) {
        // Aggiorna record esistente
        const { error: updateError } = await supabase
          .from('professional_subscriptions')
          .update(updateData)
          .eq('professional_id', professionalId);

        if (updateError) throw updateError;
      } else {
        // Crea nuovo record (customer_id dovrebbe già esistere da createCustomerAndSetupIntent)
        const { error: insertError } = await supabase
          .from('professional_subscriptions')
          .insert(updateData);

        if (insertError) throw insertError;
      }

      console.log('[STRIPE] Payment method salvato nel database:', {
        paymentMethodId,
        last4: cardLast4,
        brand: cardBrand,
      });

      toast.success('Carta aggiunta con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[STRIPE] Errore salvataggio carta:', err);
      setError(err.message || 'Errore durante il salvataggio della carta');
      toast.error(err.message || 'Errore durante il salvataggio della carta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div 
        className="space-y-3 sm:space-y-4"
        style={{ 
          position: 'relative',
          zIndex: 1,
          isolation: 'isolate',  // Crea nuovo stacking context
        }}
      >
        <PaymentElement 
          options={{
            fields: {
              billingDetails: 'never',
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
            business: {
              name: 'Performance Prime Pulse',
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 sm:px-6 py-2.5 sm:py-2 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          disabled={loading}
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-4 sm:px-6 py-2.5 sm:py-2 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#d4a827] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Aggiungi carta
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function AddStripeCardModal({ isOpen, onClose, onSuccess, professionalId }: AddStripeCardModalProps) {
  const { user } = useAuth();
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crea SetupIntent quando il modal si apre
  useEffect(() => {
    if (isOpen && !setupIntentClientSecret) {
      createSetupIntent();
    }
  }, [isOpen]);

  const createSetupIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createCustomerAndSetupIntent();
      setSetupIntentClientSecret(result.setup_intent_client_secret);
      console.log('[STRIPE] SetupIntent creato:', result.setup_intent_client_secret);
    } catch (err: any) {
      console.error('[STRIPE] Errore creazione SetupIntent:', err);
      setError(err.message || 'Errore durante la creazione del form di pagamento');
      toast.error(err.message || 'Errore durante la creazione del form di pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    clientSecret: setupIntentClientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#EEBA2B',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        // Chiudi solo se si clicca direttamente sull'overlay, non sugli iframe
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#EEBA2B]/10 rounded-lg">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#EEBA2B]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Aggiungi carta di credito</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            disabled={loading}
          >
            <X className="w-5 h-5 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading && !setupIntentClientSecret ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#EEBA2B] animate-spin mb-3 sm:mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Preparazione form di pagamento...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            <button
              onClick={createSetupIntent}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm w-full sm:w-auto"
            >
              Riprova
            </button>
          </div>
        ) : setupIntentClientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm 
              onSuccess={onSuccess} 
              onClose={onClose}
              professionalId={professionalId}
            />
          </Elements>
        ) : null}

        {/* Footer Info */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center px-2">
            I dati della carta sono gestiti in modo sicuro da Stripe. Non salviamo i numeri di carta completi.
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
