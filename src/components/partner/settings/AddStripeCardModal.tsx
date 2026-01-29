// Componente per aggiungere carta di credito con Stripe Elements
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { createCustomerAndSetupIntent, createSubscription } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';
import { getStripeErrorMessage } from '@/utils/stripeErrors';
import { PaymentProviderSelector } from '@/components/partner/subscription/PaymentProviderSelector';
import { PayPalSubscriptionButton } from '@/components/partner/subscription/PayPalSubscriptionButton';
import { isPayPalConfigured } from '@/lib/paypal';

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
  const [professionalName, setProfessionalName] = useState<string | null>(null);
  const [professionalEmail, setProfessionalEmail] = useState<string | null>(null);
  const [professionalPhone, setProfessionalPhone] = useState<string | null>(null);

  // Carica dati professionista per billing details (name, email, phone richiesti da Stripe quando billingDetails: 'never')
  useEffect(() => {
    const loadProfessionalData = async () => {
      try {
        const { data, error } = await supabase
          .from('professionals')
          .select('first_name, last_name, company_name, email, phone, vat_address, vat_postal_code, vat_city')
          .eq('id', professionalId)
          .maybeSingle();

        if (error) {
          console.error('[STRIPE] Errore caricamento dati professionista:', error);
          return;
        }

        if (data) {
          // Usa company_name se disponibile, altrimenti first_name + last_name
          const name = data.company_name || 
            (data.first_name && data.last_name 
              ? `${data.first_name} ${data.last_name}` 
              : data.first_name || data.last_name || null);
          setProfessionalName(name);
          setProfessionalEmail(data.email || null);
          setProfessionalPhone(data.phone || null);
        }
      } catch (err) {
        console.error('[STRIPE] Errore caricamento dati professionista:', err);
      }
    };

    loadProfessionalData();
  }, [professionalId]);


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
      // Con billingDetails: 'auto', Stripe mostra i campi necessari e l'utente può inserirli
      // Possiamo comunque pre-compilare i campi con i dati del professionista se disponibili
      const confirmParams: any = {
        return_url: window.location.origin + '/partner/dashboard/impostazioni',
      };

      // Pre-compila billing details con dati del professionista (opzionale ma migliora UX)
      const billingDetails: any = {};
      if (professionalName) {
        billingDetails.name = professionalName;
      }
      if (professionalEmail) {
        billingDetails.email = professionalEmail;
      }
      if (professionalPhone) {
        billingDetails.phone = professionalPhone;
      }

      // Passa billing details solo se abbiamo almeno un campo (pre-compila i campi nel form)
      if (Object.keys(billingDetails).length > 0) {
        confirmParams.payment_method_data = {
          billing_details: billingDetails,
        };
      }

      // Conferma il SetupIntent
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams,
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
        console.error('[STRIPE] ERRORE: Payment method ID non trovato nel SetupIntent:', {
          setupIntent: setupIntent,
          payment_method: setupIntent.payment_method,
          type: typeof setupIntent.payment_method,
        });
        throw new Error('Payment method ID non trovato');
      }

      console.log('[STRIPE] ✅ SetupIntent confermato:', {
        setupIntentId: setupIntent.id,
        paymentMethodId,
        status: setupIntent.status,
        // customer sarà disponibile dopo retrieveSetupIntent
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
        console.log('[STRIPE] Dettagli payment method dal SetupIntent:', {
          last4: pmDetails.card?.last4,
          brand: pmDetails.card?.brand,
        });
      } else {
        // Se è solo un ID, chiamiamo Edge Function per recuperare i dettagli
        console.log('[STRIPE] Payment method è solo un ID, recupero dettagli tramite Edge Function...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-list-payment-methods`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              // Trova il payment method con l'ID corrispondente
              const foundPM = data.payment_methods?.find((pm: any) => pm.id === paymentMethodId);
              if (foundPM) {
                // I dettagli dalla lista sono già formattati
                pmDetails = {
                  card: {
                    last4: foundPM.card_last4,
                    brand: foundPM.card_brand,
                    exp_month: foundPM.card_exp_month,
                    exp_year: foundPM.card_exp_year,
                  },
                };
                console.log('[STRIPE] Dettagli payment method recuperati dalla lista:', {
                  last4: pmDetails.card?.last4,
                  brand: pmDetails.card?.brand,
                });
              }
            }
          }
        } catch (pmError: any) {
          console.error('[STRIPE] Errore recupero dettagli payment method:', pmError);
          // Continua comunque, salveremo almeno l'ID e i dettagli verranno aggiornati dal webhook
        }
      }

      // Estrai dettagli carta
      const cardLast4 = pmDetails?.card?.last4 || null;
      const cardBrand = pmDetails?.card?.brand || null;
      const cardExpMonth = pmDetails?.card?.exp_month || null;
      const cardExpYear = pmDetails?.card?.exp_year || null;

      // Salva nel database professional_subscriptions
      console.log('[STRIPE] 🔍 Verifica subscription esistente per professional_id:', professionalId);
      const { data: existingSubscription, error: subError } = await supabase
        .from('professional_subscriptions')
        .select('id, stripe_customer_id, payment_method_id')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('[STRIPE] ❌ Errore verifica subscription esistente:', subError);
        throw subError;
      }

      console.log('[STRIPE] 📊 Subscription esistente:', {
        exists: !!existingSubscription,
        id: existingSubscription?.id,
        current_payment_method_id: existingSubscription?.payment_method_id,
      });

      // Recupera stripe_customer_id dal SetupIntent se non esiste nel record
      let customerId = existingSubscription?.stripe_customer_id;
      // Type assertion per accedere a customer (presente in SetupIntent ma non nel tipo TypeScript)
      const setupIntentWithCustomer = setupIntentData as any;
      if (!customerId && setupIntentWithCustomer.customer) {
        customerId = typeof setupIntentWithCustomer.customer === 'string' 
          ? setupIntentWithCustomer.customer 
          : setupIntentWithCustomer.customer.id;
        console.log('[STRIPE] Customer ID recuperato dal SetupIntent:', customerId);
      }

      // Aggiorna o crea subscription record
      const updateData: any = {
        professional_id: professionalId,
        payment_method_id: paymentMethodId,
        updated_at: new Date().toISOString(),
      };

      // Aggiungi customer_id se disponibile
      if (customerId) {
        updateData.stripe_customer_id = customerId;
      }

      // Aggiungi dettagli carta (sempre, anche se null - così vediamo cosa manca)
      updateData.card_last4 = cardLast4;
      updateData.card_brand = cardBrand;
      updateData.card_exp_month = cardExpMonth;
      updateData.card_exp_year = cardExpYear;

      console.log('[STRIPE] 💾 Dati da salvare:', {
        professional_id: professionalId,
        payment_method_id: paymentMethodId,
        stripe_customer_id: customerId || 'non disponibile',
        card_last4: cardLast4 || 'non disponibile',
        card_brand: cardBrand || 'non disponibile',
        operation: existingSubscription ? 'UPDATE' : 'INSERT',
      });

      // Usa Edge Function per bypassare RLS
      console.log('[STRIPE] 🔄 Chiamata Edge Function per salvare payment method...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessione non valida');
      }

      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'stripe-update-payment-method',
        {
          body: {
            professional_id: professionalId,
            payment_method_id: paymentMethodId,
            stripe_customer_id: customerId || null,
            card_last4: cardLast4 || null,
            card_brand: cardBrand || null,
            card_exp_month: cardExpMonth || null,
            card_exp_year: cardExpYear || null,
          },
        }
      );

      if (edgeFunctionError) {
        console.error('[STRIPE] ❌ Errore Edge Function:', edgeFunctionError);
        throw new Error(edgeFunctionError.message || 'Errore durante il salvataggio del payment method');
      }

      if (!edgeFunctionData || !edgeFunctionData.success) {
        console.error('[STRIPE] ❌ Edge Function fallita:', edgeFunctionData);
        throw new Error(edgeFunctionData?.error || 'Errore durante il salvataggio del payment method');
      }

      console.log('[STRIPE] ✅ Payment method salvato con successo:', {
        subscription_id: edgeFunctionData.subscription?.id,
        payment_method_id: edgeFunctionData.subscription?.payment_method_id,
        card_last4: edgeFunctionData.subscription?.card_last4,
        card_brand: edgeFunctionData.subscription?.card_brand,
      });

      console.log('[STRIPE] Payment method salvato nel database:', {
        paymentMethodId,
        customerId: customerId || 'non disponibile',
        last4: cardLast4 || 'non disponibile',
        brand: cardBrand || 'non disponibile',
        expMonth: cardExpMonth || 'non disponibile',
        expYear: cardExpYear || 'non disponibile',
      });

      // FASE 1: Verifica se trial è scaduto e crea subscription automaticamente
      const { data: subscriptionData, error: trialCheckError } = await supabase
        .from('professional_subscriptions')
        .select('trial_end, status')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (!trialCheckError && subscriptionData?.trial_end) {
        const trialEnd = new Date(subscriptionData.trial_end);
        const now = new Date();
        const isTrialExpired = now > trialEnd;

        // Se trial scaduto e status è ancora 'trialing', crea subscription automaticamente
        if (isTrialExpired && subscriptionData.status === 'trialing') {
          try {
            console.log('[STRIPE] Trial scaduto, creazione subscription automatica...');
            toast.info('Creazione abbonamento in corso...');
            await createSubscription();
            toast.success('Abbonamento attivato con successo!');
          } catch (err: any) {
            console.error('[STRIPE] Errore creazione subscription:', err);
            const errorMessage = getStripeErrorMessage(err);
            toast.error(errorMessage);
            // Non bloccare, la carta è stata salvata comunque
          }
        }
      }

      toast.success('Carta aggiunta con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[STRIPE] Errore salvataggio carta:', err);
      const errorMessage = getStripeErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
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
          zIndex: 100000,  // Più alto del modal per assicurare che gli iframe siano sopra
        }}
      >
        <PaymentElement 
          options={{
            fields: {
              billingDetails: 'auto', // 'auto' mostra i campi necessari, più user-friendly di 'never'
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
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal'>('stripe');

  // Crea SetupIntent quando il modal si apre (solo se Stripe è selezionato)
  useEffect(() => {
    if (isOpen && !setupIntentClientSecret && selectedProvider === 'stripe') {
      createSetupIntent();
    }
  }, [isOpen, selectedProvider]);

  // Fix mobile: gestisci scroll body quando modal è aperto
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (isMobile) {
      // Su mobile, blocca scroll body quando modal è aperto
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        // Ripristina scroll quando modal si chiude
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
      };
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
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.5)',
        // Fix mobile: previeni scroll del body quando modal è aperto
        ...(typeof window !== 'undefined' && window.innerWidth < 768 && {
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }),
      }}
      onClick={(e) => {
        // Chiudi solo se si clicca direttamente sull'overlay, non sugli iframe
        const target = e.target as HTMLElement;
        // NON chiudere se si clicca su iframe Stripe o container Stripe
        if (target.closest('iframe[src*="js.stripe.com"]') || 
            target.closest('iframe[src*="hooks.stripe.com"]') ||
            target.closest('[class*="p-PaymentElement"]') ||
            target.closest('[class*="p-Input"]') ||
            target.closest('[class*="StripeElement"]')) {
          return; // Non chiudere, lascia gestire l'evento all'iframe
        }
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={(e) => {
        // Su mobile, non interferire con touch events sugli iframe Stripe
        const target = e.target as HTMLElement;
        if (target.closest('iframe[src*="js.stripe.com"]') || 
            target.closest('iframe[src*="hooks.stripe.com"]') ||
            target.closest('[class*="p-PaymentElement"]') ||
            target.closest('[class*="p-Input"]') ||
            target.closest('[class*="StripeElement"]')) {
          // Lascia passare l'evento all'iframe
          return;
        }
      }}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6"
        style={{
          // Fix mobile: su mobile usa overflow-visible per evitare offset coordinate touch con iframe Stripe
          ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
            maxHeight: 'none',
            overflowY: 'visible',
            height: 'auto',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
          } : {
            maxHeight: '95vh',
            overflowY: 'auto',
          }),
        }}
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

        {/* Selettore Provider (solo se PayPal è configurato) */}
        {isPayPalConfigured() && (
          <div className="mb-6">
            <PaymentProviderSelector
              selectedProvider={selectedProvider}
              onSelect={setSelectedProvider}
              disabled={loading}
            />
          </div>
        )}

        {/* Content */}
        {selectedProvider === 'stripe' ? (
          <>
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
          </>
        ) : (
          /* PayPal Button */
          <div className="py-4">
            <PayPalSubscriptionButton
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onError={(error) => {
                console.error('PayPal error:', error);
              }}
            />
          </div>
        )}

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
