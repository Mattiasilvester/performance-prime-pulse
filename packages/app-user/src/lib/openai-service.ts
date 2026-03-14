import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  getSessionHistory,
  formatHistoryForOpenAI,
  saveInteraction,
  type PrimeBotInteraction,
} from '@/services/primebotConversationService';
import {
  getUserContext,
  formatUserContextForPrompt,
  updatePrimeBotPreferences,
  type UserContext,
} from '@/services/primebotUserContextService';
import {
  convertAIResponseToPlan,
  generateStructuredPlan,
  validatePlanVariation,
  type StructuredWorkoutPlan,
} from '@/services/workoutPlanGenerator';
import type { StructuredNutritionPlan } from '@/types/nutritionPlan';
import { 
  getTherapeuticAdvice, 
  detectBodyPart,
  getSafeExercises,
  detectBodyPartFromMessage
} from '@/data/bodyPartExclusions';
import { getUserPains } from '@/services/painTrackingService';

/** Risposta API OpenAI (successo) */
interface OpenAIResponse {
  choices?: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Risposta API OpenAI (errore) */
interface OpenAIErrorResponse {
  error?: { message?: string; type?: string; code?: string };
}

/** Tipo unione per risposta fetch /api/ai-chat */
type OpenAIApiResponse = OpenAIResponse | OpenAIErrorResponse;

// ⚠️ DEPRECATO: Non usare più VITE_OPENAI_API_KEY direttamente
// Chiamata a Supabase Edge Function ai-chat (OPENAI_API_KEY in Supabase secrets)
// ⚠️ TEMPORANEO PER TEST: Limite aumentato a 9999
// TODO: Ripristinare a 10 dopo i test
const MONTHLY_LIMIT = 9999;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Calcola costo
const calculateCost = (promptTokens: number, completionTokens: number) => {
  const costPerMillionInput = 0.50;
  const costPerMillionOutput = 1.50;
  return (promptTokens * costPerMillionInput / 1000000) + 
         (completionTokens * costPerMillionOutput / 1000000);
};

// Check limite mensile
export const checkMonthlyLimit = async (userId: string) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  const { count } = await supabase
    .from('openai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());
    
  return { 
    canUse: (count || 0) < MONTHLY_LIMIT,
    remaining: MONTHLY_LIMIT - (count || 0),
    used: count || 0
  };
};

// Chiama OpenAI
export const getAIResponse = async (
  message: string,
  userId: string,
  sessionId?: string
) => {
  console.log('🤖 getAIResponse chiamata con:', { 
    message: message.substring(0, 50) + '...', 
    userId: userId.substring(0, 8) + '...',
    sessionId: sessionId?.substring(0, 8) + '...'
  });
  
  const limit = await checkMonthlyLimit(userId);
  
  if (!limit.canUse) {
    return {
      success: false,
      type: 'error' as const,
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo o usa i suggerimenti rapidi!`,
      remaining: 0
    };
  }

  try {
    // Recupera il contesto utente per personalizzare le risposte (in scope per system prompt)
    let userContextString = '';
    let userContext: UserContext | null = null;
    try {
      userContext = await getUserContext(userId);
      userContextString = formatUserContextForPrompt(userContext);
      console.log('👤 Contesto utente recuperato:', {
        nome: userContext.nome,
        obiettivi: userContext.obiettivi,
        livello: userContext.livello_fitness_it,
      });

      await updatePrimeBotPreferences(userId, userContext);
    } catch (contextError) {
      console.warn('⚠️ Errore recupero contesto utente (continuo senza personalizzazione):', contextError);
    }

    // Recupera la cronologia conversazione se abbiamo un sessionId
    let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (sessionId) {
      try {
        const history = await getSessionHistory(userId, sessionId, 10);
        conversationHistory = formatHistoryForOpenAI(history);
        console.log(`📚 Cronologia recuperata: ${history.length} messaggi`);
      } catch (historyError) {
        console.warn('⚠️ Errore recupero cronologia (continuo senza):', historyError);
        // Continua senza cronologia se il recupero fallisce
      }
    }

    // Prepara i messaggi per OpenAI: system prompt + cronologia + nuovo messaggio
    const nomeUtente = userContext?.nome && userContext.nome !== 'Utente' ? userContext.nome : null;
    const systemPromptRest = `  STRUTTURA DELLE RISPOSTE:
  - Per esercizi: fornisci SEMPRE almeno 3-5 opzioni con:
    • Nome dell'esercizio
    • Serie x Ripetizioni
    • Tecnica di esecuzione (breve)
    • Suggerimenti pratici
  
  - Per nutrizione: includi:
    • Macronutrienti specifici
    • Timing dei pasti
    • Esempi pratici di alimenti
  
  - Per programmi: crea strutture complete con:
    • Divisione settimanale
    • Progressione nel tempo
    • Varianti per diversi livelli

  PERSONALITÀ:
  - Motivante ma professionale
  - Preciso nei dettagli tecnici
  - Orientato ai risultati
  - Supportivo e incoraggiante

  AZIONI ESEGUIBILI:
  Quando suggerisci azioni concrete, usa il formato [ACTION:tipo:label:payload] alla fine della risposta.
  Il pattern verrà rimosso dal testo visibile e mostrato come bottone cliccabile.
  
  Tipi di azioni disponibili:
  1. save_workout - Salva un piano allenamento
     Formato: [ACTION:save_workout:Salva questo piano:{"name":"Nome Piano","workout_type":"forza","exercises":[],"duration":45}]
  
  2. add_diary - Aggiunge una nota al diario
     Formato: [ACTION:add_diary:Aggiungi al diario:{"content":"Testo della nota","title":"Titolo opzionale"}]
  
  3. navigate - Naviga a una pagina dell'app
     Formato: [ACTION:navigate:Vai agli allenamenti:/workouts]
     Path disponibili: /workouts, /piani, /diario, /dashboard, /workout/quick
  
  4. start_workout - Avvia un allenamento rapido
     Formato: [ACTION:start_workout:Inizia allenamento:{"workout_type":"quick"}]
  
  REGOLE AZIONI:
  - Usa azioni solo quando l'utente richiede azioni concrete (salvare, navigare, tracciare)
  - Non usare azioni per risposte generiche o informative
  - Il payload deve essere JSON valido
  - Massimo 2 azioni per risposta

  ESEMPIO DI RISPOSTA PER "esercizi tricipiti":
  
  💪 **Ecco i migliori esercizi per i tricipiti:**

  **1. French Press con Manubrio** 🏋️‍♂️
  • 3 serie x 10-12 ripetizioni
  • Mantieni i gomiti fermi e stretti
  • Scendi lentamente (3 secondi) per massimizzare il tempo sotto tensione

  **2. Dips alle Parallele** 💯
  • 3 serie x 8-10 ripetizioni
  • Inclinati leggermente in avanti
  • Se troppo difficile, usa la variante assistita

  **3. Push-down ai Cavi** 🔥
  • 4 serie x 12-15 ripetizioni
  • Gomiti bloccati ai fianchi
  • Squeeze di 1 secondo in contrazione massima

  **4. Diamond Push-ups** 💎
  • 3 serie x max ripetizioni
  • Mani a forma di diamante
  • Perfetto per finire l'allenamento

  **💡 Pro Tip:** Alterna esercizi pesanti (french press) con esercizi di isolamento (push-down) per risultati ottimali!

  Ricorda: la costanza in Performance Prime è la chiave del successo! 🚀

  GESTIONE DOLORI E LIMITAZIONI FISICHE:

  Quando l'utente menziona dolori, infortuni o limitazioni fisiche (es. "ho mal di schiena", "mi fa male il ginocchio", "ho un problema alla spalla"):

  1. PRIMA: Mostra empatia e consiglia di consultare un professionista
     Esempio: "Mi dispiace per il tuo [problema]. Ti consiglio di consultare un fisioterapista o medico per una valutazione professionale."

  2. POI: Dai consigli pratici UTILI su:
     - Quali esercizi EVITARE per quella zona
     - Quali esercizi ALTERNATIVI sono più sicuri
     - Suggerimenti generali di stretching/mobilità

  3. IMPORTANTE: Non dire MAI "non posso aiutarti" o "vai solo dal medico". 
     Sii UTILE dando consigli pratici mentre raccomandi il professionista.

  ESEMPI DI RISPOSTA CORRETTA:

  Utente: "Ho mal di schiena, cosa posso fare?"
  Risposta: "Mi dispiace per il mal di schiena! Ti consiglio di consultare un fisioterapista per capire la causa esatta.
  Nel frattempo, ecco alcuni consigli:
  **Esercizi da EVITARE:** Stacchi da terra, squat pesante, crunch tradizionali
  **Alternative SICURE:** Ponte glutei, bird-dog, plank (se non causa dolore), stretching del gatto
  **Mobilità:** Stretching dei flessori dell'anca, rotazioni del bacino
  Su Performance Prime puoi trovare fisioterapisti qualificati che possono aiutarti! 💪"

  Utente: "Mi fa male il ginocchio quando faccio squat"
  Risposta: "Il dolore al ginocchio durante lo squat può avere diverse cause. Ti consiglio una visita da un fisioterapista.
  Nel frattempo:
  **Modifica lo squat:** Prova squat al muro o box squat con range ridotto
  **Alternative:** Leg press con range controllato, ponte glutei, affondi inversi
  **Evita:** Squat profondi, jump squat, affondi in avanzamento
  Vuoi che ti crei un piano che eviti stress sulle ginocchia? 🏋️"

  REGOLE SU PIANI E CONSIGLI PROFESSIONALI:

  Quando fornisci piani di allenamento, schede, routine o programmi di esercizio:
  - Crea il piano con precisione e cura, usando i dati reali dell'utente
  - Concludi SEMPRE con: "💪 Ricorda: questo è un piano indicativo personalizzato sui tuoi dati. Per un programma professionale con supervisione continua, puoi trovare un Personal Trainer certificato su Performance Prime."

  Quando fornisci piani alimentari, consigli nutrizionali specifici o calcoli calorici/macronutrienti:
  - Fornisci i consigli con precisione, usando peso/altezza/età/allergie dell'utente
  - Concludi SEMPRE con: "🥗 Questi sono consigli nutrizionali indicativi. Per una dieta personalizzata e sicura, ti consiglio di consultare uno dei nostri Nutrizionisti su Performance Prime."

  Quando l'utente menziona dolori, infortuni o condizioni mediche:
  - Suggerisci alternative sicure ed esercizi adatti
  - Concludi SEMPRE con: "⚕️ Per dolori o condizioni mediche specifiche, ti consiglio di consultare uno dei nostri Fisioterapisti su Performance Prime prima di riprendere l'allenamento."

  In tutti gli altri casi (domande generali, tecnica degli esercizi, motivazione, spiegazioni) NON aggiungere disclaimer — rispondi normalmente.
  Il tono del disclaimer deve essere sempre naturale e incoraggiante, mai un muro di testo legale. Una frase, alla fine della risposta.`;

    let systemPrompt = `Sei PrimeBot, l'AI Coach personale${nomeUtente ? ` di ${nomeUtente}` : ''} su Performance Prime.
Sei un coach esperto, motivante e preciso.

REGOLE FONDAMENTALI:
${nomeUtente ? `- Chiama l'utente per nome (${nomeUtente}) quando è naturale farlo\n` : '- Rivolgiti all\'utente in modo personale\n'}- Non chiedere mai dati già presenti nel profilo (obiettivo, livello, peso, ecc.)
- Se l'utente ha limitazioni fisiche o zone da proteggere, NON proporre MAI esercizi che coinvolgono quelle zone
- Adatta sempre volume, intensità e selezione esercizi al livello di esperienza indicato
- Se la durata sessione è indicata nel profilo, rispetta quel vincolo di tempo
- Rispondi sempre in italiano

` + systemPromptRest;

    // Aggiungi contesto utente al system prompt se disponibile
    if (userContextString) {
      systemPrompt += `\n\nCONTESTO UTENTE:\n${userContextString}\n\nIMPORTANTE: Personalizza le tue risposte in base ai dati dell'utente sopra. Usa il suo nome quando appropriato e adatta consigli/allenamenti al suo livello, obiettivi e attrezzatura disponibile.`;
    }

    const onboardingCompleted = userContext?.onboarding_completed ?? false;
    if (!onboardingCompleted) {
      systemPrompt += `\n\nATTENZIONE - PROFILO INCOMPLETO:
L'utente NON ha ancora completato il profilo.
- Non hai informazioni precise su peso, altezza, obiettivi specifici, limitazioni fisiche.
- Se l'utente ti fa domande generiche, rispondi ma alla FINE del messaggio aggiungi sempre (una sola volta per conversazione): "💡 Per ricevere consigli 100% personalizzati, completa il tuo profilo in Impostazioni → Il mio profilo!"
- Se l'utente chiede un piano allenamento o nutrizionale, prima di generarlo chiedi: "Hai già completato il tuo profilo? Se sì posso personalizzarlo per te, altrimenti ti darò un piano standard."
- Non fingere di conoscere dati che non hai.`;
    }

    console.log('SYSTEM PROMPT:', systemPrompt.substring(0, 500));

    // Costruisci array messaggi: system + cronologia + nuovo messaggio
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...conversationHistory, // Aggiungi cronologia conversazione
      {
        role: 'user' as const,
        content: message
      }
    ];

    console.log(`📤 Invio a OpenAI: ${messages.length} messaggi totali (1 system + ${conversationHistory.length} cronologia + 1 nuovo)`);

    // Chiama l'API serverless invece di usare chiave diretta
    let response: Response;
    let data: OpenAIApiResponse;
    
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4o-mini'
        })
      });
      
      data = await response.json() as OpenAIApiResponse;
    } catch (fetchError: unknown) {
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const causeCode = fetchError && typeof fetchError === 'object' && 'cause' in fetchError
        ? (fetchError as { cause?: { code?: string } }).cause?.code
        : undefined;
      // Gestione errore connessione (server proxy non disponibile)
      if (msg?.includes('ECONNREFUSED') ||
          msg?.includes('Failed to fetch') ||
          causeCode === 'ECONNREFUSED') {
        console.error('❌ ERRORE: Errore di connessione al servizio AI');
        console.error('💡 SOLUZIONE: Avvia il server proxy con: npm run dev:api');
        console.error('💡 OPPURE: Avvia tutto insieme con: npm run dev:all');
        
        return {
          success: false,
          message: '⚠️ Server backend non disponibile. Per far funzionare PrimeBot:\n\n1. Apri un nuovo terminale\n2. Esegui: npm run dev:api\n3. Oppure: npm run dev:all (avvia tutto insieme)\n\nIl server proxy è necessario per chiamare l\'API OpenAI in modo sicuro.',
          remaining: limit.remaining
        };
      }
      
      // Rilancia altri errori
      throw fetchError;
    }
    
    console.log('📡 Risposta OpenAI ricevuta:', response.status, response.statusText);
    console.log('📡 Dati risposta:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Errore HTTP OpenAI:', response.status, response.statusText);
      console.error('❌ Dettagli errore:', data);
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }
    
    if (!('choices' in data) || !data.choices?.length || !data.choices[0]) {
      console.error('❌ Risposta OpenAI non valida:', data);
      throw new Error('Risposta OpenAI non valida');
    }
    
    const successData = data as OpenAIResponse;
    // Salva uso
    const cost = calculateCost(
      successData.usage?.prompt_tokens || 0,
      successData.usage?.completion_tokens || 0
    );
    
    await supabase.from('openai_usage_logs').insert({
      user_id: userId,
      tokens_prompt: successData.usage?.prompt_tokens || 0,
      tokens_completion: successData.usage?.completion_tokens || 0,
      tokens_total: successData.usage?.total_tokens || 0,
      cost_usd: cost,
      model: 'gpt-4o-mini',
      message: message.substring(0, 500),
      response: (successData.choices?.[0]?.message?.content ?? '').substring(0, 500)
    });

    console.log(`[AI] User: ${userId.substring(0,8)}... | Uso: ${limit.used + 1}/${MONTHLY_LIMIT} | Costo: $${cost.toFixed(5)}`);
    
    const botResponse = successData.choices?.[0]?.message?.content ?? '';

    // Salva l'interazione su primebot_interactions (se abbiamo sessionId)
    if (sessionId) {
      try {
        const interaction: PrimeBotInteraction = {
          user_id: userId,
          session_id: sessionId,
          message_content: message,
          bot_response: botResponse,
          interaction_type: 'text',
          user_context: {
            page: window.location.pathname,
          },
        };

        await saveInteraction(interaction);
        console.log('✅ Interazione salvata su primebot_interactions');
      } catch (saveError) {
        console.warn('⚠️ Errore salvataggio interazione (continuo comunque):', saveError);
        // Non bloccare il flusso se il salvataggio fallisce
      }
    }
    
    return {
      success: true,
      message: botResponse,
      remaining: limit.remaining - 1
    };
    
  } catch (error) {
    console.error('❌ Errore OpenAI completo:', error);
    console.error('❌ Tipo errore:', typeof error);
    console.error('❌ Messaggio errore:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      success: false,
      message: 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco!',
      remaining: limit.remaining
    };
  }
};

/**
 * Genera un piano allenamento strutturato con variazione set/rep
 */
export const getStructuredWorkoutPlan = async (
  request: string,
  userId: string,
  sessionId?: string
): Promise<{
  success: boolean;
  plan?: StructuredWorkoutPlan;
  message?: string;
  remaining?: number;
  type?: 'plan' | 'question' | 'error';
  question?: string;
  awaitingLimitationsResponse?: boolean;
  hasExistingLimitations?: boolean; // Info per decidere se mostrare disclaimer
  hasAnsweredBefore?: boolean; // True se ha già risposto prima
  errorType?: 'json_parse' | 'api_error' | 'validation_error'; // Tipo di errore
}> => {
  console.log('🏋️ getStructuredWorkoutPlan chiamata con:', {
    request: request.substring(0, 50) + '...',
    userId: userId.substring(0, 8) + '...',
  });

  const limit = await checkMonthlyLimit(userId);

  if (!limit.canUse) {
    return {
      success: false,
      type: 'error' as const,
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo!`,
      remaining: 0,
    };
  }

  try {
    // PRIMA: Controllo intelligente limitazioni
    const { getSmartLimitationsCheck } = await import('@/services/primebotUserContextService');
    const limitationsCheck = await getSmartLimitationsCheck(userId);
    
    console.log('🔍 getStructuredWorkoutPlan - limitationsCheck:', {
      needsToAsk: limitationsCheck.needsToAsk,
      needsToAskType: typeof limitationsCheck.needsToAsk,
      hasExistingLimitations: limitationsCheck.hasExistingLimitations,
      suggestedQuestion: limitationsCheck.suggestedQuestion?.substring(0, 50) + '...',
      suggestedQuestionExists: !!limitationsCheck.suggestedQuestion,
    });
    
    // SE needsToAsk === true, ritorna domanda invece di generare piano
    // IMPORTANTE: Controllo esplicito per true (non solo truthy)
    if (limitationsCheck.needsToAsk === true && limitationsCheck.suggestedQuestion) {
      console.log('✅ Ritorno domanda invece di generare piano - needsToAsk è TRUE');
      return {
        success: false,
        type: 'question',
        question: limitationsCheck.suggestedQuestion,
        awaitingLimitationsResponse: true,
        remaining: limit.remaining,
      };
    }
    
    console.log('⚠️ needsToAsk è false/null/undefined, procedo con generazione piano');
    
    // Recupera contesto utente
    const userContext = await getUserContext(userId);
    const planContext = generateStructuredPlan(userContext, request);

    // Recupera cronologia conversazione
    let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    if (sessionId) {
      try {
        const { getSessionHistory, formatHistoryForOpenAI } = await import('@/services/primebotConversationService');
        const history = await getSessionHistory(userId, sessionId, 10);
        conversationHistory = formatHistoryForOpenAI(history);
      } catch (historyError) {
        console.warn('⚠️ Errore recupero cronologia (continuo senza):', historyError);
      }
    }

    // Costruisci sezione limitazioni per System Prompt con esclusioni specifiche
    let limitationsSection = '';
    let excludedExercises: string[] = [];
    let therapeuticAdvice: string[] = [];
    
    if (limitationsCheck.hasExistingLimitations && limitationsCheck.limitations) {
      console.log('🏥 STEP 4 - Limitazione ricevuta in getStructuredWorkoutPlan:', limitationsCheck.limitations);
      
      // Importa funzioni per esclusioni e consigli terapeutici
      const { getExcludedExercises, getTherapeuticAdvice } = await import('@/data/bodyPartExclusions');
      
      console.log('🔍 getExcludedExercises - Input:', limitationsCheck.limitations);
      excludedExercises = getExcludedExercises(limitationsCheck.limitations);
      console.log('✅ Esercizi esclusi trovati:', excludedExercises.length, 'esercizi');
      
      console.log('💊 getTherapeuticAdvice - Input:', limitationsCheck.limitations);
      therapeuticAdvice = getTherapeuticAdvice(limitationsCheck.limitations);
      console.log('✅ Consigli terapeutici trovati:', therapeuticAdvice.length, 'consigli');
      
      const zonesStr = limitationsCheck.zones && limitationsCheck.zones.length > 0
        ? limitationsCheck.zones.join(', ')
        : 'nessuna zona specifica indicata';
      
      const medicalStr = limitationsCheck.medicalConditions
        ? `\nCondizioni mediche: ${limitationsCheck.medicalConditions}`
        : '';
      
      limitationsSection = `
⚠️ ATTENZIONE CRITICA - LIMITAZIONE FISICA:
L'utente ha dichiarato: "${limitationsCheck.limitations}"
Zone del corpo da EVITARE: ${zonesStr}${medicalStr}

ESERCIZI ASSOLUTAMENTE VIETATI (non includerli MAI nel piano):
${excludedExercises.length > 0 
  ? excludedExercises.map(ex => `- ${ex}`).join('\n')
  : '- Nessun esercizio specifico da escludere (usa cautela generale)'}

REGOLE OBBLIGATORIE:
1. Escludere COMPLETAMENTE tutti gli esercizi sopra elencati
2. Proporre SOLO esercizi sicuri che NON coinvolgono la zona dolorante
3. Preferire esercizi a corpo libero o con macchine guidate che isolano i muscoli
4. Ridurre l'intensità generale del piano rispetto al normale
5. Ogni esercizio deve essere verificato mentalmente: "Questo esercizio coinvolge la zona dolorante?" Se sì, NON includerlo

Esempi di esercizi SICURI per limitazioni comuni:
- Spalla: leg press, curl gambe, crunch, esercizi per gambe seduto
- Schiena: ponte glutei, leg press, esercizi per gambe da seduto, mobilità dolce
- Ginocchio: esercizi per parte superiore seduto, curl bicipiti, tricipiti, addominali

⚠️ REGOLA FONDAMENTALE: Se l'utente ha una limitazione, OGNI esercizio deve essere verificato mentalmente: "Questo esercizio coinvolge la zona dolorante?" Se sì, NON includerlo.
`;
    } else {
      limitationsSection = `
L'utente non ha indicato limitazioni fisiche. Puoi proporre qualsiasi esercizio appropriato al suo livello.
`;
    }

    // System Prompt SPECIFICO per piani strutturati con VARIAZIONE OBBLIGATORIA
    const workoutPlanSystemPrompt = `IMPORTANTE: Rispondi SEMPRE e SOLO in italiano. Mai usare inglese. Tutti i nomi degli esercizi devono essere in italiano. Il JSON deve contenere solo testo italiano.

Sei PrimeBot, esperto di Performance Prime. L'utente ha richiesto un piano di allenamento.

${limitationsSection}

REGOLA CRITICA - VARIAZIONE SERIE/RIPETIZIONI:
⚠️ NON puoi creare un piano dove tutti gli esercizi hanno le stesse serie e ripetizioni!
⚠️ DEVI variare serie/ripetizioni in base al tipo di esercizio!

REGOLE VARIAZIONE SET/REP (OBBLIGATORIE):

1. ESERCIZI COMPOSTI PRINCIPALI (squat, panca piana, stacco):
   • Serie: 4
   • Ripetizioni: 6-8
   • Recupero: 90-120 secondi
   • Esempi: Squat, Panca Piana, Stacco, Deadlift

2. ESERCIZI COMPOSTI SECONDARI (rematore, military press, lento avanti):
   • Serie: 4
   • Ripetizioni: 8-10
   • Recupero: 75-90 secondi
   • Esempi: Rematore, Military Press, Overhead Press

3. ESERCIZI ISOLAMENTO (curl, tricipiti, laterali):
   • Serie: 3
   • Ripetizioni: 10-12
   • Recupero: 60 secondi
   • Esempi: Curl Bicipiti, Tricipiti Pushdown, Alzate Laterali

4. ESERCIZI ISOLAMENTO LEGGERI (crunch, polpacci, addominali):
   • Serie: 3
   • Ripetizioni: 15-20
   • Recupero: 45 secondi
   • Esempi: Crunch, Polpacci, Sit-up

5. ESERCIZI A TEMPO (plank, wall sit):
   • Serie: 3
   • Durata: 30-45 secondi
   • Recupero: 45 secondi
   • Esempi: Plank, Wall Sit, Hollow Hold

ESEMPIO PIANO CORRETTO (con variazione):
${(() => {
  interface ExamplePlanExercise {
    name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes: string;
    exercise_type: string;
  }
  const examplePlan: {
    name: string;
    description: string;
    workout_type: string;
    duration_minutes: number;
    difficulty: string;
    exercises: ExamplePlanExercise[];
    warmup?: string;
    cooldown?: string;
    therapeuticAdvice?: string[];
    safetyNotes?: string;
  } = {
    name: "Piano Forza - Petto e Tricipiti",
    description: "Piano personalizzato per aumentare forza nella parte superiore",
    workout_type: "forza",
    duration_minutes: 45,
    difficulty: "intermediate",
    exercises: [
      {
        name: "Panca Piana con Bilanciere",
        sets: 4,
        reps: "6-8",
        rest_seconds: 90,
        notes: "Mantieni la schiena aderente alla panca",
        exercise_type: "compound"
      },
      {
        name: "Rematore con Manubrio",
        sets: 4,
        reps: "8-10",
        rest_seconds: 75,
        notes: "Movimento controllato",
        exercise_type: "compound_secondary"
      },
      {
        name: "Croci con Manubri",
        sets: 3,
        reps: "10-12",
        rest_seconds: 60,
        notes: "Movimento controllato, non bloccare i gomiti",
        exercise_type: "isolation"
      },
      {
        name: "Tricipiti Pushdown",
        sets: 3,
        reps: "10-12",
        rest_seconds: 60,
        notes: "Gomiti bloccati ai fianchi",
        exercise_type: "isolation"
      },
      {
        name: "Crunch",
        sets: 3,
        reps: "15-20",
        rest_seconds: 45,
        notes: "Movimento controllato",
        exercise_type: "isolation_light"
      },
      {
        name: "Plank",
        sets: 3,
        reps: "45 secondi",
        rest_seconds: 45,
        notes: "Mantieni posizione corretta",
        exercise_type: "time_based"
      }
    ],
    warmup: "5 min cardio leggero + 10 piegamenti leggeri + mobilità spalle",
    cooldown: "Stretching pettorali 30sec per lato + stretching tricipiti"
  };
  
  if (limitationsCheck.hasExistingLimitations && therapeuticAdvice.length > 0) {
    examplePlan.therapeuticAdvice = therapeuticAdvice;
    examplePlan.safetyNotes = `Piano adattato per ${limitationsCheck.limitations}. Gli esercizi sono stati selezionati per evitare stress sulla zona interessata.`;
  }
  
  return JSON.stringify(examplePlan, null, 2);
})()}

${limitationsCheck.hasExistingLimitations && therapeuticAdvice.length > 0 ? `
IMPORTANTE: Se l'utente ha limitazioni fisiche, il JSON DEVE includere:
- "therapeuticAdvice": array di stringhe con consigli terapeutici (esempio: ${JSON.stringify(therapeuticAdvice.slice(0, 2))})
- "safetyNotes": stringa che spiega l'adattamento del piano. DEVI usare ESATTAMENTE questa frase: "Piano adattato per ${limitationsCheck.limitations || 'limitazioni fisiche'}. Gli esercizi sono stati selezionati per evitare stress sulla zona interessata."
IMPORTANTE: Il campo "safetyNotes" deve contenere SOLO testo plain senza caratteri speciali, senza &, senza *, senza markdown di nessun tipo.
Esempio corretto: "Nota di sicurezza: Piano adattato..."
Esempio SBAGLIATO: "& &p **Nota di sicurezza**..."
` : ''}

⚠️ IMPORTANTE:
- Il piano DEVE avere MINIMO 5 esercizi, MASSIMO 10 esercizi
- DEVI variare serie/ripetizioni tra esercizi diversi
- NON creare piani dove tutti gli esercizi hanno "3x10" o "4x8" identici!
- Usa esercizi appropriati per il livello: ${planContext.difficulty}
- Rispetta attrezzatura disponibile: ${userContext.attrezzatura_disponibile.join(', ')}
- Durata totale: ${planContext.duration_minutes} minuti

⚠️ FORMATO RISPOSTA OBBLIGATORIO:
Devi rispondere ESCLUSIVAMENTE con un JSON valido, senza testo prima o dopo.
NON aggiungere spiegazioni, NON aggiungere testo introduttivo, NON aggiungere commenti.
La risposta deve iniziare con { e finire con }.

${limitationsCheck.hasExistingLimitations && therapeuticAdvice.length > 0 ? `
IMPORTANTE: Il JSON DEVE includere il campo "therapeuticAdvice" con i consigli terapeutici e "safetyNotes" con una nota di sicurezza.
` : ''}

⚠️ IMPORTANTE: Se non rispondi con JSON valido, la risposta verrà scartata.`;

    // Log finale per debug
    console.log('🏥 STEP 5 - Prompt finale per OpenAI:', {
      hasLimitations: limitationsCheck.hasExistingLimitations,
      limitations: limitationsCheck.limitations,
      excludedExercisesCount: excludedExercises.length,
      therapeuticAdviceCount: therapeuticAdvice.length,
      therapeuticAdviceFirst: therapeuticAdvice[0]?.substring(0, 50) || 'N/A',
      safetyNotesExample: limitationsCheck.limitations ? `Piano adattato per ${limitationsCheck.limitations}. Gli esercizi sono stati selezionati per evitare stress sulla zona interessata.` : 'N/A',
    });
    
    const messages = [
      {
        role: 'system' as const,
        content: workoutPlanSystemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: request,
      },
    ];

    console.log('📤 Invio richiesta piano strutturato a OpenAI');

    let response: Response;
    let data: OpenAIApiResponse;
    
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4o-mini',
        }),
      });
      
      data = await response.json() as OpenAIApiResponse;
    } catch (fetchError: unknown) {
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const causeCode = fetchError && typeof fetchError === 'object' && 'cause' in fetchError
        ? (fetchError as { cause?: { code?: string } }).cause?.code
        : undefined;
      // Gestione errore connessione (server proxy non disponibile)
      if (msg?.includes('ECONNREFUSED') ||
          msg?.includes('Failed to fetch') ||
          causeCode === 'ECONNREFUSED') {
        console.error('❌ ERRORE: Errore di connessione al servizio AI');
        console.error('💡 SOLUZIONE: Avvia il server proxy con: npm run dev:api');
        
        return {
          success: false,
          type: 'error',
          message: '⚠️ Server backend non disponibile. Avvia il server proxy con: npm run dev:api',
          remaining: limit.remaining,
        };
      }
      
      throw fetchError;
    }

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    if (!('choices' in data) || !data.choices?.length || !data.choices[0]) {
      throw new Error('Risposta OpenAI non valida');
    }

    const successData = data as OpenAIResponse;
    let aiResponse = successData.choices?.[0]?.message?.content ?? '';
    console.log('📥 Risposta AI ricevuta:', aiResponse.substring(0, 200) + '...');

    // Converti risposta AI in piano strutturato con gestione errori robusta
    let plan: StructuredWorkoutPlan | null = null;
    let parseError: Error | null = null;
    
    try {
      plan = convertAIResponseToPlan(aiResponse);
    } catch (error) {
      parseError = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Errore critico in convertAIResponseToPlan:', parseError);
    }

    // Se il parsing fallisce e non c'è JSON, prova un retry con prompt più forte
    if (!plan && (!aiResponse.includes('{') || !aiResponse.includes('}'))) {
      console.warn('⚠️ Risposta non contiene JSON, provo retry con prompt più forte...');
      
      try {
        const retryMessages = [
          {
            role: 'system' as const,
            content: `Sei PrimeBot. L'utente ha richiesto un piano di allenamento. 

${limitationsSection}

${workoutPlanSystemPrompt}

⚠️ CRITICO: Devi rispondere ESCLUSIVAMENTE con JSON valido. NIENTE ALTRO. Inizia con { e termina con }.`,
          },
          {
            role: 'user' as const,
            content: request,
          },
        ];

        let retryResponse: Response;
        let retryData: OpenAIApiResponse;
        
        try {
          retryResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              messages: retryMessages,
              model: 'gpt-4o-mini',
            }),
          });
          
          retryData = await retryResponse.json() as OpenAIApiResponse;
          
          if (retryResponse.ok && 'choices' in retryData && retryData.choices?.length && retryData.choices[0]) {
            aiResponse = (retryData as OpenAIResponse).choices?.[0]?.message?.content ?? '';
            console.log('📥 Risposta retry ricevuta:', aiResponse.substring(0, 200) + '...');
            plan = convertAIResponseToPlan(aiResponse);
            if (plan) {
              console.log('✅ Piano generato dopo retry!');
            }
          }
        } catch (retryError: unknown) {
          const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
          const retryCause = retryError && typeof retryError === 'object' && 'cause' in retryError
            ? (retryError as { cause?: { code?: string } }).cause?.code
            : undefined;
          if (retryMsg?.includes('ECONNREFUSED') ||
              retryMsg?.includes('Failed to fetch') ||
              retryCause === 'ECONNREFUSED') {
            console.error('❌ ERRORE: Server proxy non disponibile durante retry');
            throw new Error('Server backend non disponibile. Avvia con: npm run dev:api');
          }
          console.error('❌ Errore durante retry:', retryError);
        }
      } catch (retryError) {
        console.error('❌ Errore durante retry:', retryError);
      }
    }

    if (!plan) {
      // Ritorna tipo 'error' con dettagli specifici
      const errorMessage = parseError?.message || 'Errore nella generazione del piano';
      const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('SyntaxError') || !aiResponse.includes('{');
      
      console.error('❌ Piano non generato:', {
        errorMessage,
        isJsonError,
        aiResponsePreview: aiResponse.substring(0, 300),
        hasJson: aiResponse.includes('{') && aiResponse.includes('}'),
      });
      
      return {
        success: false,
        type: 'error',
        message: isJsonError 
          ? 'Errore nella generazione del piano: formato non valido. Riprova!'
          : 'Errore nella generazione del piano. Riprova!',
        remaining: limit.remaining,
        errorType: isJsonError ? 'json_parse' : 'api_error',
      };
    }

    // Sanitizza sempre safetyNotes da OpenAI: rimuovi & iniziale (ASCII o fullwidth) per evitare residui nel PDF
    if (plan?.safetyNotes && typeof plan.safetyNotes === 'string') {
      plan.safetyNotes = plan.safetyNotes.replace(/^\s*[&\uFF06]\s*/, '').trim();
    }

    // FIX CRITICO: Forza consigli terapeutici e safety notes corretti (OpenAI potrebbe ignorarli)
    if (limitationsCheck.hasExistingLimitations && limitationsCheck.limitations && plan) {
      console.log('💊 Forzando consigli terapeutici pre-calcolati per:', limitationsCheck.limitations);
      
      // Sovrascrivi i consigli di OpenAI con quelli corretti
      const correctAdvice = getTherapeuticAdvice(limitationsCheck.limitations);
      console.log('💊 Consigli corretti:', correctAdvice);
      plan.therapeuticAdvice = correctAdvice;
      
      // ⭐ FIX PROBLEMA 2: Recupera zone dolore dal database per safety note
      let safetyZones = limitationsCheck.limitations; // fallback
      
      try {
        console.log('🛡️ PROBLEMA 2 FIX: Recupero zone dolore dal database per userId:', userId.substring(0, 8) + '...');
        const painResult = await getUserPains(userId);
        if (painResult && painResult.pains && painResult.pains.length > 0) {
          safetyZones = painResult.pains.map(p => p.zona).join(', ');
          console.log('🛡️ PROBLEMA 2 FIX: Usando zone dal database:', safetyZones);
        } else {
          console.log('🛡️ PROBLEMA 2 FIX: Nessun dolore trovato nel database, uso fallback');
        }
      } catch (e) {
        console.warn('🛡️ PROBLEMA 2 FIX: Errore recupero dolori dal database, uso fallback:', e);
        // Se getUserPains fallisce, prova a usare detectBodyPartFromMessage come fallback
        const bodyPart = detectBodyPartFromMessage(limitationsCheck.limitations);
        if (bodyPart) {
          safetyZones = bodyPart;
          console.log('🛡️ PROBLEMA 2 FIX: Fallback a detectBodyPartFromMessage:', bodyPart);
        }
      }
      
      // Genera safety note usando zone dal database
      // Se safetyZones contiene più zone, formatta correttamente
      const zonesArray = safetyZones.split(',').map(z => z.trim());
      
      if (zonesArray.length === 1) {
        // Singola zona
        const zona = zonesArray[0];
        const preposition = ['anca', 'addome'].includes(zona.toLowerCase()) ? "all'" : 
                            ['spalla', 'schiena', 'caviglia', 'coscia'].includes(zona.toLowerCase()) ? 'alla ' : 'al ';
        plan.safetyNotes = `Nota di sicurezza: Piano adattato per il dolore ${preposition}${zona}. Tutti gli esercizi sono stati selezionati per evitare stress sulla zona interessata. Ascolta sempre il tuo corpo e fermati se senti dolore.`;
      } else if (zonesArray.length > 1) {
        // Multiple zone
        const zonesText = zonesArray.slice(0, -1).join(', ') + ' e ' + zonesArray[zonesArray.length - 1];
        plan.safetyNotes = `Nota di sicurezza: Piano adattato per i dolori a ${zonesText}. Tutti gli esercizi sono stati selezionati per evitare stress su queste zone. Ascolta sempre il tuo corpo e fermati se senti dolore.`;
      } else {
        // Fallback se non ci sono zone valide
        plan.safetyNotes = `Nota di sicurezza: Piano adattato per le tue limitazioni fisiche. Gli esercizi sono stati selezionati per evitare stress sulle zone interessate.`;
      }
      
      console.log('🛡️ PROBLEMA 2 FIX: Safety note generata:', plan.safetyNotes);
    }

    // ============================================
    // 🛡️ FORZA ESERCIZI SICURI SE C'È UNA LIMITAZIONE
    // ============================================
    if (limitationsCheck.hasExistingLimitations && limitationsCheck.limitations) {
      console.log('🛡️ WHITELIST: Applicando esercizi sicuri per:', limitationsCheck.limitations);
      
      const safeExercises = getSafeExercises(limitationsCheck.limitations);
      
      if (safeExercises && safeExercises.length > 0) {
        // Mescola gli esercizi per varietà
        const shuffled = [...safeExercises].sort(() => Math.random() - 0.5);
        
        // Prendi 7-8 esercizi
        const selectedCount = Math.min(8, Math.max(6, shuffled.length));
        const selectedExercises = shuffled.slice(0, selectedCount);
        
        console.log(`💪 WHITELIST: Sostituisco ${plan.exercises?.length || 0} esercizi OpenAI con ${selectedExercises.length} esercizi sicuri`);
        
        // Log esercizi selezionati
        selectedExercises.forEach((ex, i) => {
          console.log(`   ${i + 1}. ${ex.name}`);
        });
        
        // Converti gli esercizi dalla whitelist al formato del piano
        plan.exercises = selectedExercises.map(ex => {
          // Converti rest da string a number (gestisce "90s", "15 min", "-")
          let restSeconds = 60; // default
          if (ex.rest && ex.rest !== '-') {
            if (ex.rest.includes('min')) {
              const minutes = parseInt(ex.rest.replace('min', '').trim());
              restSeconds = minutes * 60;
            } else if (ex.rest.includes('s')) {
              restSeconds = parseInt(ex.rest.replace('s', '').trim()) || 60;
            } else {
              restSeconds = parseInt(ex.rest) || 60;
            }
          }
          
          // Determina exercise_type basato sul nome (semplificato)
          let exerciseType: 'compound' | 'compound_secondary' | 'isolation' | 'isolation_light' | 'time_based' = 'isolation';
          const nameLower = ex.name.toLowerCase();
          if (nameLower.includes('press') || nameLower.includes('pulldown') || nameLower.includes('row')) {
            exerciseType = 'compound';
          } else if (nameLower.includes('curl') || nameLower.includes('raise') || nameLower.includes('extension')) {
            exerciseType = 'isolation';
          } else if (nameLower.includes('crunch') || nameLower.includes('bridge')) {
            exerciseType = 'isolation_light';
          } else if (nameLower.includes('cyclette') || nameLower.includes('camminata') || nameLower.includes('nuoto')) {
            exerciseType = 'time_based';
          }
          
          return {
            name: ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps,
            rest_seconds: restSeconds,
            notes: ex.notes,
            exercise_type: exerciseType,
          };
        });
        
        console.log(`✅ WHITELIST: Piano aggiornato con ${plan.exercises.length} esercizi sicuri`);
      } else {
        console.log('⚠️ WHITELIST: Nessuna whitelist trovata, mantengo esercizi OpenAI');
      }
    }
    
    // Valida variazione
    const validation = validatePlanVariation(plan);
    if (!validation.isValid) {
      console.warn('⚠️ Piano non valido, rigenerando...', validation.warnings);
      // Potresti rigenerare qui, ma per ora restituiamo con warning
    }

    // Salva uso
    const cost = calculateCost(
      data.usage?.prompt_tokens || 0,
      data.usage?.completion_tokens || 0
    );

    await supabase.from('openai_usage_logs').insert({
      user_id: userId,
      tokens_prompt: data.usage?.prompt_tokens || 0,
      tokens_completion: data.usage?.completion_tokens || 0,
      tokens_total: data.usage?.total_tokens || 0,
      cost_usd: cost,
      model: 'gpt-4o-mini',
      message: request.substring(0, 500),
      response: aiResponse.substring(0, 500),
    });

    // Salva interazione
    if (sessionId) {
      try {
        const interaction: PrimeBotInteraction = {
          user_id: userId,
          session_id: sessionId,
          message_content: request,
          bot_response: `Piano generato: ${plan.name}`,
          interaction_type: 'text',
          user_context: {
            page: window.location.pathname,
            plan_generated: true,
          },
        };
        await saveInteraction(interaction);
      } catch (saveError) {
        console.warn('⚠️ Errore salvataggio interazione:', saveError);
      }
    }

    return {
      success: true,
      plan,
      remaining: limit.remaining - 1,
      type: 'plan' as const,
      hasExistingLimitations: limitationsCheck.hasExistingLimitations, // Info per decidere se mostrare disclaimer
      hasAnsweredBefore: limitationsCheck.hasAnsweredBefore ?? false, // True se ha già risposto prima (ha_limitazioni !== null E limitazioni_compilato_at !== null)
    };
  } catch (error) {
    console.error('❌ Errore generazione piano:', error);
    return {
      success: false,
      message: 'Errore nella generazione del piano. Riprova più tardi!',
      remaining: limit.remaining,
    };
  }
};

/**
 * Genera un piano nutrizionale strutturato via PrimeBot.
 * Usa lo stesso checkMonthlyLimit di getStructuredWorkoutPlan.
 */
export async function getStructuredNutritionPlan(
  request: string,
  userId: string,
  allergie: string[],
  userContext?: string,
  sessionId?: string,
  durationDays: number = 7
): Promise<{
  plan?: StructuredNutritionPlan;
  planId?: string;
  message: string;
  limitReached?: boolean;
}> {
  const limitCheck = await checkMonthlyLimit(userId);
  if (!limitCheck.canUse) {
    return {
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo!`,
      limitReached: true,
    };
  }

  const allergieSection = allergie.length > 0
    ? `ALLERGIE E INTOLLERANZE DA ESCLUDERE TASSATIVAMENTE:\n${allergie.map(a => `- ${a}`).join('\n')}\nNon includere MAI alimenti che contengono questi ingredienti.`
    : 'Nessuna allergia o intolleranza segnalata.';

  const contextSection = userContext ? `\nCONTESTO UTENTE:\n${userContext}` : '';

  const nutritionSystemPrompt = `Sei PrimeBot, esperto nutrizionista AI di Performance Prime.
L'utente ha richiesto un piano alimentare personalizzato.

${allergieSection}
${contextSection}

ISTRUZIONI:
- Crea un piano nutrizionale da ${durationDays} giorni. L'array "giorni" nel JSON deve contenere esattamente ${durationDays} elementi (Giorno 1, Giorno 2, ...).
- Mantieni ogni giorno CONCISO: massimo 4 pasti per giorno, massimo 4 alimenti per pasto.
- Non aggiungere testo extra fuori dal JSON.
- Ogni giorno può avere: Colazione, Spuntino (opzionale), Pranzo, Cena.
- Indica quantità precise in grammi per ogni alimento.
- Calcola le calorie totali giornaliere approssimative.
- Adatta il piano all'obiettivo dell'utente (dimagrimento / massa muscolare / mantenimento / performance).
- Il piano deve essere realistico, vario e bilanciato.
- Includi almeno 3 consigli generali sulla nutrizione.

IMPORTANTE — SICUREZZA:
- Aggiungi sempre una nota finale che raccomanda di consultare un nutrizionista o dietologo certificato per un piano personalizzato e monitorato.
- Non prescrivere integratori o farmaci.
- Se l'utente ha patologie (diabete, ipertensione, ecc.), raccomanda il medico prima di tutto.

FORMATO RISPOSTA — rispondi SOLO con JSON valido, nessun testo prima o dopo:
{
  "nome": "Piano Alimentare Settimanale",
  "descrizione": "...",
  "obiettivo": "...",
  "calorie_giornaliere": 2000,
  "macronutrienti": {
    "proteine_percentuale": 30,
    "carboidrati_percentuale": 45,
    "grassi_percentuale": 25
  },
  "allergie_considerate": ["..."],
  "giorni": [
    {
      "giorno": "Lunedì",
      "pasti": [
        {
          "nome": "Colazione",
          "orario": "07:30",
          "alimenti": [
            {
              "nome": "Fiocchi d'avena",
              "quantita": "80g",
              "calorie": 300,
              "note": "con acqua o latte vegetale"
            }
          ],
          "calorie_totali": 450,
          "note": "..."
        }
      ],
      "calorie_totali": 2000,
      "note": "..."
    }
  ],
  "consigli_generali": ["...", "...", "..."],
  "note_finali": "Consulta un nutrizionista..."
}`;

  const maxTokens = durationDays <= 3 ? 4000
    : durationDays <= 7 ? 6000
    : durationDays <= 14 ? 10000
    : 16000;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: nutritionSystemPrompt },
          { role: 'user', content: request },
        ],
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIApiResponse;
    if (!('choices' in data) || !data.choices?.length || !data.choices[0]) {
      throw new Error('Risposta API non valida');
    }
    const successData = data as OpenAIResponse;
    const rawText = successData.choices?.[0]?.message?.content ?? '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        message: 'Non sono riuscito a generare il piano. Riprova con una richiesta più specifica.',
      };
    }

    const plan = JSON.parse(jsonMatch[0]) as StructuredNutritionPlan;

    const { data: insertData, error: insertError } = await supabase
      .from('nutrition_plans')
      .insert({
        user_id: userId,
        name: plan.nome,
        description: plan.descrizione ?? null,
        goal: plan.obiettivo ?? null,
        calorie_giornaliere: plan.calorie_giornaliere ?? null,
        allergie_considerate: plan.allergie_considerate ?? [],
        contenuto: plan as unknown as Json,
        note: plan.note_finali ?? null,
      })
      .select('id')
      .single();

    if (insertError || !insertData?.id) {
      console.error('getStructuredNutritionPlan insert error:', insertError);
      return {
        plan,
        planId: undefined,
        message: 'Ho creato il tuo piano alimentare! 🥗\n\n⚠️ Il piano è stato generato ma non salvato. Rigeneralo per salvarlo.',
      };
    }
    const savedPlanId = insertData.id as string;

    const cost = calculateCost(
      successData.usage?.prompt_tokens || 0,
      successData.usage?.completion_tokens || 0
    );
    await supabase.from('openai_usage_logs').insert({
      user_id: userId,
      tokens_prompt: successData.usage?.prompt_tokens || 0,
      tokens_completion: successData.usage?.completion_tokens || 0,
      tokens_total: successData.usage?.total_tokens || 0,
      cost_usd: cost,
      model: 'gpt-4o-mini',
      message: request.substring(0, 500),
      response: rawText.substring(0, 500),
    });

    return {
      plan,
      planId: savedPlanId,
      message: 'Ho creato il tuo piano alimentare! 🥗',
    };
  } catch (error) {
    console.error('getStructuredNutritionPlan error:', error);
    return {
      message: 'Errore nella generazione del piano alimentare. Riprova tra qualche istante.',
    };
  }
}
