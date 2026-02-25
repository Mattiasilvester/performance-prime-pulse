import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Check } from 'lucide-react';
import type { Subscription } from '@/hooks/useSubscription';
import { isAccessAllowedBySubscription } from '@/hooks/useSubscriptionStatus';

const ABBONAMENTO_PATH = '/partner/dashboard/abbonamento';

const FEATURES = [
  'Clienti illimitati',
  'Calendario avanzato',
  'Gestione prenotazioni online',
  'Profilo su Prime Pro Finder',
  'Analytics e statistiche',
  'Supporto prioritario',
];

interface SubscriptionGuardProps {
  subscription: Subscription | null;
  loading: boolean;
  children: ReactNode;
}

/**
 * Blocca l'accesso al contenuto (ma non alla sidebar) se trial scaduto o abbonamento non attivo.
 * La pagina Abbonamento non viene mai bloccata.
 * Overlay copre solo l'area contenuto (main), sidebar resta navigabile.
 */
export function SubscriptionGuard({ subscription, loading, children }: SubscriptionGuardProps) {
  const location = useLocation();
  const isOnAbbonamentoPage = location.pathname === ABBONAMENTO_PATH;
  const accessAllowed = isAccessAllowedBySubscription(subscription);
  const showOverlay = !loading && !isOnAbbonamentoPage && !accessAllowed;

  if (loading) {
    return (
      <div className="relative min-h-[40vh] w-full flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-[#EEBA2B] border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full">
      {showOverlay && (
        <>
          {/* Sfondo semi-trasparente nero + blur - copre solo l'area contenuto (main) */}
          <div
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            aria-hidden
          />
          {/* Card centrale */}
          <div className="absolute inset-0 z-[101] flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 my-auto">
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: '#EEBA2B' }}
              >
                <Lock className="w-7 h-7 text-black" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Il tuo periodo di prova è terminato
              </h1>
              <p className="text-gray-600 text-sm text-center mb-6">
                Attiva Prime Business per continuare a gestire la tua attività con PrimePro
              </p>
              <ul className="space-y-2 mb-6">
                {FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-gray-700 text-sm"
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(238, 186, 43, 0.25)' }}
                    >
                      <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-center text-lg font-semibold text-gray-900 mb-6">
                €50/mese
              </p>
              <Link
                to={ABBONAMENTO_PATH}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold transition-colors text-black hover:opacity-90"
                style={{ backgroundColor: '#EEBA2B' }}
              >
                Vai all&apos;abbonamento →
              </Link>
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
