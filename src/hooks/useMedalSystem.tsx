import { useState, useEffect, useCallback } from 'react';
import { MedalSystem, Challenge, Medal, ChallengeModalData, MedalCardData, MedalCardState, CHALLENGE_CONFIG } from '@/types/medalSystem';
import { getChallengeStatus, getMedalsCount } from '@/utils/challengeTracking';

const MEDAL_SYSTEM_KEY = 'pp_medal_system';
const WORKOUT_COMPLETED_KEY = 'pp_workout_completed';

export const useMedalSystem = () => {
  const [medalSystem, setMedalSystem] = useState<MedalSystem>({
    totalMedals: 0,
    currentChallenge: null,
    earnedMedals: [],
    lastUpdated: new Date().toISOString()
  });

  const [challengeModal, setChallengeModal] = useState<ChallengeModalData>({
    isOpen: false,
    challengeType: null,
    title: '',
    description: '',
    icon: '',
    daysRemaining: 0,
    progress: 0,
    target: 0
  });

  // Carica sistema medaglie da localStorage
  useEffect(() => {
    const saved = localStorage.getItem(MEDAL_SYSTEM_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMedalSystem(parsed);
      } catch (error) {
        console.error('Error loading medal system:', error);
      }
    }
  }, []);

  // Salva sistema medaglie in localStorage
  const saveMedalSystem = useCallback((system: MedalSystem) => {
    const updated = {
      ...system,
      lastUpdated: new Date().toISOString()
    };
    setMedalSystem(updated);
    localStorage.setItem(MEDAL_SYSTEM_KEY, JSON.stringify(updated));
  }, []);

  // Avvia sfida kickoff 7 giorni
  const startKickoffChallenge = useCallback(() => {
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const challenge: Challenge = {
      type: 'kickoff_7days',
      isActive: true,
      progress: 0,
      daysRemaining: 7,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      workoutsCompleted: 0,
      targetWorkouts: 3
    };

    const updated = {
      ...medalSystem,
      currentChallenge: challenge
    };

    saveMedalSystem(updated);
    
    // Mostra modal sfida
    setChallengeModal({
      isOpen: true,
      challengeType: 'kickoff_7days',
      title: 'Sfida Kickoff Attivata! 🔥',
      description: 'Completa 3 allenamenti in 7 giorni per sbloccare il badge Kickoff Champion',
      icon: '🔥',
      daysRemaining: 7,
      progress: 0,
      target: 3
    });
  }, [medalSystem, saveMedalSystem]);

  // Registra completamento workout
  const recordWorkoutCompletion = useCallback(() => {
    if (!medalSystem.currentChallenge?.isActive) return;

    const challenge = medalSystem.currentChallenge;
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    
    // Controlla se la sfida è scaduta
    if (now > endDate) {
      // Sfida scaduta
      const updated = {
        ...medalSystem,
        currentChallenge: null
      };
      saveMedalSystem(updated);
      return;
    }

    // Aggiorna progresso
    const newWorkoutsCompleted = challenge.workoutsCompleted + 1;
    const newProgress = Math.min(newWorkoutsCompleted, challenge.targetWorkouts);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const updatedChallenge: Challenge = {
      ...challenge,
      workoutsCompleted: newWorkoutsCompleted,
      progress: newProgress,
      daysRemaining: Math.max(0, daysRemaining)
    };

    // Controlla se sfida completata
    if (newProgress >= challenge.targetWorkouts) {
      // Sfida completata!
      const medal: Medal = {
        id: `kickoff_champion_${Date.now()}`,
        name: 'Kickoff Champion',
        description: 'Hai completato la Sfida Kickoff!',
        icon: '🏆',
        earnedDate: now.toISOString(),
        challengeType: 'kickoff_7days',
        rarity: 'rare'
      };

      const updated = {
        ...medalSystem,
        totalMedals: medalSystem.totalMedals + 1,
        currentChallenge: null,
        earnedMedals: [...medalSystem.earnedMedals, medal]
      };

      saveMedalSystem(updated);

      // Mostra modal completamento
      setChallengeModal({
        isOpen: true,
        challengeType: null,
        title: 'Sfida Completata! 🏆',
        description: 'Hai sbloccato il badge Kickoff Champion!',
        icon: '🏆',
        daysRemaining: 0,
        progress: 3,
        target: 3
      });
    } else {
      // Aggiorna sfida in corso
      const updated = {
        ...medalSystem,
        currentChallenge: updatedChallenge
      };
      saveMedalSystem(updated);
    }
  }, [medalSystem, saveMedalSystem]);

  // Chiudi modal sfida
  const closeChallengeModal = useCallback(() => {
    setChallengeModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Calcola dati card medaglie
  const getMedalCardData = useCallback((): MedalCardData => {
    // Usa la nuova utility per ottenere lo stato della sfida
    const challengeStatus = getChallengeStatus();
    const totalMedals = getMedalsCount();
    
    if (challengeStatus.isActive && !challengeStatus.isCompleted) {
      // Calcola giorni rimanenti
      const startDate = new Date(challengeStatus.startDate);
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 7 - daysPassed);
      
      // Stato sfida attiva
      return {
        state: 'challenge_active',
        icon: '🔥',
        value: `${challengeStatus.workoutCount}/3`,
        label: 'Sfida Kickoff',
        description: `${daysRemaining} giorni rimanenti`,
        progress: challengeStatus.workoutCount,
        daysRemaining: daysRemaining
      };
    } else if (challengeStatus.badgeEarned) {
      // Stato sfida completata
      return {
        state: 'challenge_completed',
        icon: '🏆',
        value: totalMedals.toString(),
        label: 'Medaglie',
        description: '+1 Kickoff Champion'
      };
    } else {
      // Stato default
      return {
        state: 'default',
        icon: '🏆',
        value: totalMedals.toString(),
        label: 'Medaglie',
        description: 'Completa le sfide'
      };
    }
  }, [medalSystem]);

  // Controlla se dovrebbe mostrare modal sfida
  const shouldShowChallengeModal = useCallback(() => {
    // Mostra modal se non c'è sfida attiva e l'utente ha completato un workout
    const hasWorkoutCompleted = localStorage.getItem(WORKOUT_COMPLETED_KEY);
    const hasActiveChallenge = medalSystem.currentChallenge?.isActive;
    
    return hasWorkoutCompleted && !hasActiveChallenge && !challengeModal.isOpen;
  }, [medalSystem, challengeModal.isOpen]);

  // Trigger per mostrare modal sfida
  useEffect(() => {
    if (shouldShowChallengeModal()) {
      setChallengeModal({
        isOpen: true,
        challengeType: 'kickoff_7days',
        title: 'Sblocca la Sfida Kickoff! 🔥',
        description: 'Fai 3 allenamenti in 7 giorni = Badge Kickoff Champion',
        icon: '🔥',
        daysRemaining: 7,
        progress: 0,
        target: 3
      });
    }
  }, [shouldShowChallengeModal]);

  return {
    medalSystem,
    challengeModal,
    getMedalCardData,
    startKickoffChallenge,
    recordWorkoutCompletion,
    closeChallengeModal
  };
};
