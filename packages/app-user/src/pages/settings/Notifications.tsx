import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PushPermissionModal } from '@/components/notifications/PushPermissionModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { pushNotificationService } from '@/services/pushNotificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
  const {
    isSupported,
    isActive,
    canAskPermission,
    closeModal,
    handlePermissionGranted
  } = usePushNotifications();

  const handleActivateNotifications = () => {
    if (canAskPermission) {
      setShowPermissionModal(true);
    }
  };

  const handleDeactivateNotifications = () => {
    pushNotificationService.clearNotificationData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6">
      <div className="max-w-md mx-auto w-full pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-[#8A8A96] hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[#F0EDE8]">Notifiche</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96]">Gestisci i promemoria e le notifiche push</p>
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col gap-6">
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F0EDE8]">Stato Notifiche</h2>
            <span className={`px-3 py-1 rounded-full text-[13px] font-medium ${
              isActive ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#1E1E24] text-[#8A8A96] border border-[rgba(255,255,255,0.06)]'
            }`}>
              {isActive ? 'Attive' : 'Disattive'}
            </span>
          </div>
          <p className="text-[13px] text-[#8A8A96] leading-relaxed">
            {isActive
              ? 'Ricevi promemoria personalizzati per mantenere la costanza nei tuoi allenamenti.'
              : 'Attiva le notifiche per ricevere promemoria intelligenti e motivazione quotidiana.'}
          </p>
        </div>

        {!isSupported && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-[14px] p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-[#EF4444] font-semibold">Notifiche Non Supportate</h3>
            </div>
            <p className="text-[13px] text-[#8A8A96] leading-relaxed">
              Il tuo browser non supporta le notifiche push. Aggiorna il browser o usa un dispositivo compatibile.
            </p>
          </div>
        )}

        {isSupported && (
          <div className="space-y-4">
            {!isActive ? (
              <button
                type="button"
                onClick={handleActivateNotifications}
                disabled={!canAskPermission}
                className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
              >
                {canAskPermission ? 'Attiva Notifiche' : 'Notifiche Già Richieste'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeactivateNotifications}
                className="w-full py-3 rounded-[14px] text-sm font-semibold text-[#EF4444] border border-[rgba(239,68,68,0.3)]"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                Disattiva Notifiche
              </button>
            )}
          </div>
        )}

        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5 space-y-4">
          <h3 className="text-base font-bold text-[#F0EDE8]">Cosa riceverai</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] text-[#8A8A96]">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Promemoria personalizzati per i tuoi allenamenti</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#8A8A96]">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Massimo 1 notifica al giorno</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#8A8A96]">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Zero spam, solo motivazione</span>
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-base font-bold text-[#F0EDE8] mb-2">Privacy</h3>
            <p className="text-[13px] text-[#8A8A96] leading-relaxed">
              Le tue notifiche sono gestite localmente e non condividiamo i tuoi dati personali.
              Puoi disattivare le notifiche in qualsiasi momento.
            </p>
          </div>
        </div>
      </div>

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