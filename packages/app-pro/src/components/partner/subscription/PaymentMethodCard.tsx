import { CreditCard } from 'lucide-react';
import { PaymentMethodsManager } from './PaymentMethodsManager';

interface PaymentMethodCardProps {
  cardLast4?: string | null;
  cardBrand?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  onAddCard: () => void;
  onEditCard: () => void;
  onUpdate?: () => void;
}

export function PaymentMethodCard({
  onAddCard,
  onUpdate,
}: PaymentMethodCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Metodi di pagamento</h2>
      </div>

      {/* Payment Methods Manager */}
      <PaymentMethodsManager 
        onAddCard={onAddCard} 
        onUpdate={onUpdate}
      />
    </div>
  );
}
