// PUSH NOTIFICATIONS — Non implementate per utenti atleti
// Il sistema push è progettato per professional_id.
// Da reimplementare con user_id quando si sviluppa il sistema
// push dedicato agli atleti (Fase futura).
// TODO: implementare push per atleti con user_id e sw.js dedicato

import React from 'react';

interface PushPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  trigger: 'first-workout' | 'manual' | 'delayed';
}

export const PushPermissionModal: React.FC<PushPermissionModalProps> = () => {
  return null;
};
