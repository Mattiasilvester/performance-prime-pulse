import React, { useState, useEffect } from 'react';
import { pushNotificationService, PushPermissionStatus } from '@/services/pushNotificationService';

interface PushPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  trigger: 'first-workout' | 'manual' | 'delayed';
}

export const PushPermissionModal: React.FC<PushPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  trigger
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Testi dinamici basati sul trigger
  const getContent = () => {
    switch (trigger) {
      case 'first-workout':
        return {
          title: '🎉 Primo workout completato!',
          subtitle: 'Vuoi promemoria intelligenti?',
          description: 'Ti invieremo 1 notifica al giorno per mantenere la costanza. Zero spam, solo motivazione.',
          benefits: [
            'Promemoria personalizzati',
            'Motivazione quotidiana',
            'Zero spam garantito'
          ]
        };
      case 'manual':
        return {
          title: '🔔 Notifiche Push',
          subtitle: 'Attiva i promemoria intelligenti',
          description: 'Ricevi notifiche personalizzate per mantenere la costanza nei tuoi allenamenti.',
          benefits: [
            'Promemoria personalizzati',
            'Motivazione quotidiana',
            'Zero spam garantito'
          ]
        };
      case 'delayed':
        return {
          title: '⏰ Promemoria Ritardato',
          subtitle: 'Pronto per i promemoria?',
          description: 'Ti avevamo promesso di chiederti di nuovo. Vuoi attivare i promemoria intelligenti?',
          benefits: [
            'Promemoria personalizzati',
            'Motivazione quotidiana',
            'Zero spam garantito'
          ]
        };
      default:
        return {
          title: '🔔 Notifiche Push',
          subtitle: 'Attiva i promemoria intelligenti',
          description: 'Ricevi notifiche personalizzate per mantenere la costanza nei tuoi allenamenti.',
          benefits: [
            'Promemoria personalizzati',
            'Motivazione quotidiana',
            'Zero spam garantito'
          ]
        };
    }
  };

  const content = getContent();

  const handleActivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Controlla se le notifiche sono supportate
      if (!pushNotificationService.isSupported()) {
        throw new Error('Le notifiche push non sono supportate dal tuo browser');
      }

      // Inizializza il service worker
      const initialized = await pushNotificationService.initialize();
      if (!initialized) {
        throw new Error('Impossibile inizializzare il servizio notifiche');
      }

      // Richiedi permessi
      const permissionStatus = await pushNotificationService.requestPermission();
      
      if (permissionStatus.status === 'granted') {
        // Crea subscription
        const subscription = await pushNotificationService.createSubscription();
        if (subscription) {
          // Invia al backend
          await pushNotificationService.sendSubscriptionToBackend(subscription);
          onPermissionGranted();
        }
        onClose();
      } else {
        // Salva che l'utente ha negato
        pushNotificationService.savePermissionStatus(permissionStatus);
        onClose();
      }
    } catch (err) {
      console.error('Error activating push notifications:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostpone = () => {
    // Salva che l'utente ha posticipato
    const status: PushPermissionStatus = {
      status: 'default',
      timestamp: Date.now(),
      userChoice: 'postponed'
    };
    pushNotificationService.savePermissionStatus(status);
    onClose();
  };

  const handleDecline = () => {
    // Salva che l'utente ha negato
    const status: PushPermissionStatus = {
      status: 'denied',
      timestamp: Date.now(),
      userChoice: 'declined'
    };
    pushNotificationService.savePermissionStatus(status);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-pp-gold/30 rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pp-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pp-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pp-gold mb-2">{content.title}</h2>
          <p className="text-lg text-pp-gold/80">{content.subtitle}</p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-300 text-center mb-4">{content.description}</p>
          
          {/* Benefits */}
          <div className="space-y-2">
            {content.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleActivate}
            disabled={isLoading}
            className="w-full bg-pp-gold hover:bg-pp-gold/90 disabled:bg-pp-gold/50 text-black font-bold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            {isLoading ? 'Attivazione...' : 'Attiva Promemoria'}
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePostpone}
              disabled={isLoading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Più tardi
            </button>
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              No, grazie
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Puoi disattivare le notifiche in qualsiasi momento nelle impostazioni
          </p>
        </div>
      </div>
    </div>
  );
};
