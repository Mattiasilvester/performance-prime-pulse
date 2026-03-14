import { useState, useEffect, useCallback } from 'react';
import { MedalSystem, Challenge, Medal, ChallengeModalData, MedalCardData, MedalCardState, CHALLENGE_CONFIG } from '@/types/medalSystem';
import { getChallengeStatus, getMedalsCount, getTotalWorkouts } from '@/utils/challengeTracking';

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

  // Sblocco automatico medaglie da totalWorkouts (first_step, iron_will, century_club)
  const syncEarnedMedalsFromWorkouts = useCallback((system: MedalSystem): MedalSystem | null => {
    const rawWorkouts = localStorage.getItem('pp_total_workouts');
    if (!rawWorkouts || rawWorkouts === '0') {
      try {
        const challengeRaw = localStorage.getItem('pp_challenge_7days');
        if (challengeRaw) {
          const challenge = JSON.parse(challengeRaw);
          if (typeof challenge.workoutCount === 'number' && challenge.workoutCount > 0) {
            localStorage.setItem('pp_total_workouts', String(challenge.workoutCount));
          }
        }
      } catch {}
    }
    const totalWorkouts = getTotalWorkouts();
    const earnedIds = new Set(system.earnedMedals.map((m) => m.id));
    const toAdd: Medal[] = [];
    const now = new Date().toISOString();
    if (totalWorkouts >= 1 && !earnedIds.has('first_step')) {
      toAdd.push({ id: 'first_step', name: 'First Step', description: 'Primo allenamento completato', icon: '🏃', earnedDate: now, challengeType: 'workout_total', rarity: 'common' });
    }
    if (totalWorkouts >= 10 && !earnedIds.has('iron_will')) {
      toAdd.push({ id: 'iron_will', name: 'Iron Will', description: '10 allenamenti totali', icon: '💪', earnedDate: now, challengeType: 'workout_total', rarity: 'common' });
    }
    if (totalWorkouts >= 100 && !earnedIds.has('century_club')) {
      toAdd.push({ id: 'century_club', name: 'Century Club', description: '100 allenamenti totali', icon: '🎯', earnedDate: now, challengeType: 'workout_total', rarity: 'legendary' });
    }
    if (totalWorkouts >= 250 && !earnedIds.has('elite_club')) {
      toAdd.push({ id: 'elite_club', name: 'Elite Club', description: '250 allenamenti totali', icon: '👑', earnedDate: now, challengeType: 'workout_total', rarity: 'legendary' });
    }
    const afterWorkouts = [...system.earnedMedals, ...toAdd];
    const idsAfter = new Set(afterWorkouts.map((m) => (m.id.startsWith('kickoff_champion') ? 'kickoff_champion' : m.id)));
    if (idsAfter.size >= 26 && !idsAfter.has('prime_legend')) {
      toAdd.push({ id: 'prime_legend', name: 'Prime Legend', description: 'Tutte le medaglie sbloccate', icon: '⚜️', earnedDate: now, challengeType: 'all_medals', rarity: 'legendary' });
    }
    if (toAdd.length === 0) return null;
    return {
      ...system,
      totalMedals: system.totalMedals + toAdd.length,
      earnedMedals: [...system.earnedMedals, ...toAdd],
      lastUpdated: now,
    };
  }, []);

  // Carica sistema medaglie da localStorage e sync medaglie da totalWorkouts
  useEffect(() => {
    const saved = localStorage.getItem(MEDAL_SYSTEM_KEY);
    let system: MedalSystem = {
      totalMedals: 0,
      currentChallenge: null,
      earnedMedals: [],
      lastUpdated: new Date().toISOString(),
    };
    if (saved) {
      try {
        system = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading medal system:', error);
      }
    }
    const synced = syncEarnedMedalsFromWorkouts(system);
    const toSet = synced ?? system;
    setMedalSystem(toSet);
    if (synced) localStorage.setItem(MEDAL_SYSTEM_KEY, JSON.stringify(synced));
  }, [syncEarnedMedalsFromWorkouts]);

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
  }, []);

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
