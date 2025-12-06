import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getAIResponse } from '@/lib/openai-service';
import { getPrimeBotFallbackResponse } from '@/lib/primebot-fallback';
import { fetchUserProfile } from '@/services/userService';
import { usePrimeBot } from '@/contexts/PrimeBotContext';
import {
  getOrCreateSessionId,
  saveInteraction,
  type PrimeBotInteraction,
} from '@/services/primebotConversationService';
import {
  executeAction,
  type ActionType,
} from '@/services/primebotActionsService';
import { 
  generateOnboardingSummaryMessage,
  updateOnboardingPreference,
  parseModifyRequest
} from '@/services/primebotUserContextService';
import usePainTracking from '@/hooks/usePainTracking';
import { ActionButton } from '@/components/primebot/ActionButton';
import { toast } from 'sonner';
import { getStructuredWorkoutPlan } from '@/lib/openai-service';
import { type StructuredWorkoutPlan } from '@/services/workoutPlanGenerator';
import { HealthDisclaimer } from '@/components/primebot/HealthDisclaimer';
import { ExerciseGifLink } from '@/components/workouts/ExerciseGifLink';
// ⭐ FIX BUG 3: Import per analisi dolore nel messaggio corrente
import { detectBodyPartFromMessage } from '@/data/bodyPartExclusions';
import { addPain } from '@/services/painTrackingService';

export interface ParsedAction {
  type: ActionType;
  label: string;
  payload: any;
}

type Msg = { 
  id: string; 
  role: 'user' | 'bot'; 
  text: string; 
  navigation?: { 
    path: string; 
    label: string; 
    action: string; 
  };
  isDisclaimer?: boolean;
  actions?: ParsedAction[]; // Azioni estratte dalla risposta AI
  workoutPlan?: StructuredWorkoutPlan; // Piano allenamento strutturato
};

interface PrimeChatProps {
  isModal?: boolean;
}

/**
 * Rileva se la richiesta è per un piano di allenamento
 */
function isWorkoutPlanRequest(text: string): boolean {
  const keywords = [
    'piano',
    'programma',
    'scheda',
    'allenamento per',
    'creami',
    'fammi',
    'genera',
    'crea un piano',
    'fammi un piano',
    'mi serve un piano',
    'voglio un piano',
  ];
  
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword));
}

/**
 * Parsa pattern [ACTION:tipo:label:payload] dalla risposta AI
 * Ritorna testo pulito e array di azioni
 */
function parseActionsFromText(text: string): { cleanText: string; actions: ParsedAction[] } {
  const actionPattern = /\[ACTION:([^:]+):([^:]+):([^\]]+)\]/g;
  const actions: ParsedAction[] = [];
  let cleanText = text;
  let match;

  while ((match = actionPattern.exec(text)) !== null) {
    const [, type, label, payloadStr] = match;
    
    try {
      const payload = JSON.parse(payloadStr);
      actions.push({
        type: type as ActionType,
        label: label.trim(),
        payload,
      });
      
      // Rimuovi il pattern dal testo visibile
      cleanText = cleanText.replace(match[0], '');
    } catch (error) {
      console.warn('⚠️ Errore parsing payload azione:', error);
      // Rimuovi comunque il pattern anche se il parsing fallisce
      cleanText = cleanText.replace(match[0], '');
    }
  }

  // Pulisci spazi multipli e newline extra
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanText, actions };
}

// Funzione per formattare markdown senza librerie
const renderFormattedMessage = (text: string) => {
  if (!text) return null;
  
  // Splitta per ** e processa
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Grassetto
      return <strong key={index} className="font-bold text-yellow-400">
        {part.slice(2, -2)}
      </strong>;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      // Corsivo
      return <em key={index} className="italic">
        {part.slice(1, -1)}
      </em>;
    }
    // Testo normale
    return <span key={index}>{part}</span>;
  });
};

export default function PrimeChat({ isModal = false }: PrimeChatProps) {
  const navigate = useNavigate();
  const { setIsFullscreen } = usePrimeBot();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [showPlanDisclaimer, setShowPlanDisclaimer] = useState(false);
  const [awaitingLimitationsResponse, setAwaitingLimitationsResponse] = useState(false);
  const [originalWorkoutRequest, setOriginalWorkoutRequest] = useState<string | null>(null);

  // Voiceflow rimosso - ora usa solo OpenAI
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  // Pain tracking hooks
  const { 
    pains, 
    loading: painsLoading, 
    painCheckMessage,
    handlePainGone, 
    handlePainStillPresent, 
    handleAllPainsGone,
    handleNewPain,
    refreshPains 
  } = usePainTracking(userId && !userId.startsWith('guest-') ? userId : null);

  const [waitingForPainResponse, setWaitingForPainResponse] = useState(false);
  const [currentPainZone, setCurrentPainZone] = useState<string | null>(null);

  // Stati per riepilogo onboarding
  const [waitingForPlanConfirmation, setWaitingForPlanConfirmation] = useState(false);
  const [pendingPlanRequest, setPendingPlanRequest] = useState<string | null>(null);

  // Stati per modifica preferenze in chat
  const [waitingForModifyChoice, setWaitingForModifyChoice] = useState(false);
  const [waitingForModifyValue, setWaitingForModifyValue] = useState<string | null>(null); // quale campo sta modificando

  // Flag per evitare duplicazione messaggio utente
  const [skipUserMessageAdd, setSkipUserMessageAdd] = useState(false);

  // Flag per aspettare conferma piano dopo dolore
  const [waitingForPainPlanConfirmation, setWaitingForPainPlanConfirmation] = useState(false);

  // ⭐ FIX BUG 2: Flag per saltare il fallback quando si passa dall'LLM dopo waitingForPainPlanConfirmation
  const [skipFallbackCheck, setSkipFallbackCheck] = useState(false);

  // ⭐ FIX BUG 3: Stato per gestire dolore rilevato nel messaggio corrente
  const [waitingForPainDetails, setWaitingForPainDetails] = useState(false);
  const [tempPainBodyPart, setTempPainBodyPart] = useState<string | null>(null);

  // Helper function to add bot message
  const addBotMessage = useCallback((text: string) => {
    setMsgs(prev => [...prev, { 
      id: crypto.randomUUID(),
      role: 'bot' as const, 
      text: text
    }]);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

  // Focus automatico quando si apre la chat
  useEffect(() => {
    if (hasStartedChat && msgs.length > 0) {
      setTimeout(() => {
        const inputElement = document.querySelector('input[aria-label="Scrivi la tua domanda"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          console.log('🎯 FOCUS AUTOMATICO APPLICATO VIA useEffect');
        }
      }, 200);
    }
  }, [hasStartedChat, msgs.length]);

  // DEBUG: Esponi funzione reset limitazioni nella console per test
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && !userId.startsWith('guest-')) {
      (window as any).resetHealthLimitations = async () => {
        const { resetHealthLimitations } = await import('@/services/primebotUserContextService');
        const result = await resetHealthLimitations(userId);
        if (result) {
          console.log('✅ Limitazioni fisiche resettate! Ricarica la pagina e riprova.');
          alert('✅ Limitazioni fisiche resettate! Ricarica la pagina e riprova.');
        } else {
          console.error('❌ Errore nel reset delle limitazioni');
          alert('❌ Errore nel reset delle limitazioni');
        }
      };
      console.log('🔧 DEBUG: Usa resetHealthLimitations() nella console per resettare i dati di limitazioni');
    }
  }, [userId]);

  useEffect(() => {
    console.log('useEffect PRINCIPALE: INIZIO');
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const id = user?.id || userId;
        
        // Usa il servizio userService per ottenere il nome utente
        let userProfile;
        let fullName = 'Utente';
        let email = '';
        
        try {
          userProfile = await fetchUserProfile();
          fullName = userProfile?.name || 'Utente';
          email = user?.email || '';
        } catch (e) {
          console.warn('Error fetching user profile:', e);
          fullName = 'Utente';
        }

        setUserId(id);
        setUserName(fullName);
        setUserEmail(email);
        
        console.log('useEffect PRINCIPALE: setUserId, setUserName, setUserEmail');

        // Recupera o crea session ID per la conversazione
        try {
          const currentSessionId = await getOrCreateSessionId(id);
          setSessionId(currentSessionId);
          console.log('✅ Session ID recuperato/creato:', currentSessionId.substring(0, 8) + '...');
        } catch (sessionError) {
          console.warn('⚠️ Errore recupero session ID (continuo comunque):', sessionError);
          // Continua senza session ID se il recupero fallisce
        }

        // Controlla se è un nuovo utente
        const userOnboarded = localStorage.getItem(`user_onboarded_${id}`);
        const isFirstVisit = !sessionStorage.getItem(`first_visit_${id}`);
        
        if (!userOnboarded && isFirstVisit) {
          setIsNewUser(true);
          sessionStorage.setItem(`first_visit_${id}`, 'true');
        }
        
        // NON aggiungere messaggi automaticamente - mostra sempre la Landing Page inizialmente
        // I messaggi vengono gestiti solo dal bottone "Inizia Chat"
        console.log('useEffect PRINCIPALE: FINE - non aggiungo messaggi automaticamente');

        // Voiceflow rimosso - ora usa solo OpenAI
      } catch (error) {
        console.error('Error in PrimeChat useEffect:', error);
        // NON aggiungere messaggi automaticamente - mantieni la Landing Page
        // I messaggi vengono gestiti solo dal bottone "Inizia Chat"
      }
    })();
  }, []);

  // Ricarica dolori quando userId cambia da guest a reale
  useEffect(() => {
    if (userId && !userId.startsWith('guest-')) {
      console.log('🔄 userId cambiato da guest a reale, ricarico dolori:', userId.substring(0, 8) + '...');
      refreshPains();
    }
  }, [userId, refreshPains]);

  /**
   * Distingue se una zona del corpo nel messaggio è riferita a DOLORE o ZONA TARGET allenamento
   * @param message - Il messaggio dell'utente
   * @param bodyPart - La zona del corpo rilevata
   * @returns true se è contesto DOLORE, false se è ZONA TARGET
   */
  function isBodyPartForPain(message: string, bodyPart: string): boolean {
    const messageLower = message.toLowerCase();
    
    // Keywords che indicano DOLORE
    const painKeywords = [
      'dolore', 'dolori', 'male', 'mal di', 'fa male', 'mi fa male',
      'soffro', 'fastidio', 'brucia', 'tira', 'blocco', 'bloccato',
      'ferito', 'infortunio', 'infortunato', 'problema', 'problemi',
      'limitazione', 'limitazioni', 'lesione', 'lesioni',
      'distorsione', 'stiramento', 'strappo'
    ];
    
    // Keywords che indicano ZONA TARGET (allenamento)
    const targetKeywords = [
      'piano per', 'allenamento per', 'workout per', 'scheda per',
      'programma per', 'esercizi per', 'per il', 'per la', 'per i', 'per le',
      'allenare', 'voglio allenare', 'vorrei allenare',
      'creami', 'fammi', 'genera', 'prepara',
      'voglio', 'vorrei', 'mi piacerebbe'
    ];
    
    // Controlla se c'è keyword DOLORE nel messaggio
    const hasPainKeyword = painKeywords.some(kw => messageLower.includes(kw));
    
    // Controlla se c'è keyword TARGET nel messaggio
    const hasTargetKeyword = targetKeywords.some(kw => messageLower.includes(kw));
    
    console.log(`🔍 isBodyPartForPain("${message}", "${bodyPart}"): painKw=${hasPainKeyword}, targetKw=${hasTargetKeyword}`);
    
    // LOGICA DECISIONALE:
    // 1. Se ha keyword dolore E NON ha keyword target → è DOLORE
    if (hasPainKeyword && !hasTargetKeyword) {
      console.log('→ Risultato: DOLORE (painKw=true, targetKw=false)');
      return true;
    }
    
    // 2. Se ha keyword target E NON ha keyword dolore → è TARGET
    if (hasTargetKeyword && !hasPainKeyword) {
      console.log('→ Risultato: TARGET (targetKw=true, painKw=false)');
      return false;
    }
    
    // 3. Se ha ENTRAMBE → è DOLORE (caso "ho mal di ginocchio e voglio un piano")
    if (hasPainKeyword && hasTargetKeyword) {
      console.log('→ Risultato: DOLORE (entrambe le keywords presenti)');
      return true;
    }
    
    // 4. Se NON ha nessuna keyword → default TARGET (es. "petto" da solo)
    console.log('→ Risultato: TARGET (nessuna keyword specifica)');
    return false;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    
    // === CONTROLLO DUPLICAZIONE MESSAGGIO - ALL'INIZIO ===
    // Flag per evitare duplicazione - controllato PRIMA di qualsiasi logica
    let shouldAddUserMessage = true;
    
    // Se skipUserMessageAdd è true, non aggiungere il messaggio
    if (skipUserMessageAdd) {
      shouldAddUserMessage = false;
      setSkipUserMessageAdd(false); // Reset per la prossima volta
    }
    
    // === SISTEMA TRACKING DOLORI - INIZIO ===
    // ⭐ FIX BUG 6: Log di debug per tracciare stato
    console.log('🔍 BUG 6 DEBUG: waitingForPainResponse =', waitingForPainResponse, 'message =', trimmed);
    
    if (waitingForPainResponse && trimmed) {
      console.log('✅ BUG 6: waitingForPainResponse è attivo, gestisco risposta dolore');
      
      // AGGIUNGI SUBITO il messaggio dell'utente alla chat
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed
        }]);
        shouldAddUserMessage = false; // Evita duplicazione
      }
      setInput(''); // Pulisci input dopo aver aggiunto il messaggio
      
      const userMessageLower = trimmed.toLowerCase();
      
      // Utente dice che il dolore è passato
      const isPainGone = userMessageLower.includes('passato') || 
                         userMessageLower.includes('meglio') || 
                         userMessageLower.includes('guarito') || 
                         userMessageLower.includes('ok') ||
                         userMessageLower.includes('sì') || 
                         userMessageLower.includes('si');
      
      console.log('🔍 BUG 6: isPainGone =', isPainGone, 'currentPainZone =', currentPainZone);
      
      if (isPainGone) {
        // Tutti i dolori passati
        if (userMessageLower.includes('tutti') || userMessageLower.includes('tutto')) {
          console.log('🗑️ BUG 7 DEBUG: Rimuovo TUTTI i dolori');
          const response = await handleAllPainsGone();
          console.log('🗑️ BUG 7 DEBUG: Risultato handleAllPainsGone:', response);
          setWaitingForPainResponse(false);
          setCurrentPainZone(null);
          // ⭐ FIX BUG 7: Ricarica dolori dopo rimozione
          await refreshPains();
          addBotMessage(response);
          setInput('');
          return;
        }
        
        // Singolo dolore passato
        if (currentPainZone) {
          console.log('🗑️ BUG 7 DEBUG: Chiamando handlePainGone per zona:', currentPainZone);
          const response = await handlePainGone(currentPainZone);
          console.log('🗑️ BUG 7 DEBUG: Risultato handlePainGone:', response);
          setWaitingForPainResponse(false);
          setCurrentPainZone(null);
          // ⭐ FIX BUG 7: Ricarica dolori dopo rimozione
          await refreshPains();
          addBotMessage(response);
          setInput('');
          return;
        } else if (pains.length > 0) {
          // ⭐ FIX BUG 7: Se currentPainZone è null ma ci sono dolori, usa il primo
          console.log('🗑️ BUG 7 DEBUG: currentPainZone è null, uso primo dolore:', pains[0].zona);
          const zonaToRemove = pains[0].zona;
          const response = await handlePainGone(zonaToRemove);
          console.log('🗑️ BUG 7 DEBUG: Risultato handlePainGone:', response);
          setWaitingForPainResponse(false);
          setCurrentPainZone(null);
          // ⭐ FIX BUG 7: Ricarica dolori dopo rimozione
          await refreshPains();
          addBotMessage(response);
          setInput('');
          return;
        }
      }
      
      // Utente dice che il dolore c'è ancora
      const isPainStill = userMessageLower.includes('ancora') || 
                          userMessageLower.includes('male') || 
                          userMessageLower.includes('no') || 
                          userMessageLower.includes('persiste') ||
                          userMessageLower.includes('fa male');
      
      if (isPainStill && currentPainZone) {
        const response = handlePainStillPresent(currentPainZone);
        setWaitingForPainResponse(false);
        setCurrentPainZone(null);
        addBotMessage(response);
        // NON return - lascia continuare per generare piano con whitelist
      }
    }
    
    // ⭐ FIX BUG 3: Gestisci risposta dettagli dolore dal messaggio corrente
    if (waitingForPainDetails && trimmed && tempPainBodyPart) {
      console.log('🩺 FIX BUG 3: Gestisco risposta dettagli dolore dal messaggio:', trimmed);
      
      // Aggiungi messaggio utente
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed
        }]);
        shouldAddUserMessage = false;
      }
      setInput('');
      
      // Estrai lato dal messaggio (destro/sinistro/entrambi)
      const side = trimmed.toLowerCase();
      const isBoth = side.includes('entrambi') || side.includes('tutti e due') || side.includes('entrambe');
      const isLeft = side.includes('sinistro') || side.includes('sinistra');
      const isRight = side.includes('destro') || side.includes('destra');
      
      // Normalizza zona con lato se necessario
      let finalZone = tempPainBodyPart;
      const needsSide = ['ginocchio', 'spalla', 'anca', 'gomito', 'polso', 'caviglia'].includes(tempPainBodyPart.toLowerCase());
      
      if (needsSide) {
        if (isBoth) {
          finalZone = `${tempPainBodyPart} entrambi`;
        } else if (isLeft) {
          finalZone = `${tempPainBodyPart} sinistro`;
        } else if (isRight) {
          finalZone = `${tempPainBodyPart} destro`;
        }
      }
      
      // Salva dolore nel database
      try {
        const result = await addPain(userId, finalZone, `Dolore rilevato durante richiesta piano: "${trimmed}"`, 'chat');
        
        if (result.success) {
          console.log('✅ FIX BUG 3: Dolore salvato:', finalZone);
          // Aggiorna pains locale
          await refreshPains();
          
          // Reset stati temporanei
          setWaitingForPainDetails(false);
          setTempPainBodyPart(null);
          
          // Conferma all'utente
          addBotMessage(`Grazie! Ho registrato il tuo dolore a ${finalZone}. Ora procedo con la creazione del piano personalizzato che terrà conto di questa limitazione. 💪`);
          
          // ⭐ FIX BUG 3 PARTE 2: Genera piano IMMEDIATAMENTE dopo salvataggio dolore
          setLoading(true);
          
          try {
            console.log('🏋️ FIX BUG 3 PARTE 2: Genero piano considerando limitazione:', finalZone);
            
            // Assicurati di avere sessionId
            let currentSessionId = sessionId;
            if (!currentSessionId) {
              currentSessionId = await getOrCreateSessionId(userId);
              setSessionId(currentSessionId);
            }
            
            // Richiesta piano che considera le limitazioni
            const planRequest = `Creami un piano di allenamento personalizzato considerando le mie limitazioni fisiche`;
            
            const planResponse = await getStructuredWorkoutPlan(
              planRequest,
              userId,
              currentSessionId || undefined
            );
            
            console.log('✅ FIX BUG 3 PARTE 2: getStructuredWorkoutPlan completato:', {
              success: planResponse.success,
              type: planResponse.type,
              hasPlan: !!planResponse.plan,
              hasQuestion: !!planResponse.question,
              hasExistingLimitations: planResponse.hasExistingLimitations,
            });
            
            setLoading(false);
            
            // Gestisci risposta piano
            if (planResponse.type === 'question' && planResponse.question) {
              // Domanda limitazioni (caso raro, ma gestito)
              setMsgs(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'bot' as const,
                text: planResponse.question,
              }]);
              setAwaitingLimitationsResponse(true);
              setOriginalWorkoutRequest(planRequest);
              return;
            }
            
            if (planResponse.success && planResponse.plan) {
              // Mostra piano con disclaimer per limitazioni
              if (planResponse.hasExistingLimitations && (planResponse as any).hasAnsweredBefore) {
                // Mostra disclaimer
                setPendingPlan({
                  plan: planResponse.plan,
                  hasLimitations: planResponse.hasExistingLimitations ?? false,
                  actions: [
                    {
                      type: 'save_workout',
                      label: 'Salva questo piano',
                      payload: {
                        name: planResponse.plan.name,
                        workout_type: planResponse.plan.workout_type,
                        exercises: planResponse.plan.exercises.map((ex: any) => ({
                          name: ex.name,
                          sets: ex.sets,
                          reps: ex.reps,
                          rest_seconds: ex.rest_seconds,
                          notes: ex.notes,
                        })),
                        duration: planResponse.plan.duration_minutes,
                      },
                    },
                  ],
                });
                setShowPlanDisclaimer(true);
              } else {
                // Mostra piano direttamente
                const botMessage: Msg = {
                  id: crypto.randomUUID(),
                  role: 'bot' as const,
                  text: `Ecco il tuo piano di allenamento personalizzato! Ho tenuto conto del tuo dolore al ${finalZone} per creare un programma sicuro per te. 💪`,
                  workoutPlan: planResponse.plan,
                  actions: [
                    {
                      type: 'save_workout',
                      label: 'Salva questo piano',
                      payload: {
                        name: planResponse.plan.name,
                        workout_type: planResponse.plan.workout_type,
                        exercises: planResponse.plan.exercises.map((ex: any) => ({
                          name: ex.name,
                          sets: ex.sets,
                          reps: ex.reps,
                          rest_seconds: ex.rest_seconds,
                          notes: ex.notes,
                        })),
                        duration: planResponse.plan.duration_minutes,
                      },
                    },
                  ],
                };
                setMsgs(prev => [...prev, botMessage]);
              }
              return; // ⭐ IMPORTANTE: esci qui per evitare chiamata LLM generica
            }
            
            // Errore o caso non gestito
            setMsgs(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.message || 'Errore nella generazione del piano. Riprova!',
            }]);
            return;
            
          } catch (error) {
            console.error('❌ FIX BUG 3 PARTE 2: Errore generazione piano dopo dolore:', error);
            setLoading(false);
            setMsgs(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: 'Ops, ho avuto un problema tecnico nella generazione del piano. Riprova tra qualche secondo.',
            }]);
            return;
          }
        } else {
          console.error('❌ FIX BUG 3: Errore salvataggio dolore:', result.error);
          addBotMessage('Mi dispiace, c\'è stato un problema nel salvare il dolore. Procedo comunque con la creazione del piano.');
          setWaitingForPainDetails(false);
          setTempPainBodyPart(null);
        }
      } catch (error) {
        console.error('❌ FIX BUG 3: Errore salvataggio dolore:', error);
        addBotMessage('Mi dispiace, c\'è stato un problema. Procedo comunque con la creazione del piano.');
        setWaitingForPainDetails(false);
        setTempPainBodyPart(null);
      }
    }
    
    // === SISTEMA CONFERMA PIANO DOPO DOLORE ===
    if (waitingForPainPlanConfirmation && trimmed) {
      console.log('🩺 Gestisco risposta conferma piano dopo dolore');
      
      // Aggiungi messaggio utente
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed
        }]);
        shouldAddUserMessage = false; // Evita duplicazione
      }
      setInput('');
      
      const userResponseLower = trimmed.toLowerCase();
      
      // Utente conferma → procedi con generazione piano
      const isConfirm = userResponseLower.includes('sì') || 
                        userResponseLower.includes('si') ||
                        userResponseLower.includes('ok') || 
                        userResponseLower.includes('procedi') ||
                        userResponseLower.includes('vai') ||
                        userResponseLower.includes('genera') ||
                        userResponseLower.includes('crea');
      
      // Utente rifiuta - controllo più specifico per evitare falsi positivi
      const isDecline = (userResponseLower === 'no') ||
                        userResponseLower.includes('non voglio') ||
                        userResponseLower.includes('non ora') ||
                        userResponseLower.includes('lascia stare') ||
                        userResponseLower.includes('lascia perdere') ||
                        userResponseLower.includes('preferisco di no');
      
      if (isConfirm) {
        console.log('✅ FIX BUG 4: Utente conferma, genero piano direttamente considerando limitazioni');
        setWaitingForPainPlanConfirmation(false);
        setLoading(true);
        shouldAddUserMessage = false; // Messaggio già aggiunto sopra
        
        // ⭐ FIX BUG 4: Genera piano DIRETTAMENTE invece di fare return
        try {
          // Assicurati di avere sessionId
          let currentSessionId = sessionId;
          if (!currentSessionId) {
            currentSessionId = await getOrCreateSessionId(userId);
            setSessionId(currentSessionId);
          }
          
          // Genera piano con richiesta che considera le limitazioni
          const planRequest = "Creami un piano di allenamento personalizzato considerando le mie limitazioni fisiche";
          console.log('🏋️ FIX BUG 4: Chiamo getStructuredWorkoutPlan con:', planRequest);
          
          const planResponse = await getStructuredWorkoutPlan(
            planRequest, 
            userId, 
            currentSessionId || undefined
          );
          
          console.log('✅ FIX BUG 4: getStructuredWorkoutPlan completato:', {
            success: planResponse.success,
            type: planResponse.type,
            hasPlan: !!planResponse.plan,
            hasQuestion: !!planResponse.question,
          });
          
          setLoading(false);
          
          // Gestisci risposta piano
          if (planResponse.type === 'question' && planResponse.question) {
            // Domanda limitazioni
            setMsgs(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.question,
            }]);
            setAwaitingLimitationsResponse(true);
            setOriginalWorkoutRequest(planRequest);
            return;
          }
          
          if (planResponse.success && planResponse.plan) {
            // Mostra piano (con disclaimer se necessario)
            if (planResponse.hasExistingLimitations && (planResponse as any).hasAnsweredBefore) {
              // Mostra disclaimer
              setPendingPlan({
                plan: planResponse.plan,
                hasLimitations: planResponse.hasExistingLimitations ?? false,
                actions: [
                  {
                    type: 'save_workout',
                    label: 'Salva questo piano',
                    payload: {
                      name: planResponse.plan.name,
                      workout_type: planResponse.plan.workout_type,
                      exercises: planResponse.plan.exercises.map((ex: any) => ({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds,
                        notes: ex.notes,
                      })),
                      duration: planResponse.plan.duration_minutes,
                    },
                  },
                ],
              });
              setShowPlanDisclaimer(true);
            } else {
              // Mostra piano direttamente
              const botMessage: Msg = {
                id: crypto.randomUUID(),
                role: 'bot' as const,
                text: `Ecco il tuo piano di allenamento personalizzato! Ho tenuto conto delle tue limitazioni per creare un programma sicuro per te. 💪`,
                workoutPlan: planResponse.plan,
                actions: [
                  {
                    type: 'save_workout',
                    label: 'Salva questo piano',
                    payload: {
                      name: planResponse.plan.name,
                      workout_type: planResponse.plan.workout_type,
                      exercises: planResponse.plan.exercises.map((ex: any) => ({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds,
                        notes: ex.notes,
                      })),
                      duration: planResponse.plan.duration_minutes,
                    },
                  },
                ],
              };
              setMsgs(prev => [...prev, botMessage]);
            }
            return;
          }
          
          // Errore
          setMsgs(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'bot' as const,
            text: planResponse.message || 'Errore nella generazione del piano. Riprova!',
          }]);
          return;
          
        } catch (error) {
          console.error('❌ FIX BUG 4: Errore generazione piano dopo conferma dolore:', error);
          setLoading(false);
          setMsgs(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'bot' as const,
            text: 'Ops, ho avuto un problema tecnico. Riprova tra qualche secondo.',
          }]);
          return;
        }
      } else if (isDecline) {
        console.log('❌ Utente rifiuta, chiudo il flusso');
        setWaitingForPainPlanConfirmation(false);
        addBotMessage("👍 Nessun problema! Quando vorrai un piano di allenamento, sarò qui. Nel frattempo, prenditi cura del tuo corpo! 💪");
        setLoading(false);
        return;
      } else {
        // Utente ha scritto qualcosa che non è né conferma né rifiuto
        // Potrebbe essere "il dolore mi è passato" - passa all'LLM
        console.log('🔄 Risposta non riconosciuta come conferma/rifiuto, passo all\'LLM');
        setWaitingForPainPlanConfirmation(false);
        setSkipFallbackCheck(true); // ⭐ FIX BUG 2: Salta il fallback, vai direttamente all'LLM
        shouldAddUserMessage = false; // Messaggio già aggiunto sopra
        console.log('🚀 Invio richiesta a OpenAI con messaggio:', trimmed);
        // NON fare return - lascia continuare il flusso verso OpenAI
        // Il messaggio verrà gestito dall'LLM che capirà il contesto
      }
    }
    
    // === SISTEMA RIEPILOGO ONBOARDING - GESTIONE RISPOSTA ===
    if (waitingForPlanConfirmation && trimmed) {
      console.log('📋 Gestisco risposta conferma riepilogo onboarding');
      
      // Aggiungi messaggio utente alla chat SOLO se non è già stato aggiunto
      if (!skipUserMessageAdd) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed
        }]);
      }
      setInput('');
      
      const userResponseLower = trimmed.toLowerCase();
      
      // Utente conferma → procedi con generazione piano
      const isConfirm = userResponseLower.includes('sì') || 
                        userResponseLower.includes('si') ||
                        userResponseLower.includes('ok') || 
                        userResponseLower.includes('procedi') ||
                        userResponseLower.includes('vai') ||
                        userResponseLower.includes('perfetto') ||
                        userResponseLower.includes('genera') ||
                        userResponseLower.includes('crea') ||
                        userResponseLower.includes('confermo');
      
      if (isConfirm) {
        console.log('✅ Utente conferma, procedo con generazione piano');
        setWaitingForPlanConfirmation(false);
        shouldAddUserMessage = false; // ⭐ FIX: Impedisce duplicazione nel blocco generale
        setSkipUserMessageAdd(true); // Evita duplicazione messaggio nel blocco generale (riga 713-715)
        // NON fare return - lascia continuare per generare il piano usando pendingPlanRequest
        // Il piano verrà generato nel blocco isPlanRequest più sotto (riga 927+)
        // skipUserMessageAdd=true previene la duplicazione del messaggio nel blocco generale
      } else {
        // Utente vuole modificare
        const isModify = userResponseLower.includes('modifica') || 
                         userResponseLower.includes('cambia') ||
                         userResponseLower.includes('cambiare') ||
                         userResponseLower.includes('modificare') ||
                         userResponseLower.includes('aggiorna') ||
                         userResponseLower.includes('diverso');
        
        if (isModify) {
          console.log('🔄 Utente vuole modificare preferenze in chat');
          setWaitingForPlanConfirmation(false);
          setWaitingForModifyChoice(true);
          // NON resettare pendingPlanRequest - ci servirà dopo
          addBotMessage(`Cosa vorresti modificare? Puoi dirmi ad esempio:


- **Obiettivo** → "Voglio dimagrire" oppure "Obiettivo massa"

- **Giorni** → "4 giorni a settimana" oppure "Voglio allenarmi 5 volte"

- **Durata** → "30 minuti" oppure "Ho solo 45 minuti"

- **Luogo** → "Mi alleno a casa" oppure "Vado in palestra"

- **Livello** → "Sono principiante" oppure "Livello intermedio"


Dimmi cosa vuoi cambiare! 💪`);
          return;
        }
        
        // Risposta non chiara → chiedi chiarimento
        console.log('❓ Risposta non chiara, chiedo chiarimento');
        addBotMessage('Non ho capito bene. Vuoi che **proceda** con la creazione del piano con queste preferenze, oppure preferisci **modificare** qualcosa prima?');
        return;
      }
    }
    // === SISTEMA RIEPILOGO ONBOARDING - FINE GESTIONE RISPOSTA ===
    
    // === SISTEMA MODIFICA PREFERENZE IN CHAT ===
    if (waitingForModifyChoice && trimmed) {
      console.log('📝 Gestisco richiesta modifica preferenze');
      
      // Aggiungi messaggio utente alla chat
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed
        }]);
        shouldAddUserMessage = false; // Evita duplicazione
      }
      setInput('');
      
      const userMsgLower = trimmed.toLowerCase();
      
      // Check se l'utente vuole procedere senza modificare
      const wantsToProceed = userMsgLower.includes('procedi') || 
                             userMsgLower.includes('vai') ||
                             userMsgLower.includes('ok') ||
                             userMsgLower.includes('genera') ||
                             userMsgLower.includes('basta') ||
                             userMsgLower.includes('così') ||
                             userMsgLower.includes('va bene');
      
      if (wantsToProceed) {
        console.log('✅ Utente vuole procedere, genero piano');
        setWaitingForModifyChoice(false);
        setWaitingForPlanConfirmation(false);
        // NON fare return - lascia continuare per generare il piano
        // Il pendingPlanRequest è già settato
      } else {
        // Prova a interpretare cosa vuole modificare (può essere multiplo)
        const parsedArray = parseModifyRequest(trimmed);
        
        if (parsedArray && parsedArray.length > 0) {
          console.log('✅ Riconosciute modifiche:', parsedArray);
          setLoading(true);
          
          // Label leggibili per i campi
          const fieldLabels: Record<string, string> = {
            'obiettivo': 'Obiettivo',
            'livello_esperienza': 'Livello',
            'giorni_settimana': 'Giorni a settimana',
            'luoghi_allenamento': 'Luogo allenamento',
            'tempo_sessione': 'Durata sessione',
            'attrezzi': 'Attrezzatura'
          };
          
          const valueLabels: Record<string, string> = {
            'massa': 'Aumento massa muscolare',
            'dimagrire': 'Perdita peso',
            'tonificare': 'Tonificazione',
            'resistenza': 'Resistenza',
            'forza': 'Forza',
            'benessere': 'Benessere generale',
            'principiante': 'Principiante',
            'intermedio': 'Intermedio',
            'avanzato': 'Avanzato',
            'casa': 'Casa',
            'palestra': 'Palestra',
            'outdoor': 'All\'aperto'
          };
          
          // Aggiorna tutti i campi trovati
          const updatePromises = parsedArray.map(parsed => 
            updateOnboardingPreference(userId, parsed.field, parsed.value)
          );
          
          const results = await Promise.all(updatePromises);
          
          // Verifica se tutti gli aggiornamenti sono riusciti
          const allSuccess = results.every(r => r.success);
          const failedUpdates = results.filter(r => !r.success);
          
          if (allSuccess) {
            // Costruisci messaggio con tutte le modifiche
            const updatesList = parsedArray.map(parsed => {
              const fieldLabel = fieldLabels[parsed.field] || parsed.field;
              const valueLabel = valueLabels[String(parsed.value)] || String(parsed.value);
              return `**${fieldLabel}** → **${valueLabel}**`;
            }).join('\n');
            
            // Genera nuovo riepilogo aggiornato
            const newSummary = await generateOnboardingSummaryMessage(userId);
            
            setWaitingForModifyChoice(false);
            setWaitingForPlanConfirmation(true);
            setLoading(false);
            
            const updatesText = parsedArray.length === 1 
              ? `✅ Perfetto! Ho aggiornato ${updatesList}.`
              : `✅ Perfetto! Ho aggiornato:\n${updatesList}`;
            
            addBotMessage(`${updatesText}


${newSummary ? newSummary.replace('Secondo le tue risposte durante l\'onboarding:', 'Ecco il riepilogo aggiornato:') : 'Vuoi procedere con il piano o modificare altro?'}`);
            return;
          } else {
            // Errore aggiornamento
            setLoading(false);
            const errorMessages = failedUpdates.map(r => r.message).join(', ');
            addBotMessage(`❌ Errore nell'aggiornamento: ${errorMessages}. Riprova o dimmi cosa vuoi modificare.`);
            return;
          }
        } else {
          // Non ha capito cosa modificare
          console.log('❓ Non riesco a interpretare la modifica');
          addBotMessage(`Non ho capito bene cosa vuoi modificare. Prova a essere più specifico, ad esempio:
          

- "Voglio allenarmi 4 giorni a settimana"

- "Il mio obiettivo è dimagrire"

- "Mi alleno a casa"

- "Ho 30 minuti a disposizione"


Oppure dimmi **"procedi"** se vuoi generare il piano con le preferenze attuali.`);
          return;
        }
      } // chiusura else di wantsToProceed
    }
    // === FINE SISTEMA MODIFICA PREFERENZE IN CHAT ===
    
    // Check dolori PRIMA di generare piano
    const isPlanRequestForPainCheck = /piano|allenamento|workout|scheda|programma|esercizi|allena|creami/i.test(trimmed);
    
    // ⭐ FIX BUG 3: Analizza il messaggio corrente per estrarre dolori PRIMA di controllare il database
    const painFromCurrentMessage = detectBodyPartFromMessage(trimmed);
    
    // ⭐ FIX PROBLEMA 3: Distingui DOLORE vs ZONA TARGET
    const isPainContext = painFromCurrentMessage !== null && isBodyPartForPain(trimmed, painFromCurrentMessage);
    
    console.log(`🎯 FIX PROBLEMA 3: zona=${painFromCurrentMessage}, isPainContext=${isPainContext}`);
    
    console.log('🔍 DEBUG CHECK DOLORI:', {
      isPlanRequestForPainCheck,
      painsLength: pains.length,
      painFromCurrentMessage, // ⭐ FIX BUG 3: Dolore rilevato nel messaggio corrente
      isPainContext, // ⭐ FIX PROBLEMA 3: Flag se è contesto DOLORE (non solo presenza zona)
      painCheckMessage: painCheckMessage ? painCheckMessage.substring(0, 50) + '...' : null,
      waitingForPainResponse,
      waitingForPainDetails, // ⭐ FIX BUG 3: Flag se stiamo aspettando dettagli dolore
      userId: userId.substring(0, 8) + '...',
      conditionResult: isPlanRequestForPainCheck && pains.length > 0 && painCheckMessage && !waitingForPainResponse
    });
    
    // ⭐ FIX BUG 3: Se c'è DOLORE nel messaggio corrente + richiesta piano, chiedi dettagli PRIMA
    if (isPlanRequestForPainCheck && isPainContext && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation) {
      console.log('🩺 FIX BUG 3: Rilevato DOLORE nel messaggio corrente:', painFromCurrentMessage);
      
      // Aggiungi messaggio utente
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user', 
          text: trimmed 
        }]);
        shouldAddUserMessage = false;
      }
      setInput('');
      
      // Determina se la parte del corpo può avere lato (destro/sinistro)
      const needsSide = ['ginocchio', 'spalla', 'anca', 'gomito', 'polso', 'caviglia'].includes(painFromCurrentMessage.toLowerCase());
      
      // Chiedi dettagli dolore
      let askDetailsMessage = '';
      if (needsSide) {
        askDetailsMessage = `Ho capito che hai dolore al ${painFromCurrentMessage}. Per adattare al meglio il piano, quale ${painFromCurrentMessage} ti fa male? Destro, sinistro o entrambi?`;
      } else {
        askDetailsMessage = `Ho capito che hai dolore alla ${painFromCurrentMessage}. Per adattare al meglio il piano, confermi che il dolore è ancora presente?`;
      }
      
      // Salva temporaneamente e aspetta risposta
      setTempPainBodyPart(painFromCurrentMessage);
      setWaitingForPainDetails(true);
      
      addBotMessage(askDetailsMessage);
      return;
    }
    
    // Controlla dolori esistenti nel database (logica originale)
    if (isPlanRequestForPainCheck && pains.length > 0 && painCheckMessage && !waitingForPainResponse && !waitingForPainDetails) {
      console.log('✅ ENTRO NEL BLOCCO CHECK DOLORI - Mostro painCheckMessage');
      // Aggiungi messaggio utente alla chat
      if (shouldAddUserMessage) {
        setMsgs(prev => [...prev, { 
          id: crypto.randomUUID(),
          role: 'user', 
          text: trimmed 
        }]);
        shouldAddUserMessage = false; // Evita duplicazione
      }
      setInput('');
      
      setWaitingForPainResponse(true);
      // ⭐ FIX BUG 7: Setta sempre currentPainZone se c'è almeno un dolore
      if (pains.length > 0) {
        setCurrentPainZone(pains[0].zona);
        console.log('🗑️ BUG 7 DEBUG: Setto currentPainZone =', pains[0].zona, '(dolori totali:', pains.length, ')');
      }
      
      // Aggiungi messaggio bot con bottone per contattare professionista
      const painMessageWithAction = `${painCheckMessage}


💡 **Se preferisci, puoi contattare uno dei nostri professionisti per un consulto personalizzato.**`;
      
      setMsgs(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'bot' as const,
        text: painMessageWithAction,
        actions: [
          {
            type: 'navigate' as const,
            label: '👨‍⚕️ Contatta un professionista',
            payload: { path: '/professionals' }
          }
        ]
      }]);
      
      return;
    }
    // === SISTEMA TRACKING DOLORI - FINE ===
    
    // === SISTEMA RIEPILOGO ONBOARDING - MOSTRA RIEPILOGO ===
    // Se è una richiesta piano E non stiamo aspettando conferma E non ci sono dolori da gestire
    // ⭐ FIX BUG 3: Aggiunto controllo waitingForPainDetails per evitare conflitti
    if (isPlanRequestForPainCheck && !waitingForPlanConfirmation && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation) {
      // Se l'utente ha appena confermato (pendingPlanRequest è settato), salta il riepilogo
      if (pendingPlanRequest) {
        console.log('✅ Utente ha confermato, uso pendingPlanRequest per generare piano');
        // Il flusso continuerà sotto per generare il piano
      } else {
        // Prima richiesta di piano → mostra riepilogo
        console.log('📋 Prima richiesta piano, mostro riepilogo onboarding');
        
        // Aggiungi messaggio utente alla chat
        if (shouldAddUserMessage) {
          setMsgs(prev => [...prev, { 
            id: crypto.randomUUID(),
            role: 'user',
            text: trimmed
          }]);
          shouldAddUserMessage = false; // Evita duplicazione
        }
        setInput('');
        setLoading(true);
        
        try {
          const summaryMessage = await generateOnboardingSummaryMessage(userId);
          
          if (summaryMessage) {
            // Ha dati onboarding → mostra riepilogo e aspetta conferma
            console.log('✅ Riepilogo onboarding generato, mostro e aspetto conferma');
            setPendingPlanRequest(trimmed); // Salva richiesta originale
            setWaitingForPlanConfirmation(true);
            addBotMessage(summaryMessage);
            setLoading(false);
            return;
          } else {
            // NON ha dati onboarding → procedi senza riepilogo
            console.log('⚠️ Nessun dato onboarding, procedo senza riepilogo');
            // Non fare return, lascia continuare il flusso normale
          }
        } catch (error) {
          console.error('❌ Errore generazione riepilogo:', error);
          // In caso di errore, procedi senza riepilogo
        }
        
        setLoading(false);
      }
    }
    // === SISTEMA RIEPILOGO ONBOARDING - FINE MOSTRA RIEPILOGO ===
    
    console.log('🚀 SEND FUNZIONE CHIAMATA:', { text: trimmed, loading, awaitingLimitationsResponse });
    
    if (!trimmed || loading) {
      console.log('⚠️ SEND BLOCCATO:', { trimmed: !!trimmed, loading });
      return;
    }

    // Aggiungi messaggio utente solo se non è già stato aggiunto nei blocchi precedenti
    if (shouldAddUserMessage) {
      setMsgs(m => [...m, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
      console.log('📝 Messaggio utente aggiunto nel blocco generale');
    } else {
      console.log('⏭️ Messaggio utente già aggiunto, salto duplicazione');
    }
    setInput('');
    setLoading(true);
    
    console.log('📝 Messaggio utente aggiunto, loading = true');

    // Marca utente come onboardato dopo la prima interazione
    if (isNewUser) {
      localStorage.setItem(`user_onboarded_${userId}`, 'true');
      setIsNewUser(false);
    }

    // Assicurati di avere un sessionId (recupera/crea se necessario)
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        currentSessionId = await getOrCreateSessionId(userId);
        setSessionId(currentSessionId);
        console.log('✅ Session ID creato durante send:', currentSessionId.substring(0, 8) + '...');
      } catch (sessionError) {
        console.warn('⚠️ Errore creazione session ID (continuo comunque):', sessionError);
        // Continua senza session ID se il recupero fallisce
      }
    }

    try {
      // PRIMA: Se siamo in attesa di risposta limitazioni, gestiscila
      if (awaitingLimitationsResponse) {
        console.log('💬 Risposta limitazioni ricevuta:', trimmed);
        setAwaitingLimitationsResponse(false);
        
        const { parseAndSaveLimitationsFromChat } = await import('@/services/primebotUserContextService');
        const result = await parseAndSaveLimitationsFromChat(userId, trimmed);
        
        // Risposta empatica basata sul risultato
        let empathyMessage = '';
        if (!result.hasLimitations) {
          empathyMessage = 'Perfetto! Creo subito il tuo piano personalizzato 💪';
        } else {
          empathyMessage = `Grazie per avermelo detto! Terrò conto di questo e creerò un piano sicuro per te. Ti consiglio anche di consultare un professionista per una valutazione specifica.`;
        }
        
        // Mostra messaggio empatico
        setMsgs(m => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'bot' as const,
            text: empathyMessage,
          },
        ]);
        
        // Rigenera il piano con i dati aggiornati
        // IMPORTANTE: Usa la richiesta originale del piano, non "no" o "sì"
        const workoutRequest = originalWorkoutRequest || trimmed;
        console.log('🔄 Rigenero piano con richiesta:', {
          originalRequest: originalWorkoutRequest,
          currentTrimmed: trimmed,
          usingRequest: workoutRequest,
        });
        const planResponse = await getStructuredWorkoutPlan(workoutRequest, userId, currentSessionId || undefined);
        // Reset della richiesta originale dopo l'uso
        setOriginalWorkoutRequest(null);
        
        if (planResponse.success && planResponse.plan) {
          // Mostra disclaimer SOLO se l'utente ha limitazioni
          if (result.hasLimitations) {
            setPendingPlan({
              plan: planResponse.plan,
              hasLimitations: result.hasLimitations, // Salva info limitazioni per il disclaimer
              actions: [
                {
                  type: 'save_workout',
                  label: 'Salva questo piano',
                  payload: {
                    name: planResponse.plan.name,
                    workout_type: planResponse.plan.workout_type,
                    exercises: planResponse.plan.exercises.map((ex: any) => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest_seconds: ex.rest_seconds,
                      notes: ex.notes,
                    })),
                    duration: planResponse.plan.duration_minutes,
                  },
                },
              ],
            });
            setShowPlanDisclaimer(true);
          } else {
            // Se NON ha limitazioni, mostra il piano direttamente senza disclaimer
            const botMessage: Msg = {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: `Ecco il tuo piano di allenamento personalizzato! 💪`,
              workoutPlan: planResponse.plan,
              actions: [
                {
                  type: 'save_workout',
                  label: 'Salva questo piano',
                  payload: {
                    name: planResponse.plan.name,
                    workout_type: planResponse.plan.workout_type,
                    exercises: planResponse.plan.exercises.map((ex: any) => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest_seconds: ex.rest_seconds,
                      notes: ex.notes,
                    })),
                    duration: planResponse.plan.duration_minutes,
                  },
                },
              ],
            };
            setMsgs(m => [...m, botMessage]);
          }
        } else if (planResponse.type === 'question') {
          // Se ritorna ancora una domanda, mostra la domanda
          setMsgs(m => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.question || 'Errore nella generazione del piano.',
            },
          ]);
          setAwaitingLimitationsResponse(true);
        } else {
          setMsgs(m => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.message || 'Errore nella generazione del piano. Riprova!',
            },
          ]);
        }
        
        setLoading(false);
        return;
      }
      
      // ⭐ FIX BUG 6: Controllo di sicurezza PRIMA del fallback
      // Intercetta "passato" anche se waitingForPainResponse non è attivo ma c'è dolore recente
      if (pains.length > 0 && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation) {
        const userMessageLower = trimmed.toLowerCase();
        const isPainResponse = userMessageLower.includes('passato') || 
                               userMessageLower.includes('meglio') || 
                               userMessageLower.includes('guarito') ||
                               (userMessageLower === 'sì' || userMessageLower === 'si' || userMessageLower === 'ok');
        
        if (isPainResponse) {
          console.log('🛡️ FIX BUG 6: Intercettato "passato" anche se stato non attivo. pains.length =', pains.length);
          
          // Setta stato e gestisci risposta dolore
          setWaitingForPainResponse(true);
          // ⭐ FIX BUG 7: Setta sempre currentPainZone se c'è almeno un dolore
          if (pains.length > 0) {
            setCurrentPainZone(pains[0].zona);
            console.log('🗑️ BUG 7 DEBUG (FIX BUG 6): Setto currentPainZone =', pains[0].zona, '(dolori totali:', pains.length, ')');
          }
          
          // Aggiungi messaggio utente
          if (shouldAddUserMessage) {
            setMsgs(prev => [...prev, { 
              id: crypto.randomUUID(),
              role: 'user',
              text: trimmed
            }]);
            shouldAddUserMessage = false;
          }
          setInput('');
          
          const isPainGone = userMessageLower.includes('passato') || 
                             userMessageLower.includes('meglio') || 
                             userMessageLower.includes('guarito') || 
                             userMessageLower.includes('ok') ||
                             userMessageLower.includes('sì') || 
                             userMessageLower.includes('si');
          
          if (isPainGone) {
            // Tutti i dolori passati
            if (userMessageLower.includes('tutti') || userMessageLower.includes('tutto')) {
              console.log('🗑️ BUG 7 DEBUG (FIX BUG 6): Rimuovo TUTTI i dolori');
              const response = await handleAllPainsGone();
              console.log('🗑️ BUG 7 DEBUG (FIX BUG 6): Risultato handleAllPainsGone:', response);
              setWaitingForPainResponse(false);
              setCurrentPainZone(null);
              // ⭐ FIX BUG 7: Ricarica dolori dopo rimozione
              await refreshPains();
              addBotMessage(response);
              setLoading(false);
              return;
            }
            
            // Singolo dolore passato
            if (pains.length > 0) {
              const zonaToRemove = pains[0].zona;
              console.log('🗑️ BUG 7 DEBUG (FIX BUG 6): Chiamando handlePainGone per zona:', zonaToRemove);
              const response = await handlePainGone(zonaToRemove);
              console.log('🗑️ BUG 7 DEBUG (FIX BUG 6): Risultato handlePainGone:', response);
              setWaitingForPainResponse(false);
              setCurrentPainZone(null);
              // ⭐ FIX BUG 7: Ricarica dolori dopo rimozione
              await refreshPains();
              addBotMessage(response);
              setLoading(false);
              return;
            }
          }
          
          // Se non ha matchato "passato", continua il flusso normale
          setWaitingForPainResponse(false);
          setCurrentPainZone(null);
        }
      }
      
      // ⭐ FIX BUG 2: Se skipFallbackCheck è true, salta il fallback e vai all'LLM
      let presetResponse = null;
      if (!skipFallbackCheck) {
        // SECONDO: Controlla se esiste una risposta preimpostata
        presetResponse = getPrimeBotFallbackResponse(trimmed);
      } else {
        console.log('🔄 FIX BUG 2: skipFallbackCheck = true, salto fallback e vado all\'LLM');
        setSkipFallbackCheck(false); // Reset per prossimo messaggio
      }
      
      if (presetResponse) {
        console.log('🎯 Risposta preimpostata trovata:', presetResponse);
        
        // Crea il messaggio con la risposta preimpostata
        const message: Msg = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: presetResponse.text
        };
        
        // Se c'è un'azione (bottone), aggiungi la navigazione
        if (presetResponse.action) {
          message.navigation = {
            path: presetResponse.action.link,
            label: presetResponse.action.label,
            action: 'navigate'
          };
        }
        
        setMsgs(m => [...m, message]);
        
        // Se la risposta chiede conferma per creare piano, setta lo stato
        if (presetResponse.askForPlanConfirmation) {
          setWaitingForPainPlanConfirmation(true);
        }
        
        // Salva anche le risposte preimpostate su database (se abbiamo sessionId)
        if (currentSessionId && userId && !userId.startsWith('guest-')) {
          try {
            const interaction: PrimeBotInteraction = {
              user_id: userId,
              session_id: currentSessionId,
              message_content: trimmed,
              bot_response: presetResponse.text,
              interaction_type: 'text',
              user_context: {
                page: window.location.pathname,
                is_preset_response: true,
              },
            };
            await saveInteraction(interaction);
            console.log('✅ Risposta preimpostata salvata su database');
          } catch (saveError) {
            console.warn('⚠️ Errore salvataggio risposta preimpostata (continuo comunque):', saveError);
            // Non bloccare il flusso se il salvataggio fallisce
          }
        }
        
        setLoading(false);
        return;
      }
      
      // TERZO: Controlla se è una richiesta di piano allenamento
      // Se l'utente ha confermato il riepilogo, considera come richiesta piano
      const isPlanRequestFromConfirmation = pendingPlanRequest !== null;
      const isPlanRequest = isWorkoutPlanRequest(trimmed) || isPlanRequestFromConfirmation;
      console.log('🔍 VERIFICA RICHIESTA PIANO:', { 
        trimmed, 
        isPlanRequest,
        isPlanRequestFromConfirmation,
        pendingPlanRequest: pendingPlanRequest ? pendingPlanRequest.substring(0, 30) + '...' : null,
        awaitingLimitationsResponse 
      });
      
      if (isPlanRequest) {
        console.log('🏋️ Richiesta piano allenamento rilevata, uso getStructuredWorkoutPlan');
        console.log('🔍 DEBUG - Prima di chiamare getStructuredWorkoutPlan:', {
          userId: userId.substring(0, 8) + '...',
          sessionId: currentSessionId?.substring(0, 8) + '...' || 'null',
        });
        
        let planResponse;
        try {
          // Usa pendingPlanRequest se l'utente ha confermato il riepilogo, altrimenti usa trimmed
          const planRequestText = pendingPlanRequest || trimmed;
          planResponse = await getStructuredWorkoutPlan(planRequestText, userId, currentSessionId || undefined);
          console.log('✅ getStructuredWorkoutPlan completato:', {
            success: planResponse.success,
            type: planResponse.type,
            hasPlan: !!planResponse.plan,
            hasQuestion: !!planResponse.question,
            hasExistingLimitations: planResponse.hasExistingLimitations,
          });
          
          // DEBUG: Stampa tutta la risposta
          console.log('🔍 DEBUG - planResponse COMPLETO:', {
            type: planResponse.type,
            typeValue: planResponse.type,
            typeIsUndefined: planResponse.type === undefined,
            typeIsQuestion: planResponse.type === 'question',
            question: planResponse.question,
            questionExists: !!planResponse.question,
            success: planResponse.success,
            hasPlan: !!planResponse.plan,
            hasExistingLimitations: planResponse.hasExistingLimitations,
            fullResponse: JSON.stringify(planResponse, null, 2),
          });
        } catch (error) {
          console.error('❌ ERRORE in getStructuredWorkoutPlan:', error);
        setMsgs(m => [
          ...m,
          { 
            id: crypto.randomUUID(), 
            role: 'bot' as const, 
              text: 'Ops, ho avuto un problema tecnico. Riprova tra qualche secondo.',
            },
          ]);
          setLoading(false);
          return;
        }
        
        // IMPORTANTE: Se ritorna una domanda, mostra SOLO la domanda (NON generare piano)
        console.log('🔍 VERIFICA TYPE RESPONSE:', {
          type: planResponse.type,
          typeExists: planResponse.type !== undefined,
          question: planResponse.question?.substring(0, 50) + '...',
          questionExists: !!planResponse.question,
          success: planResponse.success,
          hasPlan: !!planResponse.plan,
        });
        
        // DEBUG: Verifica PRIMA del controllo if
        console.log('🔍 DEBUG - PRIMA del controllo type === question:', {
          type: planResponse.type,
          typeStrictEqual: planResponse.type === 'question',
          question: planResponse.question,
          questionExists: !!planResponse.question,
          conditionResult: planResponse.type === 'question' && planResponse.question,
        });
        
        if (planResponse.type === 'question' && planResponse.question) {
          console.log('✅ DEBUG - ENTRO NEL BLOCCO QUESTION - Mostro SOLO la domanda');
          console.log('❓ Ritornata domanda limitazioni, mostro SOLO la domanda');
          // Salva la richiesta originale per rigenerare il piano dopo la risposta
          setOriginalWorkoutRequest(trimmed);
          setMsgs(m => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.question,
            },
          ]);
          setAwaitingLimitationsResponse(true);
          setLoading(false);
          console.log('✅ DEBUG - FACCIO RETURN - NON devo generare piano');
          return; // IMPORTANTE: Esci qui, NON generare piano
        }
        
        console.log('🔍 DEBUG - NON sono entrato nel blocco question, verifico se è un piano');
        console.log('⚠️ NON è una domanda, verifico se è un piano:', {
          type: planResponse.type,
          success: planResponse.success,
          hasPlan: !!planResponse.plan,
        });
        
        // Se il tipo è 'error', mostra messaggio di errore
        if (planResponse.type === 'error') {
          console.error('❌ ERRORE nella generazione piano:', {
            message: planResponse.message,
            errorType: planResponse.errorType,
          });
        setMsgs(m => [
          ...m,
          { 
            id: crypto.randomUUID(), 
            role: 'bot' as const, 
              text: planResponse.message || 'Errore nella generazione del piano. Riprova!',
            },
          ]);
          setLoading(false);
          return;
        }
        
        // Se abbiamo un piano generato (solo se needsToAsk === false)
        console.log('🔍 DEBUG - PRIMA del controllo success && plan:', {
          success: planResponse.success,
          hasPlan: !!planResponse.plan,
          type: planResponse.type,
          conditionResult: planResponse.success && planResponse.plan,
        });
        
        if (planResponse.success && planResponse.plan) {
          console.log('✅ DEBUG - ENTRO NEL BLOCCO success && plan');
          // Mostra disclaimer SOLO se l'utente ha limitazioni esistenti E ha già risposto prima (non è la prima volta)
          console.log('🔍 DEBUG - Verifico condizioni per disclaimer:', {
            hasExistingLimitations: planResponse.hasExistingLimitations,
            hasAnsweredBefore: (planResponse as any).hasAnsweredBefore,
            conditionResult: planResponse.hasExistingLimitations && (planResponse as any).hasAnsweredBefore,
          });
          
          // IMPORTANTE: Mostra disclaimer SOLO se:
          // 1. Ha limitazioni esistenti (hasExistingLimitations === true)
          // 2. Ha già risposto prima (hasAnsweredBefore === true)
          // Questo evita di mostrare il disclaimer se l'utente non ha mai risposto alla domanda iniziale
          if (planResponse.hasExistingLimitations && (planResponse as any).hasAnsweredBefore) {
            // Ha limitazioni già salvate E ha già risposto prima → mostra messaggio bot + disclaimer
            console.log('✅ DEBUG - ENTRO NEL BLOCCO hasExistingLimitations + hasAnsweredBefore - Mostro messaggio bot + disclaimer');
            console.log('⚠️ Utente ha limitazioni esistenti E ha già risposto prima, mostro messaggio bot + disclaimer');
            
            // PRIMA: Aggiungi messaggio del bot che spiega il piano
            const botMessage: Msg = {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: `Ecco il tuo piano di allenamento personalizzato! Ho tenuto conto delle tue limitazioni per creare un programma sicuro per te. 💪`,
            };
            setMsgs(m => [...m, botMessage]);
            
            // POI: Imposta il piano in pending per mostrare il disclaimer DOPO il messaggio
            setPendingPlan({
              plan: planResponse.plan,
              hasLimitations: planResponse.hasExistingLimitations ?? false,
              actions: [
                {
                  type: 'save_workout',
                  label: 'Salva questo piano',
                  payload: {
                    name: planResponse.plan.name,
                    workout_type: planResponse.plan.workout_type,
                    exercises: planResponse.plan.exercises.map((ex: any) => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest_seconds: ex.rest_seconds,
                      notes: ex.notes,
                    })),
                    duration: planResponse.plan.duration_minutes,
                  },
                },
              ],
            });
            setShowPlanDisclaimer(true);
            setPendingPlanRequest(null); // Reset dopo generazione piano
            console.log('✅ DEBUG - Ho aggiunto messaggio bot e impostato showPlanDisclaimer = true');
          } else {
            // NON ha limitazioni O non ha mai risposto prima → mostra piano direttamente senza disclaimer
            console.log('✅ DEBUG - NON ha limitazioni O non ha mai risposto - Mostro piano direttamente');
            console.log('✅ Utente NON ha limitazioni O non ha mai risposto, mostro piano direttamente');
            const botMessage: Msg = {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: `Ecco il tuo piano di allenamento personalizzato! 💪`,
              workoutPlan: planResponse.plan,
              actions: [
                {
                  type: 'save_workout',
                  label: 'Salva questo piano',
                  payload: {
                    name: planResponse.plan.name,
                    workout_type: planResponse.plan.workout_type,
                    exercises: planResponse.plan.exercises.map((ex: any) => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest_seconds: ex.rest_seconds,
                      notes: ex.notes,
                    })),
                    duration: planResponse.plan.duration_minutes,
                  },
                },
              ],
            };
            setMsgs(m => [...m, botMessage]);
            setPendingPlanRequest(null); // Reset dopo generazione piano
          }
        } else {
          // Errore o caso non gestito
          console.warn('⚠️ Caso non gestito in planResponse:', {
            type: planResponse.type,
            success: planResponse.success,
            hasPlan: !!planResponse.plan,
            hasQuestion: !!planResponse.question,
            message: planResponse.message,
          });
          setMsgs(m => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: planResponse.message || 'Errore nella generazione del piano. Riprova!',
            },
          ]);
          setLoading(false);
        }
      } else {
        // SECONDO: Se non c'è risposta preimpostata, usa l'AI normale
        console.log('🤖 Nessuna risposta preimpostata, uso AI');
        const aiResponse = await getAIResponse(trimmed, userId, currentSessionId || undefined);
        
        // Parsa azioni dalla risposta AI
        const { cleanText, actions } = parseActionsFromText(aiResponse.message);
        
        const botMessage: Msg = {
          id: crypto.randomUUID(),
          role: 'bot' as const,
          text: cleanText,
          actions: actions.length > 0 ? actions : undefined,
        };
        
        setMsgs(m => [...m, botMessage]);
      }
    } catch (e) {
      console.error('Errore chiamata OpenAI:', e);
      setMsgs(m => [
        ...m,
        { id: crypto.randomUUID(), role: 'bot', text: 'Ops, connessione instabile. Riprova tra qualche secondo.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Quick replies per onboarding
  const onboardingQuestions = [
    'Mostrami la Dashboard',
    'Come creare un allenamento?',
    'Spiegami le funzionalità premium',
    'Come tracciare i progressi?',
    'Quali sono i prossimi passi?'
  ];

  // Quick replies normali
  const normalQuestions = [
    'Come posso migliorare la mia resistenza?',
    'Quale workout è meglio per oggi?',
    'Consigli per la nutrizione pre-allenamento',
    'Come posso raggiungere i miei obiettivi?'
  ];

  const questionsToShow = isNewUser ? onboardingQuestions : normalQuestions;

  // DEBUG: Console.log per verificare lo stato
  console.log('RENDER: hasStartedChat =', hasStartedChat);
  console.log('RENDER: msgs.length =', msgs.length);
  console.log('RENDER: msgs =', msgs);

  // FIX NAVIGAZIONE: Mostra Landing Page solo se non ha iniziato la chat
  if (!hasStartedChat) {
    console.log('MOSTRO LANDING PAGE');
    return (
      <div className={`w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white ${hasStartedChat ? 'min-h-[700px]' : 'min-h-[600px] mb-4 pb-2'}`}>
        {/* Landing Page */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          {/* Icona fulmine gialla in cerchio */}
          <div className="w-24 h-24 bg-[#EEBA2B] rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          
          {/* Titolo e sottotitolo */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#EEBA2B]">PrimeBot</h2>
            <p className="text-lg text-gray-300">Il tuo coach fitness AI personalizzato</p>
          </div>
          
          {/* Bottone Inizia Chat - FIX NAVIGAZIONE */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🚀 BOTTONE CLICCATO!');
              console.log('PRIMA CLICK: hasStartedChat =', hasStartedChat);
              console.log('PRIMA CLICK: msgs =', msgs);
              
              setHasStartedChat(true);
              setIsFullscreen(true); // Imposta fullscreen quando inizia la chat
              setMsgs([
                {
                  id: 'disclaimer',
                  role: 'bot' as const,
                  text: 'PrimeBot è un assistente AI per supporto informativo e NON sostituisce professionisti qualificati. Per programmi personalizzati o se hai dolori/patologie, consulta un personal trainer, fisioterapista o medico. Trova un professionista su Performance Prime!',
                  isDisclaimer: true
                },
                {
                  id: 'welcome',
                  role: 'bot' as const,
                  text: `Ciao ${userName} 👋! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
                }
              ]);
              
              // Focus automatico al campo di input dopo un breve delay
              setTimeout(() => {
                const inputElement = document.querySelector('input[aria-label="Scrivi la tua domanda"]') as HTMLInputElement;
                if (inputElement) {
                  inputElement.focus();
                  console.log('🎯 FOCUS AUTOMATICO APPLICATO AL CAMPO INPUT');
                }
              }, 100);
              
              console.log('DOPO CLICK: hasStartedChat dovrebbe essere true');
              console.log('DOPO CLICK: msgs dovrebbe avere 2 messaggi');
            }}
            onMouseDown={(e) => e.stopPropagation()} // BLOCCA ANCHE MOUSEDOWN
            onMouseUp={(e) => e.stopPropagation()}   // BLOCCA ANCHE MOUSEUP
            className="px-8 py-4 bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-bold rounded-xl transition-colors text-lg"
            type="button"
          >
            Inizia Chat con PrimeBot
          </button>
          
          {/* 3 Card Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">💪</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Allenamenti</h3>
              <p className="text-sm text-gray-400">Workout personalizzati</p>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Obiettivi</h3>
              <p className="text-sm text-gray-400">Raggiungi i tuoi goal</p>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Progressi</h3>
              <p className="text-sm text-gray-400">Monitora i risultati</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Interface - FIX FULLSCREEN E EVENT BUBBLING
  console.log('MOSTRO CHAT INTERFACE');
  
  // Chat Interface - quando hasStartedChat = true
  if (hasStartedChat) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center px-4 py-3 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black font-semibold">
          <button
            onClick={() => {
              setHasStartedChat(false);
              setMsgs([]);
              setIsFullscreen(false); // Reset fullscreen quando si chiude la chat
            }}
            className="text-xl hover:opacity-70"
            title="Torna a PrimeBot"
          >
            ←
          </button>
          <span className="font-bold ml-4">PrimeBot</span>
          <span className="text-sm ml-2">• Online • Sempre disponibile</span>
        </header>

        {/* Area Messaggi - con spazio sopra */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-4 py-16 space-y-4">
            {msgs.map(m => (
              <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-[#EEBA2B] text-black'
                    : (m as any).isDisclaimer 
                      ? 'bg-red-900 text-red-100 border border-red-600 text-sm font-semibold'
                      : 'bg-gray-800 text-white border border-gray-600'
                }`}>
                  {(m as any).isDisclaimer && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>⚠️ AVVISO IMPORTANTE</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {renderFormattedMessage(m.text)}
                  </div>
                  
                  {/* Bottone di navigazione per messaggi bot */}
                  {m.role === 'bot' && m.navigation && (
                    <button
                      onClick={() => navigate(m.navigation!.path)}
                      className="mt-3 w-full px-4 py-2 bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {m.navigation.label}
                      <span>→</span>
                    </button>
                  )}
                  
                  {/* Card Piano Allenamento */}
                  {m.role === 'bot' && m.workoutPlan && (
                    <div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-[#EEBA2B] rounded-xl p-4">
                      <h3 className="text-xl font-bold text-[#EEBA2B] mb-2">
                        {m.workoutPlan.name}
                      </h3>
                      {m.workoutPlan.description && (
                        <p className="text-gray-300 text-sm mb-3">{m.workoutPlan.description}</p>
                      )}
                      
                      {/* Consigli Terapeutici - Mostra PRIMA degli esercizi se presenti */}
                      {m.workoutPlan.therapeuticAdvice && m.workoutPlan.therapeuticAdvice.length > 0 && (
                        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 mb-4">
                          <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                            💡 Consigli per il tuo dolore
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-300">
                            {m.workoutPlan.therapeuticAdvice.map((advice: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5">•</span>
                                <span>{advice}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Note di Sicurezza */}
                      {m.workoutPlan.safetyNotes && (
                        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4">
                          <p className="text-blue-300 text-sm">
                            <span className="font-semibold">ℹ️ Nota di sicurezza:</span> {m.workoutPlan.safetyNotes}
                          </p>
                        </div>
                      )}
                      
                      {/* Info Piano */}
                      <div className="flex gap-4 mb-4 text-sm text-gray-400">
                        <span>⏱️ {m.workoutPlan.duration_minutes} min</span>
                        <span>💪 {m.workoutPlan.exercises.length} esercizi</span>
                        <span>📊 {m.workoutPlan.difficulty}</span>
                      </div>
                      
                      {/* Lista Esercizi */}
                      <div className="space-y-2 mb-4">
                        {m.workoutPlan.exercises.map((ex, idx) => (
                          <div key={idx} className="bg-gray-700/50 rounded-lg p-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{ex.name}</span>
                              </div>
                              <div className="text-gray-300 text-sm">
                                <span className="font-semibold text-[#EEBA2B]">{ex.sets}x{ex.reps}</span>
                                {' • '}
                                <span>Recupero: {ex.rest_seconds}s</span>
                              </div>
                              {ex.notes && (
                                <p className="text-gray-400 text-xs mt-1 italic">{ex.notes}</p>
                              )}
                            </div>
                            {/* Bottone GIF a destra */}
                            <div className="ml-3 flex-shrink-0">
                              <ExerciseGifLink exerciseName={ex.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Warmup e Cooldown */}
                      {(m.workoutPlan.warmup || m.workoutPlan.cooldown) && (
                        <div className="space-y-2 mb-4 text-sm">
                          {m.workoutPlan.warmup && (
                            <div className="bg-blue-900/30 rounded-lg p-2">
                              <span className="text-blue-300 font-semibold">🔥 Warmup:</span>
                              <p className="text-gray-300 mt-1">{m.workoutPlan.warmup}</p>
                            </div>
                          )}
                          {m.workoutPlan.cooldown && (
                            <div className="bg-green-900/30 rounded-lg p-2">
                              <span className="text-green-300 font-semibold">🧘 Cooldown:</span>
                              <p className="text-gray-300 mt-1">{m.workoutPlan.cooldown}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Bottoni azioni PrimeBot */}
                  {m.role === 'bot' && m.actions && m.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.actions.map((action, idx) => (
                        <ActionButton
                          key={idx}
                          actionType={action.type}
                          label={action.label}
                          payload={action.payload}
                          onAction={async () => {
                            const result = await executeAction(
                              userId,
                              action.type,
                              action.payload,
                              navigate
                            );
                            
                            if (result.success) {
                              toast.success(result.message || 'Azione completata con successo!');
                            } else {
                              throw new Error(result.error || 'Errore durante l\'esecuzione');
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 ${m.role === 'user' ? 'text-black/70' : 'text-white'}`}>
                    {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Health Disclaimer DOPO i messaggi (quando necessario) */}
            {showPlanDisclaimer && pendingPlan && (
              <div className="max-w-[85%] mr-auto mb-4">
                <HealthDisclaimer
                  userId={userId}
                  disclaimerType="workout_plan"
                  onAccept={() => {
                    // Quando accetta, mostra il piano
                    setShowPlanDisclaimer(false);
                    const botMessage: Msg = {
                      id: crypto.randomUUID(),
                      role: 'bot' as const,
                      text: `Ecco il tuo piano di allenamento personalizzato! 💪`,
                      workoutPlan: pendingPlan.plan,
                      actions: pendingPlan.actions,
                    };
                    setMsgs(m => [...m, botMessage]);
                    setPendingPlan(null);
                  }}
                  context={{
                    plan_name: pendingPlan.plan.name,
                    workout_type: pendingPlan.plan.workout_type,
                  }}
                  userHasLimitations={pendingPlan?.hasLimitations ?? false}
                />
              </div>
            )}
            
            {loading && (
              <div className="mr-auto px-4 py-3 rounded-2xl bg-gray-800 text-white border border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>PrimeBot sta scrivendo…</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Area Bottom - Quick Replies + Input */}
        <div className="flex-shrink-0 border-t border-[#DAA520]/30 bg-black">
          {/* Quick Replies */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {questionsToShow.map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); send(q); }}
                  className="border border-[#DAA520] hover:bg-[#EEBA2B]/10 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <input
                aria-label="Scrivi la tua domanda"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(input); }}
                placeholder="Scrivi la tua domanda…"
                className="flex-1 px-4 py-3 rounded-2xl border border-[#DAA520] focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] bg-gray-800 text-white placeholder-gray-400"
              />
              <button
                onClick={() => send(input)}
                className="px-6 py-3 rounded-2xl bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-semibold disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT NORMALE (non fullscreen)
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-[#DAA520] bg-black text-white min-h-[600px] mb-4 pb-2 md:max-w-4xl sm:max-w-full sm:mx-2">
      <header className="px-6 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-t-2xl text-black font-semibold">
        PrimeBot <span className="text-sm">• Online • Sempre disponibile</span>
      </header>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-black min-h-[400px] max-h-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {msgs.map(m => (
            <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-[#EEBA2B] text-black' // Giallo per utente
                    : (m as any).isDisclaimer 
                      ? 'bg-red-900 text-red-100 border border-red-600 text-sm font-semibold' // Rosso per disclaimer
                      : 'bg-gray-800 text-white border border-gray-600' // Grigio scuro per bot
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {(m as any).isDisclaimer && (
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-200 font-bold">⚠️ AVVISO IMPORTANTE</span>
                    </div>
                  )}
                  {renderFormattedMessage(m.text)}
                </div>
                
                {/* Timestamp sotto ogni messaggio */}
                <div className={`text-xs mt-2 ${
                  m.role === 'user' 
                    ? 'text-black/70' 
                    : 'text-white'
                }`}>
                  {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {/* Pulsante di navigazione per messaggi bot */}
              {m.role === 'bot' && m.navigation && (
                <button
                  onClick={() => navigate(m.navigation!.path)}
                  className="mt-3 px-4 py-2 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#d4a527] transition-colors"
                >
                  {m.navigation.label}
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="mr-auto px-4 py-3 rounded-2xl animate-pulse bg-gray-800 text-white border border-gray-600">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>PrimeBot sta scrivendo…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-[#DAA520]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {questionsToShow.map(q => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                send(q);
              }}
              className="border border-[#DAA520] hover:bg-[#EEBA2B]/10 bg-gray-800 text-white text-sm px-4 py-3 rounded-2xl transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
