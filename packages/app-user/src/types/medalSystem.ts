// Sistema Medaglie e Sfide - Performance Prime

export interface MedalSystem {
  totalMedals: number;
  currentChallenge: Challenge | null;
  earnedMedals: Medal[];
  lastUpdated: string;
}

export interface Challenge {
  type: 'kickoff_7days';
  isActive: boolean;
  progress: number; // 0-3
  daysRemaining: number; // 0-7
  startDate: string;
  endDate: string;
  workoutsCompleted: number;
  targetWorkouts: number;
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  challengeType: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ChallengeModalData {
  isOpen: boolean;
  challengeType: 'kickoff_7days' | null;
  title: string;
  description: string;
  icon: string;
  daysRemaining: number;
  progress: number;
  target: number;
}

// Tipi per le card medaglie
export type MedalCardState = 'default' | 'challenge_active' | 'challenge_completed';

export interface MedalCardData {
  state: MedalCardState;
  icon: string;
  value: string;
  label: string;
  description: string;
  progress?: number;
  daysRemaining?: number;
}

// Costanti per le sfide
export const CHALLENGE_TYPES = {
  KICKOFF_7DAYS: 'kickoff_7days'
} as const;

export const MEDAL_TYPES = {
  FIRST_STEP: 'first_step',
  KICKOFF_CHAMPION: 'kickoff_champion',
  IRON_WILL: 'iron_will',
  EARLY_BIRD: 'early_bird',
  NIGHT_OWL: 'night_owl',
  SPEED_DEMON: 'speed_demon',
  NUTRITION_START: 'nutrition_start',
  PRIMEBOT_BUDDY: 'primebot_buddy',
  PROFILE_COMPLETE: 'profile_complete',
  WEEKLY_WARRIOR: 'weekly_warrior',
  CONSISTENCY_MASTER: 'consistency_master',
  CENTURY_CLUB: 'century_club',
  NUTRITION_PRO: 'nutrition_pro',
  PRIMEBOT_ADVISOR: 'primebot_advisor',
  PAIN_FIGHTER: 'pain_fighter',
  BOOKED_PRO: 'booked_pro',
  MONTH_WARRIOR: 'month_warrior',
  VERSATILE: 'versatile',
  IRON_STREAK: 'iron_streak',
  ELITE_CLUB: 'elite_club',
  NUTRITION_MASTER: 'nutrition_master',
  PRO_PARTNER: 'pro_partner',
  YEAR_WARRIOR: 'year_warrior',
  PRIMEBOT_MASTER: 'primebot_master',
  NO_LIMITS: 'no_limits',
  ALL_CATEGORIES: 'all_categories',
  PRIME_LEGEND: 'prime_legend',
} as const;

// Configurazione sfide
export const CHALLENGE_CONFIG = {
  kickoff_7days: {
    name: 'Sfida Kickoff',
    description: 'Completa 3 allenamenti in 7 giorni',
    icon: '🔥',
    targetWorkouts: 3,
    durationDays: 7,
    medalReward: 'kickoff_champion'
  }
} as const;
