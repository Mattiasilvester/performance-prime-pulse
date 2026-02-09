import { CreditCard } from 'lucide-react';
import { isPayPalConfigured } from '@/lib/paypal';

interface PaymentProviderSelectorProps {
  selectedProvider: 'stripe' | 'paypal';
  onSelect: (provider: 'stripe' | 'paypal') => void;
  disabled?: boolean;
}

export function PaymentProviderSelector({
  selectedProvider,
  onSelect,
  disabled = false,
}: PaymentProviderSelectorProps) {
  const paypalAvailable = isPayPalConfigured();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Scegli metodo di pagamento</p>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Stripe */}
        <button
          type="button"
          onClick={() => onSelect('stripe')}
          disabled={disabled}
          className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
            selectedProvider === 'stripe'
              ? 'border-[#EEBA2B] bg-[#EEBA2B]/5'
              : 'border-gray-200 hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="w-12 h-8 bg-[#635BFF] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">stripe</span>
          </div>
          <span className="text-sm font-medium text-gray-900">Carta di credito</span>
          <span className="text-xs text-gray-500">Visa, Mastercard, Amex</span>
        </button>

        {/* PayPal */}
        <button
          type="button"
          onClick={() => onSelect('paypal')}
          disabled={disabled || !paypalAvailable}
          className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
            selectedProvider === 'paypal'
              ? 'border-[#EEBA2B] bg-[#EEBA2B]/5'
              : 'border-gray-200 hover:border-gray-300'
          } ${disabled || !paypalAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="w-12 h-8 bg-[#003087] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">PayPal</span>
          </div>
          <span className="text-sm font-medium text-gray-900">PayPal</span>
          <span className="text-xs text-gray-500">
            {paypalAvailable ? 'Account PayPal' : 'Non disponibile'}
          </span>
        </button>
      </div>

      {selectedProvider === 'stripe' && (
        <p className="text-xs text-gray-500 mt-2">
          I pagamenti con carta sono gestiti in modo sicuro da Stripe.
        </p>
      )}
      
      {selectedProvider === 'paypal' && (
        <p className="text-xs text-gray-500 mt-2">
          Verrai reindirizzato a PayPal per completare il pagamento.
        </p>
      )}
    </div>
  );
}
