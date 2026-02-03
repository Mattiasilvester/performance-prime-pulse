import React, { useState, useEffect } from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialUrgencyBanner } from '@/components/partner/subscription/TrialUrgencyBanner';
import { ActivePlanCard } from '@/components/partner/subscription/ActivePlanCard';
import { PaymentMethodCard } from '@/components/partner/subscription/PaymentMethodCard';
import { InvoicesCard } from '@/components/partner/subscription/InvoicesCard';
import { ManageSubscriptionCard } from '@/components/partner/subscription/ManageSubscriptionCard';
import { SubscriptionFAQ } from '@/components/partner/subscription/SubscriptionFAQ';
import AddStripeCardModal from '@/components/partner/settings/AddStripeCardModal';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { useAuth } from '@pp/shared';
import { getStripeErrorMessage } from '@/utils/stripeErrors';

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

export default function Abbonamento() {
  const { user } = useAuth();
  const { 
    subscription, 
    invoices, 
    loading, 
    error,
    getTrialDaysRemaining,
    getTrialProgress,
    isTrialExpiringSoon,
    formatPrice,
    formatInvoiceAmount,
    refetch,
  } = useSubscription();

  const [showCardModal, setShowCardModal] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string | undefined>(undefined);

  // Carica professional_id e nome
  useEffect(() => {
    const loadProfessional = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('professionals')
          .select('id, first_name, last_name, company_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setProfessionalId(data.id);
          // Usa company_name se disponibile, altrimenti first_name + last_name
          const name = data.company_name || 
            (data.first_name && data.last_name 
              ? `${data.first_name} ${data.last_name}` 
              : data.first_name || data.last_name || undefined);
          setProfessionalName(name);
        }
      } catch (err) {
        console.error('Errore caricamento professional:', err);
      }
    };
    loadProfessional();
  }, [user]);

  // Formatta la data per visualizzazione
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Gestisce la cancellazione dell'abbonamento
  const handleCancelSubscription = async () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: {
          cancel_immediately: false, // Sempre alla fine del periodo (più sicuro)
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Errore durante la cancellazione');
      }

      toast.success('Abbonamento verrà cancellato alla fine del periodo corrente.');
      refetch();
    } catch (err: unknown) {
      console.error('Errore cancellazione subscription:', err);
      toast.error(getStripeErrorMessage(err as { code?: string; message?: string }));
      throw err;
    }
  };

  // Gestisce la riattivazione dell'abbonamento
  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      toast.error('Nessun abbonamento da riattivare');
      return;
    }

    try {
      // Nota: Questa funzione Edge Function potrebbe non esistere ancora
      // Se non esiste, il componente ManageSubscriptionCard non mostrerà il bottone di riattivazione
      const { data, error } = await supabase.functions.invoke('stripe-reactivate-subscription', {
        body: {
          subscription_id: subscription.stripe_subscription_id,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Errore durante la riattivazione');
      }

      toast.success('Abbonamento riattivato con successo!');
      refetch();
    } catch (err: unknown) {
      console.error('Errore riattivazione:', err);
      toast.error(err instanceof Error ? err.message : 'Errore durante la riattivazione');
    }
  };

  // Callback dopo aggiunta carta
  const handleCardAdded = () => {
    setShowCardModal(false);
    toast.success('Metodo di pagamento aggiunto con successo!');
    refetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Caricamento abbonamento...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-700 font-medium">Errore nel caricamento</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Nessun abbonamento
  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Abbonamento</h1>
            <p className="text-gray-600 mt-1">Gestisci il tuo piano e la fatturazione</p>
          </div>

          {/* No subscription card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#EEBA2B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun abbonamento attivo
            </h2>
            <p className="text-gray-600 mb-6">
              Attiva Prime Business per sbloccare tutte le funzionalità premium e far crescere la tua attività.
            </p>
            {professionalId && (
              <button
                onClick={() => setShowCardModal(true)}
                className="px-6 py-3 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#d4a826] transition-colors"
              >
                Inizia la prova gratuita
              </button>
            )}
          </div>

          {/* FAQ anche senza abbonamento */}
          <div className="mt-6">
            <SubscriptionFAQ />
          </div>
        </div>

        {/* Modal aggiunta carta */}
        {professionalId && (
          <AddStripeCardModal
            isOpen={showCardModal}
            onClose={() => setShowCardModal(false)}
            onSuccess={handleCardAdded}
            professionalId={professionalId}
          />
        )}
      </div>
    );
  }

  // Calcola valori per il render
  const trialDaysRemaining = getTrialDaysRemaining();
  const trialProgress = getTrialProgress();
  const hasCard = Boolean(subscription.card_last4);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Abbonamento</h1>
          <p className="text-gray-600 mt-1">Gestisci il tuo piano e la fatturazione</p>
        </div>

        {/* Banner urgenza trial */}
        {subscription.status === 'trialing' && isTrialExpiringSoon() && (
          <TrialUrgencyBanner
            daysRemaining={trialDaysRemaining}
            onAddCard={() => setShowCardModal(true)}
            hasCard={hasCard}
          />
        )}

        {/* Grid layout */}
        <div className="space-y-6">
          {/* Card Piano Attivo */}
          <ActivePlanCard
            planName="Prime Business"
            price={formatPrice(subscription.price_cents && subscription.price_cents >= 5000 ? subscription.price_cents : 5000)}
            status={subscription.status}
            trialDaysRemaining={subscription.status === 'trialing' ? trialDaysRemaining : undefined}
            trialEndDate={subscription.trial_end ? formatDate(subscription.trial_end) : undefined}
            trialProgress={subscription.status === 'trialing' ? trialProgress : undefined}
            features={PLAN_FEATURES}
          />

          {/* Card Metodo di Pagamento */}
          <PaymentMethodCard
            cardLast4={subscription.card_last4}
            cardBrand={subscription.card_brand}
            cardExpMonth={subscription.card_exp_month}
            cardExpYear={subscription.card_exp_year}
            onAddCard={() => setShowCardModal(true)}
            onEditCard={() => setShowCardModal(true)}
          />

          {/* Card Storico Fatture */}
          <InvoicesCard
            invoices={invoices}
            formatInvoiceAmount={formatInvoiceAmount}
            professionalName={professionalName}
          />

          {/* Card Gestione Abbonamento */}
          {(subscription.status === 'active' || subscription.status === 'trialing' || subscription.cancel_at_period_end) && (
            <ManageSubscriptionCard
              status={subscription.status}
              cancelAtPeriodEnd={subscription.cancel_at_period_end || false}
              currentPeriodEnd={subscription.current_period_end || undefined}
              onCancelSubscription={handleCancelSubscription}
              onReactivateSubscription={handleReactivateSubscription}
            />
          )}

          {/* FAQ */}
          <SubscriptionFAQ />
        </div>
      </div>

      {/* Modal aggiunta/modifica carta */}
      {professionalId && (
        <AddStripeCardModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          onSuccess={handleCardAdded}
          professionalId={professionalId}
        />
      )}
    </div>
  );
}
