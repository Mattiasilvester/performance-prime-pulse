import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface SubscriptionStatusBadgeProps {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  trialDaysRemaining?: number;
}

export function SubscriptionStatusBadge({ status, trialDaysRemaining }: SubscriptionStatusBadgeProps) {
  const config = {
    trialing: {
      label: trialDaysRemaining ? `Periodo di prova (${trialDaysRemaining} giorni)` : 'Periodo di prova',
      icon: Clock,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    active: {
      label: 'Attivo',
      icon: CheckCircle2,
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    past_due: {
      label: 'Pagamento in ritardo',
      icon: AlertCircle,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    canceled: {
      label: 'Cancellato',
      icon: XCircle,
      className: 'bg-gray-50 text-gray-600 border-gray-200',
    },
    incomplete: {
      label: 'Incompleto',
      icon: AlertCircle,
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    unpaid: {
      label: 'Non pagato',
      icon: AlertCircle,
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const { label, icon: Icon, className } = config[status] || config.incomplete;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${className}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}
