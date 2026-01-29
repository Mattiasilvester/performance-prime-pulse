import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import type { Subscription } from '@/hooks/useSubscription';

interface TrialExpiredGateProps {
  subscription: Subscription | null;
  loading: boolean;
  children: ReactNode;
}

const ABBONAMENTO_PATH = '/partner/dashboard/abbonamento';

function isTrialExpiredNoPayment(sub: Subscription): boolean {
  if (sub.status !== 'trialing' || !sub.trial_end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(sub.trial_end);
  end.setHours(0, 0, 0, 0);
  if (end.getTime() > today.getTime()) return false; // trial non ancora scaduto
  const hasPayment =
    (sub.stripe_customer_id && sub.card_last4) || sub.paypal_subscription_id;
  return !hasPayment;
}

export function TrialExpiredGate({ subscription, loading, children }: TrialExpiredGateProps) {
  const location = useLocation();
  const isOnAbbonamentoPage = location.pathname === ABBONAMENTO_PATH;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#EEBA2B] border-t-transparent" />
      </div>
    );
  }

  if (
    subscription &&
    isTrialExpiredNoPayment(subscription) &&
    !isOnAbbonamentoPage
  ) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/95 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Periodo di prova scaduto
          </h1>
          <p className="text-gray-600 mb-6">
            Per continuare a usare PrimePro aggiungi un metodo di pagamento.
            L&apos;abbonamento mensile (€50/mese) partirà dopo l&apos;inserimento.
          </p>
          <Link
            to="/partner/dashboard/abbonamento"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#EEBA2B] hover:bg-amber-500 text-gray-900 font-semibold transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Aggiungi metodo di pagamento
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
