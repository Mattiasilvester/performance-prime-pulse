import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { safeLocalStorage } from '@/utils/domHelpers';
import { supabase } from '@/integrations/supabase/client';
// Import steps
import { Step0Registration } from './steps/Step0Registration';
import { Step1Goals } from './steps/Step1Goals';
import Step2Experience, { Step2ExperienceHandle } from './steps/Step2Experience';
import Step3Preferences, { Step3PreferencesHandle } from './steps/Step3Preferences';
import Step4Personalization, { Step4PersonalizationHandle } from './steps/Step4Personalization';
import { CompletionScreen } from './steps/CompletionScreen';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    currentStep, 
    data,
    previousStep,
    nextStep,
    resetOnboarding,
    setStep
  } = useOnboardingStore();

  const [animatedProgress, setAnimatedProgress] = useState(0);
  const step2Ref = useRef<Step2ExperienceHandle>(null);
  const step3Ref = useRef<Step3PreferencesHandle>(null);
  const step4Ref = useRef<Step4PersonalizationHandle>(null);
  
  // PRIMA: Leggi step dalla query string e imposta nello store (priorità alta)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
      const stepNum = parseInt(stepParam, 10);
      if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 5) {
        // Solo aggiorna se lo step nell'URL è diverso da quello nello store
        // Questo evita loop infiniti quando nextStep() aggiorna lo store
        if (stepNum !== currentStep) {
          console.log('URL step parameter detected:', stepNum, 'Setting step in store...');
          setStep(stepNum);
        }
      }
    } else {
      // Se non c'è parametro step nell'URL, aggiorna l'URL con lo step corrente dallo store
      setSearchParams({ step: currentStep.toString() }, { replace: true });
    }
  }, [searchParams, setStep, setSearchParams]);
  
  // Sincronizza URL quando cambia currentStep (ma solo se non c'è già un parametro step nell'URL)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === null || parseInt(stepParam, 10) !== currentStep) {
      // Aggiorna URL solo se non c'è parametro o se è diverso dallo step corrente
      setSearchParams({ step: currentStep.toString() }, { replace: true });
    }
  }, [currentStep, setSearchParams]);

  // SECONDO: Controllo se utente è già loggato - redirect a dashboard (solo se non c'è step nell'URL E non siamo in onboarding)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Se c'è un parametro step nell'URL, NON fare redirect (permette navigazione diretta)
      const stepParam = searchParams.get('step');
      if (stepParam !== null) {
        console.log('Step parameter in URL, skipping auth redirect');
        return;
      }
      
      // Se siamo nello step 0 (registrazione), NON fare redirect (utente si sta registrando)
      if (currentStep === 0) {
        console.log('Step 0 (registration), skipping auth redirect');
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Utente già loggato - redirect a dashboard');
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Errore controllo sessione:', error);
      }
    };
  
    checkAuthAndRedirect();
  }, [navigate, searchParams, currentStep]);

  useEffect(() => {
    safeLocalStorage.setItem('isOnboarding', 'true');
    trackOnboarding.started();

    // Cleanup quando il componente viene smontato (utente esce dall'onboarding)
    return () => {
      safeLocalStorage.removeItem('isOnboarding');
      
      // Solo se NON ha completato (currentStep < 5)
      const currentStepOnUnmount = useOnboardingStore.getState().currentStep;
      if (currentStepOnUnmount < 5) {
        console.log('Utente uscito dall\'onboarding senza completare - reset state');
        resetOnboarding();
      }
    };
  }, [resetOnboarding]);

  useEffect(() => {
    trackOnboarding.stepViewed(currentStep);
    // Animate progress bar (only for steps 1-4, not step 0 or completion)
    if (currentStep >= 1 && currentStep <= 4) {
      const progressPercentage = (currentStep / 4) * 100; // 4 steps (1-4) = 25%, 50%, 75%, 100%
      setAnimatedProgress(progressPercentage);
    } else {
      setAnimatedProgress(0);
    }
  }, [currentStep]);


  const handleBack = () => {
    if (currentStep === 0) {
      // Se siamo allo step 0 (Registrazione), tornare alla landing page
      // Questo caso dovrebbe essere irraggiungibile se il bottone "Indietro" è nascosto su step 0
      navigate('/');
    } else {
      // Per tutti gli altri step (da 1 a 4), torna allo step precedente
      // previousStep() gestirà correttamente il passaggio da 1 a 0
      previousStep();
    }
  };

  const progressPercentage = currentStep === 0 ? 0 : currentStep <= 4 ? (currentStep / 4) * 100 : 100;

  const getStepTitle = () => {
    switch(currentStep) {
      case 0: return 'Registrazione';
      case 1: return 'Il tuo obiettivo';
      case 2: return 'La tua esperienza';
      case 3: return 'Le tue preferenze';
      case 4: return 'Personalizzazione';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Progress Bar - Hidden on step 0 and completion screen */}
      {currentStep >= 1 && currentStep < 5 && (
        <div className="p-4 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto">
            <Progress 
              value={animatedProgress} 
              className="h-2 bg-gray-800"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-400">
                Passo {currentStep} di 4
              </span>
              <span className="text-sm font-medium text-[#FFD700]">
                {getStepTitle()}
              </span>
              <span className="text-sm text-[#FFD700]">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <Step0Registration key="step0" />
            )}

            {currentStep === 1 && (
              <Step1Goals key="step1" />
            )}

            {currentStep === 2 && (
              <Step2Experience 
                key="step2" 
                ref={step2Ref}
                onComplete={nextStep}
              />
            )}

            {currentStep === 3 && (
              <Step3Preferences 
                key="step3" 
                ref={step3Ref}
                onComplete={nextStep}
              />
            )}

            {currentStep === 4 && (
              <Step4Personalization 
                key="step4" 
                ref={step4Ref}
                onComplete={nextStep}
              />
            )}

            {currentStep === 5 && (
              <CompletionScreen key="completion" />
            )}
          </AnimatePresence>

          {/* Navigation - Nascosta su step 0 e completion screen */}
          {currentStep >= 1 && currentStep <= 4 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-between items-center max-w-3xl mx-auto mt-8"
            >
              {/* Bottone Indietro - visibile da step 1 in poi */}
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Indietro
              </Button>
              
              {/* Bottone Continua per step 1, 2, 3 */}
              {currentStep >= 1 && currentStep <= 3 && (
                <Button
                  onClick={() => {
                    if (currentStep === 1) {
                      trackOnboarding.stepCompleted(1, { obiettivo: data.obiettivo });
                      nextStep();
                    } else if (currentStep === 2) {
                      step2Ref.current?.handleContinue();
                    } else if (currentStep === 3) {
                      step3Ref.current?.handleContinue();
                    }
                  }}
                  size="lg"
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12"
                >
                  Continua
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              
              {/* Bottone Completa solo su step 4 */}
              {currentStep === 4 && (
                <Button
                  onClick={() => step4Ref.current?.handleContinue()}
                  size="lg"
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12"
                >
                  Completa Onboarding
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
