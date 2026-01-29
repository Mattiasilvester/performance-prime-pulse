import React, { useState } from 'react';
import { Settings, AlertTriangle, X } from 'lucide-react';

interface ManageSubscriptionCardProps {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  onCancelSubscription: (reason: string) => Promise<void>;
  onReactivateSubscription?: () => Promise<void>;
}

export function ManageSubscriptionCard({
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  onCancelSubscription,
  onReactivateSubscription,
}: ManageSubscriptionCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleCancel = async () => {
    // Validazione: motivo obbligatorio
    if (!cancelReason.trim()) {
      // Mostra errore se motivo vuoto
      return;
    }

    setIsLoading(true);
    try {
      await onCancelSubscription(cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason(''); // Reset dopo successo
    } catch (error) {
      console.error('Errore cancellazione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!onReactivateSubscription) return;
    setIsLoading(true);
    try {
      await onReactivateSubscription();
    } catch (error) {
      console.error('Errore riattivazione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Se già cancellato definitivamente, non mostrare nulla
  if (status === 'canceled' && !cancelAtPeriodEnd) {
    return null;
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Gestione abbonamento</h2>
        </div>

        {cancelAtPeriodEnd ? (
          /* Abbonamento in cancellazione */
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  Abbonamento in cancellazione
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Il tuo abbonamento rimarrà attivo fino al{' '}
                  <strong>{currentPeriodEnd ? formatDate(currentPeriodEnd) : 'fine periodo'}</strong>,
                  dopodiché non verrà rinnovato.
                </p>
                {onReactivateSubscription && (
                  <button
                    onClick={handleReactivate}
                    disabled={isLoading}
                    className="mt-3 px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Riattivazione...' : 'Riattiva abbonamento'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Abbonamento attivo - opzione cancellazione */
          <div>
            <p className="text-gray-600 mb-4">
              Se cancelli il tuo abbonamento, continuerai ad avere accesso fino alla fine del periodo di fatturazione corrente.
            </p>
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
            >
              Cancella abbonamento
            </button>
          </div>
        )}
      </div>

      {/* Modal Conferma Cancellazione */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Close button */}
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Cancellare l'abbonamento?
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Sei sicuro di voler cancellare il tuo abbonamento Prime Business? 
              Perderai l'accesso a tutte le funzionalità premium alla fine del periodo corrente.
            </p>

            {/* Cosa perderai */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Perderai accesso a:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Gestione clienti illimitata</li>
                <li>• Calendario avanzato</li>
                <li>• Profilo pubblico su Prime Pro Finder</li>
                <li>• Analytics e statistiche</li>
                <li>• Clienti e progetti allegati</li>
                <li>• Tutto quello presente nell'abbonamento</li>
              </ul>
            </div>

            {/* Motivo cancellazione (OBBLIGATORIO) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo della cancellazione <span className="text-red-600">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Aiutaci a migliorare... (campo obbligatorio)"
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  !cancelReason.trim() ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                required
              />
              {!cancelReason.trim() && (
                <p className="text-xs text-red-600 mt-1">
                  Il motivo della cancellazione è obbligatorio
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Cancellazione...' : 'Conferma cancellazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
