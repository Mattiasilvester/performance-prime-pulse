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
} from '@/services/primebotUserContextService';

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

  Ricorda: la costanza in Performance Prime è la chiave del successo! 🚀`;

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
