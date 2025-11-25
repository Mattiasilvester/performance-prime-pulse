import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  PlanCreationState, 
  PlanType, 
  DailyPlanGoal, 
  DailyPlanDuration, 
  Equipment, 
  WorkoutGoal, 
  ExperienceLevel, 
  WeeklyPlanDuration, 
  WeeklyFrequency, 
  WorkoutPlan 
} from '@/types/plan';

/**
 * Zustand store per creazione piano personalizzato
 * Pattern identico a onboardingStore.ts
 */
export const usePlanCreationStore = create<PlanCreationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      totalSteps: 0,
      planType: null,
      
      // Navigation
      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      setStep: (step: number) => {
        set({ currentStep: step });
      },
      
      // Tipo piano
      setPlanType: (type: PlanType) => {
        // Calcola totalSteps in base al tipo
        // daily: 3 step + genera + spiegazione + preview + chat = 7
        // weekly: 5 step + genera + spiegazione + preview + chat = 9
        const totalSteps = type === 'daily' ? 7 : 9;
        set({ 
          planType: type,
          totalSteps,
          currentStep: 0 // Reset a step 0 dopo scelta tipo
        });
      },
      
      // Daily plan setters
      setDailyGoal: (goal: DailyPlanGoal) => {
        set({ dailyGoal: goal });
      },
      
      setDailyDuration: (duration: DailyPlanDuration) => {
        set({ dailyDuration: duration });
      },
      
      setDailyEquipment: (equipment: Equipment) => {
        set({ dailyEquipment: equipment });
      },
      
      // Weekly plan setters
      setWeeklyGoal: (goal: WorkoutGoal) => {
        set({ weeklyGoal: goal });
      },
      
      setWeeklyLevel: (level: ExperienceLevel) => {
        set({ weeklyLevel: level });
      },
      
      setWeeklyDuration: (duration: WeeklyPlanDuration) => {
        set({ weeklyDuration: duration });
      },
      
      setWeeklyFrequency: (frequency: WeeklyFrequency) => {
        set({ weeklyFrequency: frequency });
      },
      
      setWeeklyEquipment: (equipment: Equipment) => {
        set({ weeklyEquipment: equipment });
      },
      
      setWeeklyLimitations: (limitations: string) => {
        set({ weeklyLimitations: limitations });
      },
      
      // Piano generato
      setGeneratedPlan: (plan: WorkoutPlan) => {
        set({ generatedPlan: plan });
      },
      
      // Reset
      reset: () => {
        set({
          currentStep: 0,
          totalSteps: 0,
          planType: null,
          dailyGoal: undefined,
          dailyDuration: undefined,
          dailyEquipment: undefined,
          weeklyGoal: undefined,
          weeklyLevel: undefined,
          weeklyDuration: undefined,
          weeklyFrequency: undefined,
          weeklyEquipment: undefined,
          weeklyLimitations: undefined,
          generatedPlan: undefined,
        });
      },
    }),
    {
      name: 'plan-creation-storage', // localStorage key
      partialize: (state) => ({
        // Salva solo i dati necessari, non le funzioni
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        planType: state.planType,
        dailyGoal: state.dailyGoal,
        dailyDuration: state.dailyDuration,
        dailyEquipment: state.dailyEquipment,
        weeklyGoal: state.weeklyGoal,
        weeklyLevel: state.weeklyLevel,
        weeklyDuration: state.weeklyDuration,
        weeklyFrequency: state.weeklyFrequency,
        weeklyEquipment: state.weeklyEquipment,
        weeklyLimitations: state.weeklyLimitations,
        generatedPlan: state.generatedPlan,
      }),
    }
  )
);

