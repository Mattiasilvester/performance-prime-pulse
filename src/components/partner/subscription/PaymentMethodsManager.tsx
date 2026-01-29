import { useState, useEffect } from 'react';
import { CreditCard, Plus, Star, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import {
  PaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod,
  formatCardBrand,
} from '@/services/paymentMethodsService';
import { toast } from 'sonner';

interface PaymentMethodsManagerProps {
  onAddCard: () => void;
  onUpdate?: () => void;
}

export function PaymentMethodsManager({ onAddCard, onUpdate }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Carica carte
  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await listPaymentMethods();
      setMethods(data.payment_methods);
    } catch (error) {
      console.error('Errore caricamento carte:', error);
      toast.error('Errore nel caricamento delle carte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // Imposta predefinita
  const handleSetDefault = async (methodId: string) => {
    try {
      setActionLoading(methodId);
      await setDefaultPaymentMethod(methodId);
      toast.success('Carta predefinita aggiornata');
      await loadMethods();
      onUpdate?.();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Errore nell\'aggiornamento');
    } finally {
      setActionLoading(null);
    }
  };

  // Rimuovi carta
  const handleRemove = async (methodId: string) => {
    try {
      setActionLoading(methodId);
      await detachPaymentMethod(methodId);
      toast.success('Carta rimossa con successo');
      setShowDeleteConfirm(null);
      await loadMethods();
      onUpdate?.();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Errore nella rimozione');
    } finally {
      setActionLoading(null);
    }
  };

  // Icona brand carta
  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return (
          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">VISA</span>
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">MC</span>
          </div>
        );
      case 'amex':
        return (
          <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">AMEX</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-6 bg-gray-400 rounded flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista carte */}
      {methods.map((method) => (
        <div
          key={method.id}
          className={`relative p-4 rounded-lg border transition-colors ${
            method.is_default
              ? 'bg-[#EEBA2B]/5 border-[#EEBA2B]/30'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          {/* Conferma eliminazione - Modal fullscreen con backdrop */}
          {showDeleteConfirm === method.id && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              onClick={() => !actionLoading && setShowDeleteConfirm(null)}
            >
              {/* Backdrop scuro opaco */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              {/* Modal dialog */}
              <div 
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slideUp"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icona warning */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                
                {/* Testo */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Rimuovere questa carta?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Questa azione non può essere annullata.
                  </p>
                </div>
                
                {/* Bottoni */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={actionLoading === method.id}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => handleRemove(method.id)}
                    disabled={actionLoading === method.id}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === method.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Rimuovendo...</span>
                      </>
                    ) : (
                      'Rimuovi'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCardIcon(method.card_brand)}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {formatCardBrand(method.card_brand)} •••• {method.card_last4}
                  </p>
                  {method.is_default && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#EEBA2B] text-black rounded">
                      <Star className="w-3 h-3" />
                      Predefinita
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Scade {String(method.card_exp_month).padStart(2, '0')}/{method.card_exp_year}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!method.is_default && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  disabled={actionLoading === method.id}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === method.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Imposta predefinita'
                  )}
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(method.id)}
                disabled={actionLoading === method.id}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Rimuovi carta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Bottone aggiungi carta */}
      <button
        onClick={onAddCard}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#EEBA2B] hover:text-[#EEBA2B] transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Aggiungi nuova carta
      </button>

      {/* Note sicurezza */}
      <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        I dati delle carte sono protetti e gestiti da Stripe
      </p>
    </div>
  );
}
