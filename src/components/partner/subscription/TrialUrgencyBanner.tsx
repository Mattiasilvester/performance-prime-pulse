import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface TrialUrgencyBannerProps {
  daysRemaining: number;
  onAddCard: () => void;
  hasCard: boolean;
}

export function TrialUrgencyBanner({ daysRemaining, onAddCard, hasCard }: TrialUrgencyBannerProps) {
  // Non mostrare se mancano più di 14 giorni
  if (daysRemaining > 14) return null;

  const isUrgent = daysRemaining <= 7;
  const bgColor = isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isUrgent ? 'text-red-800' : 'text-yellow-800';
  const iconColor = isUrgent ? 'text-red-500' : 'text-yellow-500';

  return (
    <div className={`${bgColor} border rounded-xl p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {daysRemaining === 0 
              ? 'Il tuo periodo di prova scade oggi!' 
              : daysRemaining === 1 
                ? 'Il tuo periodo di prova scade domani!'
                : `Il tuo periodo di prova scade tra ${daysRemaining} giorni!`
            }
          </h3>
          <p className={`text-sm ${textColor} mt-1 opacity-80`}>
            {hasCard 
              ? 'Il tuo abbonamento si rinnoverà automaticamente alla scadenza del trial.'
              : 'Aggiungi un metodo di pagamento per continuare a usare PrimePro dopo la scadenza.'
            }
          </p>
          {!hasCard && (
            <button
              onClick={onAddCard}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#EEBA2B] text-black font-medium rounded-lg hover:bg-[#d4a826] transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Aggiungi carta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
