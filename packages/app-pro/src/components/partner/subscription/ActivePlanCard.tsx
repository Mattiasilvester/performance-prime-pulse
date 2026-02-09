import React from 'react';
import { Crown, Check } from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

interface ActivePlanCardProps {
  planName: string;
  price: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  trialDaysRemaining?: number;
  trialEndDate?: string;
  trialProgress?: number;
  features: string[];
  paymentProvider?: 'stripe' | 'paypal' | null;
}

export function ActivePlanCard({
  planName,
  price,
  status,
  trialDaysRemaining,
  trialEndDate,
  trialProgress,
  features,
  paymentProvider,
}: ActivePlanCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EEBA2B]/10 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#EEBA2B]" />
          </div>
        <div>
          <p className="text-sm text-gray-500">Piano attuale</p>
          <h2 className="text-xl font-bold text-gray-900">{planName}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SubscriptionStatusBadge status={status} trialDaysRemaining={trialDaysRemaining} />
        {paymentProvider && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            paymentProvider === 'paypal' 
              ? 'bg-[#003087]/10 text-[#003087]' 
              : 'bg-[#635BFF]/10 text-[#635BFF]'
          }`}>
            {paymentProvider === 'paypal' ? 'PayPal' : 'Stripe'}
          </span>
        )}
      </div>
      </div>

      {/* Prezzo */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-500">/mese</span>
      </div>

      {/* Trial Progress Bar (se in trial) */}
      {status === 'trialing' && trialProgress !== undefined && trialEndDate && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-blue-700 font-medium">Periodo di prova</span>
            <span className="text-blue-600">Scade il {trialEndDate}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trialProgress}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {trialDaysRemaining} giorni rimanenti su 90
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Features */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          Cosa include il tuo piano
        </h3>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
