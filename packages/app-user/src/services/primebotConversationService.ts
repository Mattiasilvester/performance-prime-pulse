import { supabase } from '@pp/shared';

/**
 * Interfaccia per i dati di interazione PrimeBot
 */
export interface PrimeBotInteraction {
  id?: string;
  user_id: string;
  session_id: string;
  message_content: string;
  bot_response: string;
  interaction_type: 'text' | 'choice' | 'system';
  user_context?: {
    page?: string;
    previous_intent?: string;
    [key: string]: unknown;
  };
  bot_intent?: string;
  timestamp?: string;
}

/**
 * Messaggio formattato per OpenAI
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/**
 * Chiave localStorage per session ID
 */
const SESSION_ID_KEY = 'primebot_session_id';
const SESSION_TIMESTAMP_KEY = 'primebot_session_timestamp';

/**
 * Timeout sessione: 30 minuti (in millisecondi)
 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuti

/**
 * Genera un nuovo Session ID (UUID)
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Recupera o crea un Session ID per l'utente
 * Crea una nuova sessione se l'ultima interazione è più vecchia di 30 minuti
 */
export async function getOrCreateSessionId(userId: string): Promise<string> {
  try {
    // Controlla se esiste una sessione valida nel localStorage
    const storedSessionId = localStorage.getItem(`${SESSION_ID_KEY}_${userId}`);
    const storedTimestamp = localStorage.getItem(`${SESSION_TIMESTAMP_KEY}_${userId}`);

    if (storedSessionId && storedTimestamp) {
      const lastInteractionTime = parseInt(storedTimestamp, 10);
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime;

      // Se la sessione è ancora valida (< 30 minuti), riutilizzala
      if (timeSinceLastInteraction < SESSION_TIMEOUT_MS) {
        // Aggiorna il timestamp
        localStorage.setItem(`${SESSION_TIMESTAMP_KEY}_${userId}`, now.toString());
        return storedSessionId;
      }
    }

    // Crea una nuova sessione
    const newSessionId = generateSessionId();
    const now = Date.now();
    
    localStorage.setItem(`${SESSION_ID_KEY}_${userId}`, newSessionId);
    localStorage.setItem(`${SESSION_TIMESTAMP_KEY}_${userId}`, now.toString());

    return newSessionId;
  } catch (error) {
    console.error('Errore nel recupero/creazione session ID:', error);
    // Fallback: genera sempre nuovo session ID se localStorage fallisce
    return generateSessionId();
  }
}

/**
 * Salva un'interazione su primebot_interactions
 */
export async function saveInteraction(data: PrimeBotInteraction): Promise<void> {
  try {
    const { error } = await supabase
      .from('primebot_interactions')
      .insert({
        user_id: data.user_id,
        session_id: data.session_id,
        message_content: data.message_content,
        bot_response: data.bot_response,
        interaction_type: data.interaction_type,
        user_context: data.user_context || null,
        bot_intent: data.bot_intent || null,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Errore salvataggio interazione PrimeBot:', error);
      // Non lanciare errore - la chat deve continuare anche se il salvataggio fallisce
      return;
    }

    // Aggiorna timestamp sessione nel localStorage
    try {
      localStorage.setItem(`${SESSION_TIMESTAMP_KEY}_${data.user_id}`, Date.now().toString());
    } catch (e) {
      // Ignora errori localStorage
    }

    // Chiama la funzione database per incrementare il contatore messaggi
    try {
      const { error: functionError } = await supabase.rpc('increment_message_count', {
        user_uuid: data.user_id,
      });

      if (functionError) {
        console.warn('Errore incremento contatore messaggi:', functionError);
        // Non bloccare il flusso se la funzione fallisce
      }
    } catch (e) {
      console.warn('Errore chiamata increment_message_count:', e);
      // Non bloccare il flusso
    }
  } catch (error) {
    console.error('Errore completo salvataggio interazione:', error);
    // Non lanciare errore - la chat deve continuare
  }
}

/**
 * Recupera la cronologia conversazione per un utente
 * @param userId - ID utente
 * @param limit - Numero massimo di messaggi da recuperare (default: 10)
 * @returns Array di messaggi ordinati dal più vecchio al più recente
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    // Recupera gli ultimi N messaggi per l'utente
    const { data, error } = await supabase
      .from('primebot_interactions')
      .select('message_content, bot_response, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Errore recupero cronologia conversazione:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Converti in formato ConversationMessage
    // Invertiamo l'ordine per avere dal più vecchio al più recente
    const messages: ConversationMessage[] = [];
    
    for (let i = data.length - 1; i >= 0; i--) {
      const interaction = data[i];
      
      // Aggiungi messaggio utente
      messages.push({
        role: 'user',
        content: interaction.message_content,
        timestamp: interaction.timestamp || undefined,
      });

      // Aggiungi risposta bot
      messages.push({
        role: 'assistant',
        content: interaction.bot_response,
        timestamp: interaction.timestamp || undefined,
      });
    }

    return messages;
  } catch (error) {
    console.error('Errore completo recupero cronologia:', error);
    return [];
  }
}

/**
 * Formatta la cronologia conversazione per OpenAI API
 * @param history - Array di messaggi della conversazione
 * @returns Array formattato per OpenAI (senza timestamp)
 */
export function formatHistoryForOpenAI(
  history: ConversationMessage[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Recupera la cronologia conversazione per una sessione specifica
 * Utile per mantenere il context solo della sessione corrente
 */
export async function getSessionHistory(
  userId: string,
  sessionId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from('primebot_interactions')
      .select('message_content, bot_response, timestamp')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Errore recupero cronologia sessione:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Converti in formato ConversationMessage (dal più vecchio al più recente)
    const messages: ConversationMessage[] = [];
    
    for (let i = data.length - 1; i >= 0; i--) {
      const interaction = data[i];
      
      messages.push({
        role: 'user',
        content: interaction.message_content,
        timestamp: interaction.timestamp || undefined,
      });

      messages.push({
        role: 'assistant',
        content: interaction.bot_response,
        timestamp: interaction.timestamp || undefined,
      });
    }

    return messages;
  } catch (error) {
    console.error('Errore completo recupero cronologia sessione:', error);
    return [];
  }
}

/**
 * Resetta la sessione corrente (crea nuova sessione)
 */
export function resetSession(userId: string): void {
  try {
    localStorage.removeItem(`${SESSION_ID_KEY}_${userId}`);
    localStorage.removeItem(`${SESSION_TIMESTAMP_KEY}_${userId}`);
  } catch (error) {
    console.error('Errore reset sessione:', error);
  }
}

