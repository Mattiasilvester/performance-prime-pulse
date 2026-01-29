// Pagina Abbonamento - Mostra informazioni abbonamento PrimePro
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialUrgencyBanner } from '@/components/partner/subscription/TrialUrgencyBanner';
import { ActivePlanCard } from '@/components/partner/subscription/ActivePlanCard';
import { PaymentMethodCard } from '@/components/partner/subscription/PaymentMethodCard';
import { InvoicesCard } from '@/components/partner/subscription/InvoicesCard';
import { ManageSubscriptionCard } from '@/components/partner/subscription/ManageSubscriptionCard';
import { SubscriptionFAQ } from '@/components/partner/subscription/SubscriptionFAQ';
import AddStripeCardModal from '@/components/partner/settings/AddStripeCardModal';
import { getStripeErrorMessage } from '@/utils/stripeErrors';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Features del piano Prime Business
const PLAN_FEATURES = [
  'Clienti illimitati',
  'Calendario avanzato con sincronizzazione',
  'Gestione prenotazioni online',
  'Profilo pubblico su Prime Pro Finder',
  'Analytics e statistiche avanzate',
  'Notifiche push e email',
  'Supporto prioritario',
];

export default function AbbonamentoPage() {
  const { user } = useAuth();
  const {
    subscription,
    invoices,
    loading,
    error,
    refetch,
    getTrialDaysRemaining,
    getTrialProgress,
    formatPrice,
    formatInvoiceAmount,
  } = useSubscription();

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Carica professional_id
  React.useEffect(() => {
    const loadProfessionalId = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setProfessionalId(data.id);
      } catch (err) {
        console.error('Errore caricamento professional_id:', err);
      }
    };
    loadProfessionalId();
  }, [user]);

  // Formatta data trial end
  const formatTrialEndDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Gestione aggiunta/modifica carta
  const handleAddCard = () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }
    setShowAddCardModal(true);
  };

  const handleCardSuccess = () => {
    refetch();
    setShowAddCardModal(false);
  };

  // Gestione cancellazione abbonamento
  // Il componente ManageSubscriptionCard gestisce il modal di conferma
  // Cancelliamo sempre alla fine del periodo (opzione più sicura)
  const handleCancelSubscription = async (cancellationReason: string) => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    if (!subscription) {
      toast.error('Nessun abbonamento attivo');
      return;
    }

    // Determina quale endpoint chiamare in base al provider
    const isPayPal = subscription.payment_provider === 'paypal';
    const endpoint = isPayPal ? 'paypal-cancel-subscription' : 'stripe-cancel-subscription';

    if (isPayPal) {
      // PayPal non richiede motivo cancellazione
      try {
        const { data, error } = await supabase.functions.invoke(endpoint, {
          body: {
            reason: 'Cancellation requested by user',
          },
        });

        if (error) throw error;
        if (!data?.success) {
          throw new Error(data?.error || 'Errore durante la cancellazione');
        }

        toast.success('Abbonamento PayPal cancellato con successo.');
        refetch();
      } catch (err: any) {
        console.error('Errore cancellazione subscription PayPal:', err);
        toast.error(err.message || 'Errore durante la cancellazione');
        throw err;
      }
    } else {
      // Stripe richiede motivo cancellazione
      if (!cancellationReason || !cancellationReason.trim()) {
        toast.error('Il motivo della cancellazione è obbligatorio');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke(endpoint, {
          body: {
            cancel_immediately: false, // Sempre alla fine del periodo (più sicuro)
            cancellation_reason: cancellationReason.trim(),
          },
        });

        if (error) throw error;
        if (!data?.success) {
          throw new Error(data?.error || 'Errore durante la cancellazione');
        }

        // Messaggio con data esatta se disponibile
        const cancelDate = subscription?.current_period_end 
          ? new Date(subscription.current_period_end).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'fine del periodo corrente';
        
        toast.success(`Abbonamento verrà cancellato il ${cancelDate}. Continuerai ad avere accesso fino a quella data.`);
        refetch();
      } catch (err: any) {
        console.error('Errore cancellazione subscription Stripe:', err);
        toast.error(getStripeErrorMessage(err));
        throw err; // Rilancia l'errore per gestirlo nel componente
      }
    }
  };

  // Gestione riattivazione abbonamento
  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      console.error('[REACTIVATE] stripe_subscription_id mancante:', subscription);
      toast.error('Nessun abbonamento da riattivare');
      return;
    }

    if (!subscription.cancel_at_period_end) {
      toast.error('L\'abbonamento non è in stato di cancellazione programmata');
      return;
    }

    console.log('[REACTIVATE] Chiamata Edge Function con:', {
      subscription_id: subscription.stripe_subscription_id,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    try {
      const { data, error } = await supabase.functions.invoke('stripe-reactivate-subscription', {
        body: {
          subscription_id: subscription.stripe_subscription_id,
        },
      });

      console.log('[REACTIVATE] Risposta Edge Function:', { data, error });

      if (error) {
        console.error('[REACTIVATE] Errore dalla Edge Function:', error);
        throw error;
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || 'Errore durante la riattivazione';
        console.error('[REACTIVATE] Risposta non success:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('[REACTIVATE] Riattivazione completata con successo');
      toast.success('Abbonamento riattivato con successo!');
      refetch();
    } catch (err: any) {
      console.error('[REACTIVATE] Errore completo riattivazione subscription:', err);
      const errorMessage = err?.message || err?.error || 'Errore durante la riattivazione';
      toast.error(errorMessage);
      throw err; // Rilancia l'errore per gestirlo nel componente
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#EEBA2B]/10 rounded-lg">
            <CreditCard className="w-6 h-6 text-[#EEBA2B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Abbonamento</h1>
        </div>
        <p className="text-gray-600">
          Gestisci il tuo abbonamento PrimePro e visualizza le informazioni di pagamento.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#EEBA2B] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento informazioni abbonamento...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : !subscription ? (
        /* No Subscription State */
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun abbonamento attivo</h2>
          <p className="text-gray-600 mb-6">
            Non hai ancora un abbonamento attivo. Contatta il supporto per attivare il tuo abbonamento PrimePro.
          </p>
        </div>
      ) : (
        /* Content con Subscription */
        <>
          {/* Banner Urgenza Trial */}
          {subscription.status === 'trialing' && (
            <TrialUrgencyBanner
              daysRemaining={getTrialDaysRemaining()}
              onAddCard={handleAddCard}
              hasCard={!!subscription.card_last4}
            />
          )}

          {/* Card Piano Attivo */}
          <ActivePlanCard
            planName="Prime Business"
            price={formatPrice(subscription.price_cents && subscription.price_cents >= 5000 ? subscription.price_cents : 5000)}
            status={subscription.status}
            trialDaysRemaining={subscription.status === 'trialing' ? getTrialDaysRemaining() : undefined}
            trialEndDate={subscription.trial_end ? formatTrialEndDate(subscription.trial_end) : undefined}
            trialProgress={subscription.status === 'trialing' ? getTrialProgress() : undefined}
            features={PLAN_FEATURES}
            paymentProvider={subscription.payment_provider || 'stripe'}
          />

          {/* Card Metodo di Pagamento */}
          <PaymentMethodCard
            cardLast4={subscription.card_last4}
            cardBrand={subscription.card_brand}
            cardExpMonth={subscription.card_exp_month}
            cardExpYear={subscription.card_exp_year}
            onAddCard={handleAddCard}
            onEditCard={handleAddCard}
            onUpdate={() => refetch()} // Aggiorna dati dopo modifica carta
          />

          {/* Card Storico Fatture */}
          <InvoicesCard
            invoices={invoices}
            formatInvoiceAmount={formatInvoiceAmount}
          />

          {/* Card Gestione Abbonamento */}
          {(subscription.status === 'active' || 
            subscription.status === 'trialing' || 
            subscription.status === 'incomplete' || 
            subscription.status === 'past_due' || 
            subscription.cancel_at_period_end) && (
            <ManageSubscriptionCard
              status={subscription.status}
              cancelAtPeriodEnd={subscription.cancel_at_period_end}
              currentPeriodEnd={subscription.current_period_end || undefined}
              onCancelSubscription={handleCancelSubscription}
              onReactivateSubscription={handleReactivateSubscription}
            />
          )}

          {/* Card FAQ */}
          <SubscriptionFAQ />
        </>
      )}

      {/* Modal Aggiunta Carta */}
      {professionalId && (
        <AddStripeCardModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={handleCardSuccess}
          professionalId={professionalId}
        />
      )}
    </div>
  );
}
