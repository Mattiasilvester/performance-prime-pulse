// src/components/partner/settings/PaymentsModal.tsx
// FASE A: Pagamenti e Fatturazione - Metodo di pagamento abbonamento PrimePro

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, CreditCard, Loader2, Download, AlertTriangle, Info, CheckCircle2, Clock, FileText, Edit, Trash2, Circle } from 'lucide-react';
import { getStripeErrorMessage } from '@/utils/stripeErrors';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { InvoicesCard } from '@/components/partner/subscription/InvoicesCard';
import AddStripeCardModal from './AddStripeCardModal';

interface PaymentsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentSettings {
  // Provider attivo
  payment_provider: 'stripe' | 'paypal' | null;
  
  // Dati comuni (per display)
  payment_method_last4: string | null;
  payment_method_brand: string | null; // 'visa', 'mastercard', 'amex', 'paypal'
  payment_method_exp_month: number | null; // Solo per carte
  payment_method_exp_year: number | null; // Solo per carte
  
  // Dati Stripe (se provider = 'stripe')
  stripe_customer_id: string | null;
  payment_method_id: string | null;
  
  // Dati PayPal (se provider = 'paypal')
  paypal_subscription_id: string | null;
  paypal_subscription_email: string | null;
  
  // Info abbonamento
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled';
  subscription_plan: 'basic' | 'pro' | 'advanced';
  subscription_trial_ends_at: string | null;
  subscription_current_period_end: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_pdf_url: string | null;
  invoice_date: string;
  paid_at: string | null;
}

const PLANS = {
  basic: { name: 'Basic', price: 25 },
  pro: { name: 'Prime Business', price: 50 },
  advanced: { name: 'Advanced', price: 50 },
};

// Componente PaymentMethodCard
interface PaymentMethodCardProps {
  settings: PaymentSettings;
  onAddCard: () => void;
  onEditCard: () => void;
  onRemoveCard: () => void;
}

const PaymentMethodCard = ({ 
  settings, 
  onAddCard, 
  onEditCard, 
  onRemoveCard 
}: PaymentMethodCardProps) => {
  // Se in dev e non c'è carta, mostra placeholder
  const isDev = import.meta.env.DEV;
  const cardData = settings.payment_method_last4 
    ? {
        last4: settings.payment_method_last4,
        brand: settings.payment_method_brand,
        expMonth: settings.payment_method_exp_month,
        expYear: settings.payment_method_exp_year,
      }
    : isDev 
      ? { last4: '4242', brand: 'visa', expMonth: 12, expYear: 2028 }
      : null;

  const hasPaymentMethod = settings.payment_provider && (
    (settings.payment_provider === 'stripe' && (settings.payment_method_last4 || cardData)) ||
    (settings.payment_provider === 'paypal' && settings.paypal_subscription_email)
  );
  
  const getBrandDisplay = (brand: string | null, provider: string | null) => {
    if (provider === 'paypal') return 'PayPal';
    
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
    };
    return brands[brand?.toLowerCase() || ''] || 'Carta';
  };

  if (!hasPaymentMethod) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <p className="font-semibold text-gray-900 mb-2">Nessuna carta salvata</p>
        <p className="text-sm text-gray-600 mb-4">
          Aggiungi una carta per attivare l'abbonamento al termine del periodo di prova gratuita.
        </p>
        <button
          onClick={onAddCard}
          className="bg-[#EEBA2B] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#d4a827] transition inline-flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Aggiungi carta
        </button>
      </div>
    );
  }

  // Usa dati reali o placeholder
  const displayLast4 = cardData?.last4 || settings.payment_method_last4 || '4242';
  const displayBrand = cardData?.brand || settings.payment_method_brand || 'visa';
  const displayExpMonth = (cardData?.expMonth || settings.payment_method_exp_month)?.toString().padStart(2, '0') || '12';
  const displayExpYear = (cardData?.expYear || settings.payment_method_exp_year)?.toString().slice(-2) || '28';
  const isPayPal = settings.payment_provider === 'paypal';
  const isPlaceholder = isDev && !settings.payment_method_last4 && cardData;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isPayPal ? (
            <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              PAY
            </div>
          ) : (
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {settings.payment_method_brand?.toUpperCase().slice(0, 4) || 'CARD'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isPayPal ? (
              <>
                <p className="font-semibold text-gray-900 text-lg">
                  PayPal
                </p>
                <p className="text-sm text-gray-500">
                  {settings.paypal_subscription_email}
                </p>
              </>
            ) : (
              <>
                <p className="font-mono font-semibold text-gray-900 text-lg">
                  •••• •••• •••• {displayLast4}
                  {isPlaceholder && <span className="ml-2 text-xs text-amber-600 font-normal">(Test)</span>}
                </p>
                <p className="text-sm text-gray-500">
                  {getBrandDisplay(displayBrand, settings.payment_provider)} • Scade {displayExpMonth}/{displayExpYear}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEditCard}
            className="p-2 text-gray-500 hover:text-[#EEBA2B] hover:bg-[#EEBA2B]/10 rounded-lg transition"
            title="Modifica"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={onRemoveCard}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Rimuovi"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente InvoicesList rimosso - ora usiamo InvoicesCard da subscription components

// Componente SubscriptionSection (FASE 2: Sezione Abbonamento completa)
export interface SubscriptionSectionProps {
  settings: PaymentSettings;
  onCancelSubscription: () => void;
}

export const SubscriptionSection = ({ settings, onCancelSubscription }: SubscriptionSectionProps) => {
  const plan = PLANS[settings.subscription_plan] || PLANS.pro;
  
  const getStatusBadge = () => {
    switch (settings.subscription_status) {
      case 'trial':
        return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, text: 'Periodo di prova' };
      case 'active':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle2, text: 'Attivo' };
      case 'past_due':
        return { color: 'bg-red-100 text-red-700', icon: AlertTriangle, text: 'Pagamento in ritardo' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-700', icon: X, text: 'Cancellato' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: Info, text: 'Sconosciuto' };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;
  
  // Calcola prossimo addebito (solo se active)
  const nextPaymentDate = settings.subscription_status === 'active' && settings.subscription_current_period_end
    ? new Date(settings.subscription_current_period_end).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Trial info
  const trialEndsAt = settings.subscription_trial_ends_at 
    ? new Date(settings.subscription_trial_ends_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Calcola giorni rimanenti nel trial
  const trialDaysRemaining = settings.subscription_status === 'trial' && settings.subscription_trial_ends_at
    ? Math.ceil(
        (new Date(settings.subscription_trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Mostra bottone cancella solo se active (non in trial)
  const showCancelButton = settings.subscription_status === 'active';

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
      {/* Piano e Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500 block mb-1">Piano attuale</span>
          <p className="font-semibold text-gray-900 text-lg">
            {plan.name} <span className="text-gray-500 font-normal text-base">(€{plan.price}/mese)</span>
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {status.text}
        </span>
      </div>

      {/* Prossimo Addebito (solo se active) */}
      {settings.subscription_status === 'active' && nextPaymentDate && (
        <div className="bg-gradient-to-r from-[#EEBA2B]/10 to-[#EEBA2B]/5 border-2 border-[#EEBA2B]/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prossimo addebito</p>
              <p className="text-lg font-bold text-gray-900">{nextPaymentDate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Importo</p>
              <p className="text-lg font-bold text-[#EEBA2B]">€{plan.price},00</p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Info */}
      {settings.subscription_status === 'trial' && trialEndsAt && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-medium mb-1">Periodo di prova attivo</p>
            <p className="text-sm text-blue-700">
              {trialDaysRemaining !== null && trialDaysRemaining > 0 ? (
                <>
                  <strong>{trialDaysRemaining} giorni</strong> rimanenti nel periodo di prova. 
                  Il periodo termina il <strong>{trialEndsAt}</strong>.
                </>
              ) : (
                <>
                  Il periodo di prova termina il <strong>{trialEndsAt}</strong>.
                </>
              )}
              {' '}Aggiungi un metodo di pagamento per continuare dopo la scadenza.
            </p>
          </div>
        </div>
      )}

      {/* Past Due Alert */}
      {settings.subscription_status === 'past_due' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium mb-1">Pagamento in ritardo</p>
            <p className="text-sm text-red-700 mb-3">
              Il pagamento dell'abbonamento è fallito. Aggiorna il metodo di pagamento per continuare a usare PrimePro.
            </p>
            <button className="text-sm text-red-700 font-medium hover:text-red-800 underline">
              Aggiorna metodo di pagamento
            </button>
          </div>
        </div>
      )}

      {/* Bottone Cancella (solo se active) */}
      {showCancelButton && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onCancelSubscription}
            className="w-full px-4 py-2.5 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 hover:border-red-400 transition flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancella Abbonamento
          </button>
        </div>
      )}
    </div>
  );
};

// Componente principale
export default function PaymentsModal({ onClose, onSuccess }: PaymentsModalProps) {
  const { user } = useAuth();
  // Usa useSubscription hook per ottenere fatture (include placeholder in dev)
  const { invoices, formatInvoiceAmount } = useSubscription();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({
    // Provider attivo
    payment_provider: null,
    // Dati comuni
    payment_method_last4: null,
    payment_method_brand: null,
    payment_method_exp_month: null,
    payment_method_exp_year: null,
    // Dati Stripe
    stripe_customer_id: null,
    payment_method_id: null,
    // Dati PayPal
    paypal_subscription_id: null,
    paypal_subscription_email: null,
    // Info abbonamento
    subscription_status: 'trial',
    subscription_plan: 'pro',
    subscription_trial_ends_at: null,
    subscription_current_period_end: null,
  });
  const [loading, setLoading] = useState(true);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Carica impostazioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]);

  const loadProfessionalId = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: unknown) {
      console.error('Errore caricamento professional_id:', error);
      if ((error as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento dei dati');
      }
    }
  };

  const fetchSettings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      
      // Carica dati da professional_subscriptions (dove sono salvati i dati Stripe)
      const { data: subscription, error: subError } = await supabase
        .from('professional_subscriptions')
        .select(`
          stripe_customer_id,
          payment_method_id,
          card_last4,
          card_brand,
          card_exp_month,
          card_exp_year,
          status,
          trial_end,
          current_period_end
        `)
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Errore fetch subscription:', subError);
      }

      // Determina payment_provider in base ai dati presenti
      let paymentProvider: 'stripe' | 'paypal' | null = null;
      if (subscription?.stripe_customer_id || subscription?.payment_method_id) {
        paymentProvider = 'stripe';
      }

      // Carica dati PayPal da professional_settings (se necessario in futuro)
      const { data: settings, error: settingsError } = await supabase
        .from('professional_settings')
        .select('paypal_subscription_id, paypal_subscription_email')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Errore fetch settings:', settingsError);
      }

      if (settings?.paypal_subscription_id || settings?.paypal_subscription_email) {
        paymentProvider = 'paypal';
      }

      // Determina subscription status
      let subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' = 'trial';
      if (subscription?.status) {
        if (subscription.status === 'trialing') subscriptionStatus = 'trial';
        else if (subscription.status === 'active') subscriptionStatus = 'active';
        else if (subscription.status === 'past_due') subscriptionStatus = 'past_due';
        else if (subscription.status === 'canceled') subscriptionStatus = 'cancelled';
      }

      setSettings({
        payment_provider: paymentProvider,
        // Dati comuni
        payment_method_last4: subscription?.card_last4 || null,
        payment_method_brand: subscription?.card_brand || null,
        payment_method_exp_month: subscription?.card_exp_month || null,
        payment_method_exp_year: subscription?.card_exp_year || null,
        // Dati Stripe
        stripe_customer_id: subscription?.stripe_customer_id || null,
        payment_method_id: subscription?.payment_method_id || null,
        // Dati PayPal
        paypal_subscription_id: settings?.paypal_subscription_id || null,
        paypal_subscription_email: settings?.paypal_subscription_email || null,
        // Info abbonamento
        subscription_status: subscriptionStatus,
        subscription_plan: 'pro', // Default, può essere recuperato da subscription se necessario
        subscription_trial_ends_at: subscription?.trial_end || null,
        subscription_current_period_end: subscription?.current_period_end || null,
      });
    } catch (err: unknown) {
      console.error('Errore fetch settings abbonamento:', err);
      toast.error('Errore nel caricamento delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  // fetchInvoices rimosso - ora usiamo useSubscription hook

  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false);
  const [showAddStripeCardModal, setShowAddStripeCardModal] = useState(false);

  const handleAddCard = () => {
    setShowAddPaymentMethodModal(true);
  };

  const handleSelectPaymentMethod = (provider: 'stripe' | 'paypal') => {
    setShowAddPaymentMethodModal(false);
    if (provider === 'stripe') {
      // Apri modal Stripe per aggiungere carta
      setShowAddStripeCardModal(true);
    } else if (provider === 'paypal') {
      toast.info('Integrazione PayPal in arrivo! Contattaci per maggiori informazioni.');
    }
  };

  const handleStripeCardSuccess = () => {
    // Ricarica le impostazioni dopo aver aggiunto la carta
    fetchSettings();
    onSuccess();
  };

  const handleEditCard = () => {
    // Per ora, per modificare la carta, l'utente deve rimuoverla e aggiungerne una nuova
    // In futuro possiamo implementare un flusso di modifica con Stripe
    if (settings.payment_provider === 'stripe') {
      setShowAddStripeCardModal(true);
    } else {
      toast.info('Integrazione Stripe in arrivo! Contattaci per maggiori informazioni.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    // Modal conferma con opzioni
    const cancelAtPeriodEnd = window.confirm(
      'Vuoi cancellare l\'abbonamento?\n\n' +
      'OK = Cancella alla fine del periodo corrente (consigliato)\n' +
      'Annulla = Cancella immediatamente'
    );

    if (!cancelAtPeriodEnd) {
      // Cancella immediatamente
      const confirmed = window.confirm(
        'Sei sicuro di voler cancellare l\'abbonamento immediatamente? ' +
        'Perderai l\'accesso a PrimePro subito.'
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);
      
      // Chiama Edge Function per cancellare subscription
      const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: {
          cancel_immediately: !cancelAtPeriodEnd, // true = cancella subito, false = fine periodo
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Errore durante la cancellazione');
      }

      toast.success(
        cancelAtPeriodEnd 
          ? 'Abbonamento verrà cancellato alla fine del periodo corrente.'
          : 'Abbonamento cancellato immediatamente.'
      );
      
      fetchSettings(); // Ricarica dati
    } catch (err: unknown) {
      console.error('Errore cancellazione subscription:', err);
      toast.error(getStripeErrorMessage(err as { code?: string; message?: string }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = async () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    const confirmed = window.confirm(
      'Sei sicuro di voler rimuovere il metodo di pagamento? Non potrai più pagare l\'abbonamento automaticamente.'
    );
    
    if (!confirmed) return;

    try {
      // Rimuovi payment method da professional_subscriptions
      const { error: subError } = await supabase
        .from('professional_subscriptions')
        .update({
          payment_method_id: null,
          card_last4: null,
          card_brand: null,
          card_exp_month: null,
          card_exp_year: null,
          updated_at: new Date().toISOString(),
        })
        .eq('professional_id', professionalId);

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Rimuovi anche da professional_settings se presente
      const { error: settingsError } = await supabase
        .from('professional_settings')
        .update({
          payment_provider: null,
          payment_method_id: null,
          payment_method_last4: null,
          payment_method_brand: null,
          payment_method_exp_month: null,
          payment_method_exp_year: null,
          paypal_subscription_id: null,
          paypal_subscription_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq('professional_id', professionalId);

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.warn('Errore rimozione da professional_settings:', settingsError);
        // Non bloccare se c'è errore qui, i dati principali sono in professional_subscriptions
      }
      
      setSettings(prev => ({
        ...prev,
        payment_provider: null,
        payment_method_id: null,
        payment_method_last4: null,
        payment_method_brand: null,
        payment_method_exp_month: null,
        payment_method_exp_year: null,
        paypal_subscription_id: null,
        paypal_subscription_email: null,
      }));
      
      toast.success('Metodo di pagamento rimosso con successo');
      fetchSettings();
    } catch (err: unknown) {
      console.error('Errore rimozione metodo pagamento:', err);
      toast.error('Errore durante la rimozione del metodo di pagamento');
    }
  };

  // Modal per selezionare metodo di pagamento
  const AddPaymentMethodModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (provider: 'stripe' | 'paypal') => void }) => {
    if (!isOpen) return null;

    const modalContent = (
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Scegli metodo di pagamento</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Seleziona il metodo di pagamento che vuoi utilizzare per l'abbonamento PrimePro.
          </p>

          <div className="space-y-3">
            {/* Carta Stripe */}
            <button
              onClick={() => onSelect('stripe')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#EEBA2B] hover:bg-[#EEBA2B]/5 transition text-left flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-[#EEBA2B] transition">Carta di credito/debito</p>
                <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
              </div>
              <X className="w-5 h-5 text-gray-400 rotate-45 group-hover:text-[#EEBA2B] transition" />
            </button>

            {/* PayPal */}
            <button
              onClick={() => onSelect('paypal')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#EEBA2B] hover:bg-[#EEBA2B]/5 transition text-left flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Circle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-[#EEBA2B] transition">PayPal</p>
                <p className="text-sm text-gray-500">Paga con il tuo account PayPal</p>
              </div>
              <X className="w-5 h-5 text-gray-400 rotate-45 group-hover:text-[#EEBA2B] transition" />
            </button>
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' 
      ? createPortal(modalContent, document.body)
      : null;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        style={{ 
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: '24px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
              <CreditCard className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pagamenti e Fatturazione</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - scrollabile */}
        <div 
          style={{ 
            flex: 1,
            overflowY: 'scroll',
            minHeight: 0,
            padding: '24px'
          }}
        >
          <p className="text-sm text-gray-600 mb-6">
            Gestisci il metodo di pagamento per il tuo abbonamento PrimePro e scarica le tue fatture.
          </p>

          {/* Sezione Metodo di Pagamento */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Metodo di Pagamento</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              La carta verrà utilizzata per il pagamento del tuo abbonamento PrimePro.
            </p>
            
            {loading ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Caricamento...</p>
              </div>
            ) : (
              <PaymentMethodCard
                settings={settings}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onRemoveCard={handleRemoveCard}
              />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Sezione Storico Fatture */}
          <div className="mb-6">
            {/* Usa InvoicesCard per coerenza con pagina Abbonamento */}
            {/* InvoicesCard ha già il suo header interno con icona e titolo */}
            <InvoicesCard
              invoices={invoices}
              formatInvoiceAmount={formatInvoiceAmount}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Sezione Info Abbonamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                <Info className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Abbonamento</h3>
            </div>
            <SubscriptionSection settings={settings} onCancelSubscription={handleCancelSubscription} />
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizza usando Portal direttamente nel body
  return (
    <>
      {typeof document !== 'undefined' 
        ? createPortal(modalContent, document.body)
        : modalContent}
      <AddPaymentMethodModal
        isOpen={showAddPaymentMethodModal}
        onClose={() => setShowAddPaymentMethodModal(false)}
        onSelect={handleSelectPaymentMethod}
      />

      {/* Modal aggiunta carta Stripe */}
      {professionalId && (
        <AddStripeCardModal
          isOpen={showAddStripeCardModal}
          onClose={() => setShowAddStripeCardModal(false)}
          onSuccess={handleStripeCardSuccess}
          professionalId={professionalId}
        />
      )}
    </>
  );
}
