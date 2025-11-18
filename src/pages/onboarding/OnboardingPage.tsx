import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { safeLocalStorage } from '@/utils/domHelpers';
import { supabase } from '@/integrations/supabase/client';
import { onboardingService } from '@/services/onboardingService';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
// Import steps
import type { Step2ExperienceHandle } from './steps/Step2Experience';
import type { Step3PreferencesHandle } from './steps/Step3Preferences';
import type { Step4PersonalizationHandle } from './steps/Step4Personalization';

const Step0Registration = lazy(() =>
  import('./steps/Step0Registration').then((mod) => ({ default: mod.Step0Registration }))
);
const Step1Goals = lazy(() =>
  import('./steps/Step1Goals').then((mod) => ({ default: mod.Step1Goals }))
);
const Step2Experience = lazy(() => import('./steps/Step2Experience'));
const Step3Preferences = lazy(() => import('./steps/Step3Preferences'));
const Step4Personalization = lazy(() => import('./steps/Step4Personalization'));
const CompletionScreen = lazy(() =>
  import('./steps/CompletionScreen').then((mod) => ({ default: mod.CompletionScreen }))
);

const StepFallback = () => (
  <div className="flex h-64 items-center justify-center text-gray-400">
    Caricamento...
  </div>
);

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isEditMode = searchParams.get('mode') === 'edit';
  const { 
    currentStep, 
    data,
    previousStep,
    nextStep,
    resetOnboarding,
    setStep,
    updateData
  } = useOnboardingStore();

  const [animatedProgress, setAnimatedProgress] = useState(0);
  const step2Ref = useRef<Step2ExperienceHandle>(null);
  const step3Ref = useRef<Step3PreferencesHandle>(null);
  const step4Ref = useRef<Step4PersonalizationHandle>(null);
  
  // ✅ FIX CRITICO: Ref per prevenire loop infinito in sync URL
  const urlSyncInProgress = useRef(false);
  
  // ✅ FIX: Usa handleNext e handleBack dal hook per aggiornare anche l'URL
  const { handleNext, handleBack: handleBackFromHook } = useOnboardingNavigation(isEditMode);
  
  // ✅ DEBUG: Log ogni cambio di currentStep
  useEffect(() => {
    console.log('🔢 currentStep changed to:', currentStep);
    console.log('📍 URL step param:', searchParams.get('step'));
    console.log('🎭 isEditMode:', isEditMode);
  }, [currentStep, searchParams, isEditMode]);
  
  // ✅ FASE 3: Carica dati esistenti in edit mode
  useEffect(() => {
    const loadExistingData = async () => {
      if (!isEditMode || !user?.id) return;

      try {
        console.log('📥 Edit mode: caricamento dati esistenti...');
        const existingData = await onboardingService.loadOnboardingData(user.id);

        if (existingData) {
          // Pre-compila lo store con i dati esistenti
          updateData({
            obiettivo: existingData.obiettivo,
            livelloEsperienza: existingData.livello_esperienza,
            giorniSettimana: existingData.giorni_settimana,
            luoghiAllenamento: existingData.luoghi_allenamento || [],
            tempoSessione: existingData.tempo_sessione,
            nome: existingData.nome,
            eta: existingData.eta,
            peso: existingData.peso,
            altezza: existingData.altezza,
            consigliNutrizionali: existingData.consigli_nutrizionali,
          });

          console.log('✅ Dati esistenti caricati:', existingData);
        }
      } catch (error) {
        console.error('❌ Errore caricamento dati esistenti:', error);
      }
    };

    loadExistingData();
  }, [isEditMode, user?.id, updateData]);

  // ✅ FASE 3: Inizializza step corrente in edit mode
  useEffect(() => {
    if (isEditMode) {
      // In edit mode, salta Step 0 e vai a Step 1
      if (currentStep === 0) {
        setStep(1);
      }
    }
  }, [isEditMode, currentStep, setStep]);
  
  // PRIMA: Leggi step dalla query string e imposta nello store (priorità alta)
  // ✅ FIX CRITICO: Questo useEffect deve reagire SOLO ai cambiamenti dell'URL, NON ai cambiamenti dello store
  // Rimuoviamo currentStep dalle dipendenze per evitare loop infinito
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const mode = searchParams.get('mode');
    
    // Leggi currentStep direttamente dallo store per evitare dipendenze
    const currentStepValue = useOnboardingStore.getState().currentStep;
    
    console.log('🔄 useEffect sync step triggered:', { stepParam, mode, currentStepValue });
    
    // ✅ FIX: In edit mode, sincronizza SOLO UNA VOLTA all'inizio
    if (mode === 'edit' && stepParam) {
      const stepNum = parseInt(stepParam, 10);
      
      // ✅ FIX FINALE: Se siamo su Completion (step 5), NON fare sync
      if (stepNum === 5) {
        console.log('✅ Edit mode: su Completion, skip sync');
        return;
      }
      
      // Se step è già quello giusto, NON fare nulla
      if (stepNum === currentStepValue) {
        console.log('✅ Edit mode: step già corretto, skip sync');
        return;
      }
      
      // Se step è diverso, sincronizza UNA VOLTA
      if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 4) {
        console.log('📥 Edit mode: syncing step from URL:', stepNum);
        setStep(stepNum);
        return;
      }
    }
    
    // ✅ FIX: In edit mode senza step nell'URL, vai a step 1
    if (mode === 'edit' && !stepParam) {
      console.log('📥 Edit mode: no step in URL, defaulting to 1');
      setStep(1);
      setSearchParams({ mode: 'edit', step: '1' }, { replace: true });
      return;
    }
    
    // Comportamento normale per nuovo onboarding (non edit mode)
    // ✅ FIX CRITICO: Solo se c'è uno stepParam nell'URL E non corrisponde allo store, sincronizza
    if (stepParam !== null && mode !== 'edit') {
      const stepNum = parseInt(stepParam, 10);
      if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 5) {
        if (stepNum !== currentStepValue) {
          console.log('📥 Normal mode: syncing step from URL:', stepNum, 'to store (current:', currentStepValue, ')');
          setStep(stepNum);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setStep, setSearchParams, isEditMode]); // ✅ RIMOSSO currentStep dalle dipendenze!
  
  // Sincronizza URL quando cambia currentStep (ma solo se non c'è già un parametro step nell'URL)
  useEffect(() => {
    console.log('=== useEffect sync URL START ===');
    console.log('📊 State:', {
      currentStep,
      isEditMode,
      urlStepParam: searchParams.get('step'),
      urlMode: searchParams.get('mode'),
      urlSyncInProgress: urlSyncInProgress.current
    });
    
    // ✅ FIX CRITICO: Previeni loop infinito
    if (urlSyncInProgress.current) {
      console.log('⏸️ URL sync already in progress, skipping');
      console.log('=== useEffect sync URL END (skipped - in progress) ===');
      return;
    }
    
    // ✅ FIX: In edit mode, NON modificare URL se è già corretto
    if (isEditMode) {
      const stepParam = searchParams.get('step');
      const mode = searchParams.get('mode');
      
      console.log('🎭 Edit mode detected');
      console.log('🔍 Checking:', {
        mode,
        stepParam,
        currentStep,
        stepParamParsed: stepParam ? parseInt(stepParam, 10) : null,
        shouldSkip: mode === 'edit' && stepParam && parseInt(stepParam, 10) === currentStep
      });
      
      // Se URL ha già mode=edit e step corretto, NON fare nulla
      if (mode === 'edit' && stepParam && parseInt(stepParam, 10) === currentStep) {
        console.log('✅ Edit mode: URL già corretto, skip update');
        console.log('=== useEffect sync URL END (skipped - already correct) ===');
        return;
      }
      
      // Se URL non è corretto, aggiornalo UNA VOLTA
      console.log('📤 Edit mode: updating URL to match currentStep:', currentStep);
      console.log('🔧 Calling setSearchParams with:', { mode: 'edit', step: currentStep.toString() });
      
      urlSyncInProgress.current = true;
      setSearchParams({ mode: 'edit', step: currentStep.toString() }, { replace: true });
      
      // Reset dopo un breve delay
      setTimeout(() => {
        urlSyncInProgress.current = false;
        console.log('🔄 urlSyncInProgress reset to false');
      }, 100);
      
      console.log('=== useEffect sync URL END (updated) ===');
      return;
    }
    
    // Comportamento normale per nuovo onboarding
    const stepParam = searchParams.get('step');
    console.log('🆕 Normal mode');
    if (stepParam === null || parseInt(stepParam, 10) !== currentStep) {
      console.log('📤 Normal mode: updating URL to match currentStep:', currentStep);
      setSearchParams({ step: currentStep.toString() }, { replace: true });
    }
    console.log('=== useEffect sync URL END ===');
  }, [currentStep, setSearchParams, isEditMode]); // ✅ FIX CRITICO: searchParams RIMOSSO dalle dependencies!

  // SECONDO: Controllo se utente è già loggato - redirect a dashboard (solo se non c'è step nell'URL E non siamo in onboarding)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // ✅ FASE 3: Se siamo in edit mode, NON fare redirect (utente vuole modificare preferenze)
      if (isEditMode) {
        console.log('Edit mode attivo, skipping auth redirect');
        return;
      }
      
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
  }, [navigate, searchParams, currentStep, isEditMode]);

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

  // ✅ AUTO-SCROLL: Scrolla in cima alla pagina quando cambia step
  // Migliora UX assicurando che l'utente veda sempre l'inizio del nuovo step
  useEffect(() => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }, [currentStep]);

  const handleBack = () => {
    if (currentStep === 0) {
      // Se siamo allo step 0 (Registrazione), tornare alla landing page
      // Questo caso dovrebbe essere irraggiungibile se il bottone "Indietro" è nascosto su step 0
      navigate('/');
    } else {
      // ✅ FIX: Usa handleBack dal hook per aggiornare anche l'URL in edit mode
      handleBackFromHook();
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
      {/* ✅ MODIFICA 2: Banner solo durante edit attivo (Step 1-4), non su Completion */}
      {isEditMode && currentStep >= 1 && currentStep <= 4 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border-b border-[#FFD700]/30 py-3 px-4"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <p className="text-white font-semibold text-sm">
                Modifica delle Preferenze
              </p>
              <p className="text-gray-300 text-xs">
                Aggiorna le tue preferenze di allenamento
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
              <Suspense key="step0" fallback={<StepFallback />}>
                <Step0Registration />
              </Suspense>
            )}

            {currentStep === 1 && (
              <Suspense key="step1" fallback={<StepFallback />}>
                <Step1Goals isEditMode={isEditMode} />
              </Suspense>
            )}

            {currentStep === 2 && (
              <Suspense key="step2" fallback={<StepFallback />}>
                <Step2Experience 
                  ref={step2Ref}
                  onComplete={handleNext}
                  isEditMode={isEditMode}
                />
              </Suspense>
            )}

            {currentStep === 3 && (
              <Suspense key="step3" fallback={<StepFallback />}>
                <Step3Preferences 
                  ref={step3Ref}
                  onComplete={handleNext}
                  isEditMode={isEditMode}
                />
              </Suspense>
            )}

            {currentStep === 4 && (
              <Suspense key="step4" fallback={<StepFallback />}>
                <Step4Personalization 
                  ref={step4Ref}
                  onComplete={handleNext}
                  isEditMode={isEditMode}
                />
              </Suspense>
            )}

            {currentStep === 5 && (
              <Suspense key="completion" fallback={<StepFallback />}>
                <CompletionScreen />
              </Suspense>
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
                      handleNext(); // ✅ ROLLBACK: Ripristina handleNext
                    } else if (currentStep === 2) {
                      step2Ref.current?.handleContinue();
                    } else if (currentStep === 3) {
                      step3Ref.current?.handleContinue();
                    }
                  }}
                  size="lg"
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12"
                >
                  {isEditMode ? 'Salva e Continua' : 'Continua'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              
              {/* Bottone Completa solo su step 4 */}
              {currentStep === 4 && (
                <Button
                  onClick={() => {
                    console.log('╔════════════════════════════════════════╗');
                    console.log('║   BUTTON SALVA MODIFICHE CLICKED       ║');
                    console.log('╚════════════════════════════════════════╝');
                    console.log('🖱️ User clicked "Salva Modifiche"');
                    console.log('📊 State before handleContinue:', {
                      isEditMode,
                      currentStep,
                      step4RefExists: !!step4Ref.current,
                      step4HandleContinueExists: !!step4Ref.current?.handleContinue
                    });
                    
                    step4Ref.current?.handleContinue();
                    
                    console.log('📤 handleContinue() called');
                    console.log('╔════════════════════════════════════════╗');
                    console.log('║   BUTTON CLICK HANDLER ENDED           ║');
                    console.log('╚════════════════════════════════════════╝');
                  }}
                  size="lg"
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12"
                >
                  {isEditMode ? 'Salva Modifiche' : 'Completa Onboarding'}
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
