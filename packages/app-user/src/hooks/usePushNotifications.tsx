import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, PushPermissionStatus } from '@/services/pushNotificationService';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [modalTrigger, setModalTrigger] = useState<'first-workout' | 'manual' | 'delayed'>('manual');

  // Inizializza il servizio
  useEffect(() => {
    const initialize = async () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const initialized = await pushNotificationService.initialize();
        setIsInitialized(initialized);
        
        if (initialized) {
          const status = pushNotificationService.getPermissionStatus();
          setPermissionStatus(status);
        }
      }
    };

    initialize();
  }, []);

  // Controlla se dovremmo mostrare il modal
  useEffect(() => {
    if (isSupported && isInitialized && permissionStatus) {
      const shouldAsk = pushNotificationService.shouldAskPermission();
      if (shouldAsk) {
        setShowPermissionModal(true);
        
        // Determina il trigger basato sul timestamp
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        if (permissionStatus.userChoice === 'postponed' && permissionStatus.timestamp < threeDaysAgo) {
          setModalTrigger('delayed');
        } else {
          setModalTrigger('manual');
        }
      }
    }
  }, [isSupported, isInitialized, permissionStatus]);

  // Mostra modal per primo workout completato
  const showFirstWorkoutModal = useCallback(() => {
    if (isSupported && isInitialized) {
      setModalTrigger('first-workout');
      setShowPermissionModal(true);
    }
  }, [isSupported, isInitialized]);

  // Mostra modal manuale
  const showManualModal = useCallback(() => {
    if (isSupported && isInitialized) {
      setModalTrigger('manual');
      setShowPermissionModal(true);
    }
  }, [isSupported, isInitialized]);

  // Chiudi modal
  const closeModal = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  // Gestisci permesso concesso
  const handlePermissionGranted = useCallback(() => {
    // Aggiorna lo stato locale
    const newStatus = pushNotificationService.getPermissionStatus();
    setPermissionStatus(newStatus);
    
    // Qui potresti inviare analytics o fare altre azioni
    console.log('Push notifications activated!');
  }, []);

  // Controlla se le notifiche sono attive
  const isActive = permissionStatus?.status === 'granted';

  // Controlla se possiamo chiedere i permessi
  const canAskPermission = isSupported && isInitialized && !isActive && 
    (permissionStatus?.status === 'not-asked' || 
     (permissionStatus?.userChoice === 'postponed' && 
      permissionStatus.timestamp < Date.now() - (3 * 24 * 60 * 60 * 1000)));

  return {
    isSupported,
    isInitialized,
    isActive,
    canAskPermission,
    showPermissionModal,
    modalTrigger,
    showFirstWorkoutModal,
    showManualModal,
    closeModal,
    handlePermissionGranted
  };
};
