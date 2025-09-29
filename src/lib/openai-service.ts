import { supabase } from '@/integrations/supabase/client';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
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
export const getAIResponse = async (message: string, userId: string) => {
  console.log('🤖 getAIResponse chiamata con:', { message: message.substring(0, 50) + '...', userId: userId.substring(0, 8) + '...' });
  
  const limit = await checkMonthlyLimit(userId);
  
  if (!limit.canUse) {
    return {
      success: false,
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo o usa i suggerimenti rapidi!`,
      remaining: 0
    };
  }

  console.log('🔑 OpenAI API Key presente:', !!OPENAI_API_KEY);
  console.log('🔑 API Key inizia con sk-:', OPENAI_API_KEY?.startsWith('sk-'));
  console.log('🔑 Primi 10 caratteri:', OPENAI_API_KEY?.substring(0, 10));
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key mancante');
    return {
      success: false,
      message: 'Servizio AI temporaneamente non disponibile.',
      remaining: limit.remaining
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Sei PrimeBot, l'assistente AI esperto di Performance Prime (NON "Performance Prime Pulse", solo "Performance Prime").

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

  Ricorda: la costanza in Performance Prime è la chiave del successo! 🚀`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
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
    
    return {
      success: true,
      message: data.choices[0].message.content,
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
