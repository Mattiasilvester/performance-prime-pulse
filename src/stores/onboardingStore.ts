import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingData {
  // Step 1
  obiettivo?: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare';
  // Step 2
  livelloEsperienza?: 'principiante' | 'intermedio' | 'avanzato';
  giorniSettimana?: number;
  // Step 3
  luoghiAllenamento?: string[];
  tempoSessione?: 15 | 30 | 45 | 60;
  possiedeAttrezzatura?: boolean;
  attrezzi?: string[];
  altriAttrezzi?: string;
  // Step 4
  nome?: string;
  eta?: number;
  peso?: number;
  altezza?: number;
  consigliNutrizionali?: boolean;
  // Step 5: Limitazioni fisiche e salute
  haLimitazioni?: boolean | null;
  limitazioniFisiche?: string;
  zoneEvitare?: string[];
  condizioniMediche?: string;
  allergieAlimentari?: string[];
}

interface OnboardingStore {
  currentStep: number;
  data: OnboardingData;
  isCompleted: boolean;
  
  // Actions
  setStep: (step: number) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      currentStep: 0, // Step 0 = Registration
      data: {},
      isCompleted: false,
      
      setStep: (step) => set({ currentStep: step }),
      
      updateData: (newData) => 
        set((state) => ({ 
          data: { ...state.data, ...newData } 
        })),
      
      nextStep: () => 
        set((state) => ({ 
          currentStep: Math.min(state.currentStep + 1, 6) 
        })),
      
      previousStep: () => 
        set((state) => ({ 
          currentStep: Math.max(state.currentStep - 1, 0) 
        })),
      
      resetOnboarding: () => 
        set({ 
          currentStep: 0, 
          data: {}, 
          isCompleted: false 
        }),
      
      completeOnboarding: () => 
        set({ isCompleted: true })
    }),
    {
      name: 'pp-onboarding-storage',
      partialize: (state) => ({ 
        data: state.data, 
        currentStep: state.currentStep 
      })
    }
  )
);

