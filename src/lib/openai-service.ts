import { supabase } from '@/integrations/supabase/client';
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

// ⚠️ DEPRECATO: Non usare più VITE_OPENAI_API_KEY direttamente
// Usare /api/ai-chat endpoint invece
const MONTHLY_LIMIT = 10;

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
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo o usa i suggerimenti rapidi!`,
      remaining: 0
    };
  }

  try {
    // Recupera il contesto utente per personalizzare le risposte
    let userContextString = '';
    try {
      const userContext = await getUserContext(userId);
      userContextString = formatUserContextForPrompt(userContext);
      console.log('👤 Contesto utente recuperato:', {
        nome: userContext.nome,
        obiettivi: userContext.obiettivi,
        livello: userContext.livello_fitness_it,
      });
      
      // Aggiorna primebot_preferences con i dati recuperati
      await updatePrimeBotPreferences(userId, userContext);
    } catch (contextError) {
      console.warn('⚠️ Errore recupero contesto utente (continuo senza personalizzazione):', contextError);
      // Continua senza contesto se il recupero fallisce
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
    // Costruisci system prompt base
    let systemPrompt = `Sei PrimeBot, l'assistente AI esperto di Performance Prime (NON "Performance Prime Pulse", solo "Performance Prime").

  REGOLE FONDAMENTALI:
  1. Rispondi SEMPRE in italiano
  2. Usa formattazione markdown per strutturare le risposte
  3. Includi emoji appropriate 💪🏋️‍♂️🔥
  4. Fornisci risposte DETTAGLIATE e SPECIFICHE, mai generiche
  5. Il nome dell'app è "Performance Prime" (MAI aggiungere "Pulse")

  STRUTTURA DELLE RISPOSTE:
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
  Vuoi che ti crei un piano che eviti stress sulle ginocchia? 🏋️"`;

    // Aggiungi contesto utente al system prompt se disponibile
    if (userContextString) {
      systemPrompt += `\n\nCONTESTO UTENTE:\n${userContextString}\n\nIMPORTANTE: Personalizza le tue risposte in base ai dati dell'utente sopra. Usa il suo nome quando appropriato e adatta consigli/allenamenti al suo livello, obiettivi e attrezzatura disponibile.`;
    }

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
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-3.5-turbo'
      })
    });

    const data = await response.json();
    console.log('📡 Risposta OpenAI ricevuta:', response.status, response.statusText);
    console.log('📡 Dati risposta:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Errore HTTP OpenAI:', response.status, response.statusText);
      console.error('❌ Dettagli errore:', data);
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }
    
    if (!data.choices || !data.choices[0]) {
      console.error('❌ Risposta OpenAI non valida:', data);
      throw new Error('Risposta OpenAI non valida');
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
      model: 'gpt-3.5-turbo',
      message: message.substring(0, 500),
      response: data.choices[0].message.content.substring(0, 500)
    });

    console.log(`[AI] User: ${userId.substring(0,8)}... | Uso: ${limit.used + 1}/${MONTHLY_LIMIT} | Costo: $${cost.toFixed(5)}`);
    
    const botResponse = data.choices[0].message.content;

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
  type?: 'plan' | 'question';
  question?: string;
  awaitingLimitationsResponse?: boolean;
  hasExistingLimitations?: boolean; // Info per decidere se mostrare disclaimer
}> => {
  console.log('🏋️ getStructuredWorkoutPlan chiamata con:', {
    request: request.substring(0, 50) + '...',
    userId: userId.substring(0, 8) + '...',
  });

  const limit = await checkMonthlyLimit(userId);

  if (!limit.canUse) {
    return {
      success: false,
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo!`,
      remaining: 0,
    };
  }

  try {
    // PRIMA: Controllo intelligente limitazioni
    const { getSmartLimitationsCheck } = await import('@/services/primebotUserContextService');
    const limitationsCheck = await getSmartLimitationsCheck(userId);
    
    // SE needsToAsk === true, ritorna domanda invece di generare piano
    if (limitationsCheck.needsToAsk && limitationsCheck.suggestedQuestion) {
      return {
        success: false,
        type: 'question',
        question: limitationsCheck.suggestedQuestion,
        awaitingLimitationsResponse: true,
        remaining: limit.remaining,
      };
    }
    
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

    // Costruisci sezione limitazioni per System Prompt
    let limitationsSection = '';
    if (limitationsCheck.hasExistingLimitations && limitationsCheck.limitations) {
      const zonesStr = limitationsCheck.zones && limitationsCheck.zones.length > 0
        ? limitationsCheck.zones.join(', ')
        : 'nessuna zona specifica indicata';
      
      const medicalStr = limitationsCheck.medicalConditions
        ? `\nCondizioni mediche: ${limitationsCheck.medicalConditions}`
        : '';
      
      limitationsSection = `
⚠️ LIMITAZIONI FISICHE DELL'UTENTE:
L'utente ha indicato: "${limitationsCheck.limitations}"
Zone del corpo da EVITARE o trattare con cautela: ${zonesStr}${medicalStr}

REGOLE OBBLIGATORIE:
1. NON includere esercizi che coinvolgono pesantemente le zone indicate
2. Proponi ALTERNATIVE sicure per ogni zona problematica
3. Nella risposta, MENZIONA che hai tenuto conto delle sue limitazioni
4. Suggerisci di consultare un professionista se il problema persiste

Esempio: Se ha problemi alla schiena, evita stacchi, squat pesante. Proponi ponte glutei, leg press, esercizi da seduto.
`;
    } else {
      limitationsSection = `
L'utente non ha indicato limitazioni fisiche. Puoi proporre qualsiasi esercizio appropriato al suo livello.
`;
    }

    // System Prompt SPECIFICO per piani strutturati con VARIAZIONE OBBLIGATORIA
    const workoutPlanSystemPrompt = `Sei PrimeBot, esperto di Performance Prime. L'utente ha richiesto un piano di allenamento.

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
{
  "name": "Piano Forza - Petto e Tricipiti",
  "description": "Piano personalizzato per aumentare forza nella parte superiore",
  "workout_type": "forza",
  "duration_minutes": 45,
  "difficulty": "intermediate",
  "exercises": [
    {
      "name": "Panca Piana con Bilanciere",
      "sets": 4,
      "reps": "6-8",
      "rest_seconds": 90,
      "notes": "Mantieni la schiena aderente alla panca",
      "exercise_type": "compound"
    },
    {
      "name": "Rematore con Manubrio",
      "sets": 4,
      "reps": "8-10",
      "rest_seconds": 75,
      "notes": "Movimento controllato",
      "exercise_type": "compound_secondary"
    },
    {
      "name": "Croci con Manubri",
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 60,
      "notes": "Movimento controllato, non bloccare i gomiti",
      "exercise_type": "isolation"
    },
    {
      "name": "Tricipiti Pushdown",
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 60,
      "notes": "Gomiti bloccati ai fianchi",
      "exercise_type": "isolation"
    },
    {
      "name": "Crunch",
      "sets": 3,
      "reps": "15-20",
      "rest_seconds": 45,
      "notes": "Movimento controllato",
      "exercise_type": "isolation_light"
    },
    {
      "name": "Plank",
      "sets": 3,
      "reps": "45 secondi",
      "rest_seconds": 45,
      "notes": "Mantieni posizione corretta",
      "exercise_type": "time_based"
    }
  ],
  "warmup": "5 min cardio leggero + 10 piegamenti leggeri + mobilità spalle",
  "cooldown": "Stretching pettorali 30sec per lato + stretching tricipiti"
}

⚠️ IMPORTANTE:
- Il piano DEVE avere MINIMO 5 esercizi, MASSIMO 10 esercizi
- DEVI variare serie/ripetizioni tra esercizi diversi
- NON creare piani dove tutti gli esercizi hanno "3x10" o "4x8" identici!
- Usa esercizi appropriati per il livello: ${planContext.difficulty}
- Rispetta attrezzatura disponibile: ${userContext.attrezzatura_disponibile.join(', ')}
- Durata totale: ${planContext.duration_minutes} minuti

Rispondi SOLO con il JSON del piano, senza testo aggiuntivo. Il JSON deve essere valido e parsabile.`;

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

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-3.5-turbo',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    if (!data.choices || !data.choices[0]) {
      throw new Error('Risposta OpenAI non valida');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('📥 Risposta AI ricevuta:', aiResponse.substring(0, 200) + '...');

    // Converti risposta AI in piano strutturato
    const plan = convertAIResponseToPlan(aiResponse);

    if (!plan) {
      return {
        success: false,
        message: 'Errore nella generazione del piano. Riprova!',
        remaining: limit.remaining,
      };
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
      model: 'gpt-3.5-turbo',
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
