import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { PushPermissionModal } from '@/components/notifications/PushPermissionModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { pushNotificationService } from '@/services/pushNotificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const {
    isSupported,
    isActive,
    canAskPermission,
    showFirstWorkoutModal,
    closeModal,
    handlePermissionGranted
  } = usePushNotifications();

  const handleActivateNotifications = () => {
    if (canAskPermission) {
      setShowPermissionModal(true);
    }
  };

  const handleDeactivateNotifications = () => {
    // Rimuovi subscription e pulisci dati
    pushNotificationService.clearNotificationData();
    
    // Qui potresti anche revocare la subscription dal backend
    console.log('Notifications deactivated');
    
    // Ricarica la pagina per aggiornare lo stato
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="container mx-auto px-4 py-6 pt-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/settings')}
              className="text-pp-gold/80 hover:text-pp-gold text-sm mb-4"
            >
              ← Torna alle Impostazioni
            </button>
            <h1 className="text-3xl font-bold text-pp-gold mb-2">Notifiche</h1>
            <p className="text-pp-gold/80">Gestisci i promemoria e le notifiche push</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-800/50 border border-pp-gold/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-pp-gold">Stato Notifiche</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {isActive ? 'Attive' : 'Disattive'}
              </div>
            </div>
            
            <p className="text-gray-300 text-sm">
              {isActive 
                ? 'Ricevi promemoria personalizzati per mantenere la costanza nei tuoi allenamenti.'
                : 'Attiva le notifiche per ricevere promemoria intelligenti e motivazione quotidiana.'
              }
            </p>
          </div>

          {/* Support Status */}
          {!isSupported && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-red-400 font-semibold">Notifiche Non Supportate</h3>
              </div>
              <p className="text-red-300 text-sm">
                Il tuo browser non supporta le notifiche push. Aggiorna il browser o usa un dispositivo compatibile.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {isSupported && (
            <div className="space-y-4">
              {!isActive ? (
                <button
                  onClick={handleActivateNotifications}
                  disabled={!canAskPermission}
                  className="w-full bg-pp-gold hover:bg-pp-gold/90 disabled:bg-gray-600 disabled:text-gray-400 text-black font-bold py-4 px-6 rounded-xl transition-colors duration-200"
                >
                  {canAskPermission ? 'Attiva Notifiche' : 'Notifiche Già Richieste'}
                </button>
              ) : (
                <button
                  onClick={handleDeactivateNotifications}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200"
                >
                  Disattiva Notifiche
                </button>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-pp-gold mb-3">Cosa riceverai</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Promemoria personalizzati per i tuoi allenamenti</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Massimo 1 notifica al giorno</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Zero spam, solo motivazione</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-pp-gold mb-3">Privacy</h3>
              <p className="text-gray-300 text-sm">
                Le tue notifiche sono gestite localmente e non condividiamo i tuoi dati personali. 
                Puoi disattivare le notifiche in qualsiasi momento.
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNavigation />

      {/* Modal Notifiche Push */}
      <PushPermissionModal
        isOpen={showPermissionModal}
        onClose={closeModal}
        onPermissionGranted={handlePermissionGranted}
        trigger="manual"
      />
    </div>
  );
};

export default Notifications;