// Utility per tracciare workout completati nella sfida 7 giorni
// Usata sia dal workout rapido che dal bottone "Segna come completato"

export interface ChallengeData {
  startDate: string;
  workoutCount: number;
  completedDates: string[];
  isActive: boolean;
  isCompleted: boolean;
  badgeEarned: boolean;
}

export interface TrackingResult {
  isNewChallenge: boolean;
  isUpdated: boolean;
  isCompleted: boolean;
  challenge: ChallengeData;
  message?: string;
}

const CHALLENGE_KEY = 'pp_challenge_7days';
const MEDALS_KEY = 'pp_total_medals';

export const trackWorkoutForChallenge = (): TrackingResult => {
  const challenge = JSON.parse(localStorage.getItem(CHALLENGE_KEY) || '{}');
  const today = new Date().toISOString().split('T')[0];
  
  // Se sfida non iniziata, iniziala
  if (!challenge.startDate) {
    const newChallenge: ChallengeData = {
      startDate: new Date().toISOString(),
      workoutCount: 1,
      completedDates: [today],
      isActive: true,
      isCompleted: false,
      badgeEarned: false
    };
    
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newChallenge));
    
    return { 
      isNewChallenge: true, 
      isUpdated: false,
      isCompleted: false,
      challenge: newChallenge,
      message: '🔥 Sfida 7 Giorni iniziata! Completa 3 allenamenti in 7 giorni per sbloccare il badge Kickoff Champion!'
    };
  }
  
  // Controlla se sfida è scaduta (7 giorni)
  const startDate = new Date(challenge.startDate);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysPassed >= 7 && !challenge.isCompleted) {
    // Sfida scaduta - reset
    localStorage.removeItem(CHALLENGE_KEY);
    return {
      isNewChallenge: false,
      isUpdated: false,
      isCompleted: false,
      challenge: {
        startDate: '',
        workoutCount: 0,
        completedDates: [],
        isActive: false,
        isCompleted: false,
        badgeEarned: false
      },
      message: 'Sfida scaduta. Inizia una nuova sfida!'
    };
  }
  
  // Se sfida attiva e non completata
  if (challenge.isActive && !challenge.isCompleted) {
    // Verifica che non sia già stato registrato oggi
    if (!challenge.completedDates?.includes(today)) {
      challenge.workoutCount = (challenge.workoutCount || 0) + 1;
      challenge.completedDates = [...(challenge.completedDates || []), today];
      
      // Controlla se sfida completata
      if (challenge.workoutCount >= 3) {
        challenge.isCompleted = true;
        challenge.badgeEarned = true;
        
        // Incrementa contatore medaglie totali
        const totalMedals = parseInt(localStorage.getItem(MEDALS_KEY) || '0');
        localStorage.setItem(MEDALS_KEY, String(totalMedals + 1));
        
        localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
        
        return {
          isNewChallenge: false,
          isUpdated: true,
          isCompleted: true,
          challenge,
          message: '🎉 Sfida Completata! Hai guadagnato il badge Kickoff Champion!'
        };
      } else {
        localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
        
        return {
          isNewChallenge: false,
          isUpdated: true,
          isCompleted: false,
          challenge,
          message: `Progresso sfida: ${challenge.workoutCount}/3 allenamenti completati!`
        };
      }
    } else {
      // Già registrato oggi
      return {
        isNewChallenge: false,
        isUpdated: false,
        isCompleted: false,
        challenge,
        message: 'Hai già completato un allenamento oggi!'
      };
    }
  }
  
  return {
    isNewChallenge: false,
    isUpdated: false,
    isCompleted: false,
    challenge
  };
};

export const getChallengeStatus = (): ChallengeData => {
  const challenge = JSON.parse(localStorage.getItem(CHALLENGE_KEY) || '{}');
  
  // Se sfida attiva, controlla se è scaduta
  if (challenge.isActive && !challenge.isCompleted && challenge.startDate) {
    const startDate = new Date(challenge.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysPassed >= 7) {
      // Sfida scaduta - reset
      localStorage.removeItem(CHALLENGE_KEY);
      return {
        startDate: '',
        workoutCount: 0,
        completedDates: [],
        isActive: false,
        isCompleted: false,
        badgeEarned: false
      };
    }
  }
  
  return challenge;
};

export const getMedalsCount = (): number => {
  return parseInt(localStorage.getItem(MEDALS_KEY) || '0');
};
