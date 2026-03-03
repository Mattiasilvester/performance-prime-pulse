/**
 * Types per sistema Piano Personalizzato
 */

// Tipo di piano
export type PlanType = 'daily' | 'weekly';

// Sorgente creazione piano
export type PlanSource = 'primebot' | 'onboarding' | 'custom';

// Livello esperienza utente
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Obiettivo allenamento
export type WorkoutGoal = 
  | 'Perdere peso'
  | 'Aumentare massa muscolare'
  | 'Migliorare resistenza'
  | 'Tonificare'
  | 'Mantenersi attivo';

// Obiettivo specifico per piano giornaliero
export type DailyPlanGoal = 
  | 'Full Body'
  | 'Upper Body'
  | 'Lower Body'
  | 'Core'
  | 'Cardio';

// Durata per piano giornaliero
export type DailyPlanDuration = '15-20' | '30-45' | '60+';

// Durata piano settimanale (in settimane)
export type WeeklyPlanDuration = 4 | 8 | 12;

// Frequenza settimanale
export type WeeklyFrequency = '2-3' | '4-5' | '6+';

// Attrezzatura disponibile
export type Equipment = 
  | 'Corpo libero'
  | 'Manubri/Pesi'
  | 'Palestra completa';

/** Singolo workout nel piano (giorno o settimana); usare per cast dove si accede a .exercises */
export interface PlanWorkoutItem {
  exercises?: unknown[];
  name?: string;
  nome?: string;
  duration?: number;
  durata?: number;
  [key: string]: unknown;
}

/**
 * Piano di allenamento personalizzato
 */
export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  plan_type: PlanType;
  source: PlanSource;
  
  // Dettagli piano
  goal?: WorkoutGoal | DailyPlanGoal;
  level?: ExperienceLevel;
  duration_weeks?: WeeklyPlanDuration;
  frequency_per_week?: number;
  equipment?: Equipment;
  limitations?: string;
  
  // Workout data (JSONB in database)
  workouts: unknown[];
  
  // Status
  status: 'pending' | 'active' | 'completed';
  
  // Metadata
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  metadata?: {
    created_via?: string;
    modification_history?: unknown[];
    primebot_explanation?: string;
    [key: string]: unknown;
  };
}

/**
 * State per creazione piano (Zustand store)
 */
export interface PlanCreationState {
  // Step navigation
  currentStep: number;
  totalSteps: number;
  
  // Tipo piano
  planType: PlanType | null;
  
  // Dati piano giornaliero
  dailyGoal?: DailyPlanGoal;
  dailyDuration?: DailyPlanDuration;
  dailyEquipment?: Equipment;
  
  // Dati piano settimanale
  weeklyGoal?: WorkoutGoal;
  weeklyLevel?: ExperienceLevel;
  weeklyDuration?: WeeklyPlanDuration;
  weeklyFrequency?: WeeklyFrequency;
  weeklyEquipment?: Equipment;
  weeklyLimitations?: string;
  
  // Piano generato
  generatedPlan?: WorkoutPlan;
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setPlanType: (type: PlanType) => void;
  setDailyGoal: (goal: DailyPlanGoal) => void;
  setDailyDuration: (duration: DailyPlanDuration) => void;
  setDailyEquipment: (equipment: Equipment) => void;
  setWeeklyGoal: (goal: WorkoutGoal) => void;
  setWeeklyLevel: (level: ExperienceLevel) => void;
  setWeeklyDuration: (duration: WeeklyPlanDuration) => void;
  setWeeklyFrequency: (frequency: WeeklyFrequency) => void;
  setWeeklyEquipment: (equipment: Equipment) => void;
  setWeeklyLimitations: (limitations: string) => void;
  setGeneratedPlan: (plan: WorkoutPlan) => void;
  reset: () => void;
}

/**
 * Message per chat modifica piano
 */
export interface PlanModificationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Intent riconosciuto dalla chat modifica
 */
export interface ModificationIntent {
  type: 
    | 'add_exercise'
    | 'remove_exercise'
    | 'change_duration'
    | 'change_frequency'
    | 'change_intensity'
    | 'substitute_exercise'
    | 'unknown';
  parameters: Record<string, unknown>;
  confidence: number;
}


