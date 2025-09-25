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
  const limit = await checkMonthlyLimit(userId);
  
  if (!limit.canUse) {
    return {
      success: false,
      message: `Hai raggiunto il limite di ${MONTHLY_LIMIT} domande AI questo mese. Riprova il mese prossimo o usa i suggerimenti rapidi!`,
      remaining: 0
    };
  }

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key mancante');
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
            content: `Sei PrimeBot, un coach fitness esperto e motivatore per l'app Performance Prime Pulse. 
            Rispondi in italiano, in modo conciso (max 150 parole), amichevole e motivante. 
            Offri consigli pratici su allenamento, nutrizione e motivazione. 
            Se l'utente chiede di creare allenamenti, suggerisci di usare la sezione Workouts dell'app.
            Non dare consigli medici specifici, suggerisci di consultare un professionista per problemi di salute.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
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
    console.error('Errore OpenAI:', error);
    return {
      success: false,
      message: 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco!',
      remaining: limit.remaining
    };
  }
};
