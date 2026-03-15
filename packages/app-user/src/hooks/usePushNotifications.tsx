// PUSH NOTIFICATIONS — Non implementate per utenti atleti
// TODO: reimplementare con user_id quando si sviluppa il sistema push atleti

const noop = () => {};

export const usePushNotifications = () => {
  return {
    isSupported: false,
    isInitialized: true,
    isActive: false,
    canAskPermission: false,
    showPermissionModal: false,
    modalTrigger: 'manual' as const,
    showFirstWorkoutModal: noop,
    showManualModal: noop,
    closeModal: noop,
    handlePermissionGranted: noop,
  };
};
