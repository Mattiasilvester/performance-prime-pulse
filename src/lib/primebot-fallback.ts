// PrimeBot Fallback Service
// Servizio di fallback quando Voiceflow non è disponibile

export interface FallbackMessage {
  type: 'text' | 'choice';
  payload: {
    message?: string;
    buttons?: Array<{
      name: string;
      action: string;
    }>;
  };
}

export interface FallbackSession {
  sessionID: string;
  userID: string;
  context: Record<string, any>;
}

export interface FallbackUserContext {
  user_id: string;
  name: string;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  recent_workouts: any[];
  progress_metrics: {
    weight?: number;
    body_fat?: number;
    last_updated: string;
  };
  has_trainer: boolean;
  subscription_status: string;
  preferences: {
    workout_types: string[];
    reminder_frequency: string;
    communication_style: string;
  };
}

class PrimeBotFallback {
  private sessions: Map<string, any> = new Map();

  /**
   * Inizializza una sessione di fallback
   */
  async initializeSession(userID: string, userContext?: FallbackUserContext): Promise<FallbackSession> {
    const sessionID = `fallback_session_${userID}_${Date.now()}`;
    
    this.sessions.set(sessionID, {
      userID,
      context: userContext || {},
      messageCount: 0
    });

    return {
      sessionID,
      userID,
      context: userContext || {}
    };
  }

  /**
   * Invia un messaggio e ricevi una risposta di fallback
   */
  async sendMessage(sessionID: string, message: string): Promise<FallbackMessage[]> {
    const session = this.sessions.get(sessionID);
    if (!session) {
      throw new Error('Session not found');
    }

    session.messageCount++;
    const messageLower = message.toLowerCase();

    // Risposte intelligenti basate sul contenuto del messaggio
    let response: FallbackMessage;

    if (messageLower.includes('ciao') || messageLower.includes('salve') || messageLower.includes('hello')) {
      response = {
        type: 'text',
        payload: {
          message: `Ciao! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
        }
      };
    } else if (messageLower.includes('allenamento') || messageLower.includes('workout') || messageLower.includes('esercizio')) {
      response = {
        type: 'choice',
        payload: {
          message: 'Perfetto! Posso aiutarti con il tuo allenamento. Cosa preferisci?',
          buttons: [
            { name: 'Crea nuovo allenamento', action: 'create_workout' },
            { name: 'Mostra allenamenti recenti', action: 'show_recent' },
            { name: 'Consigli personalizzati', action: 'personal_advice' }
          ]
        }
      };
    } else if (messageLower.includes('progressi') || messageLower.includes('risultati') || messageLower.includes('statistiche')) {
      response = {
        type: 'text',
        payload: {
          message: 'Ottimo! Posso aiutarti a tracciare i tuoi progressi. Vuoi vedere le tue statistiche o impostare nuovi obiettivi?'
        }
      };
    } else if (messageLower.includes('nutrizione') || messageLower.includes('dieta') || messageLower.includes('alimentazione')) {
      response = {
        type: 'choice',
        payload: {
          message: 'La nutrizione è fondamentale! Cosa ti interessa?',
          buttons: [
            { name: 'Consigli nutrizionali', action: 'nutrition_tips' },
            { name: 'Piano alimentare', action: 'meal_plan' },
            { name: 'Calcolo calorie', action: 'calorie_calc' }
          ]
        }
      };
    } else if (messageLower.includes('obiettivi') || messageLower.includes('goal') || messageLower.includes('target')) {
      response = {
        type: 'text',
        payload: {
          message: 'Gli obiettivi sono la chiave del successo! Dimmi cosa vuoi raggiungere e ti aiuterò a creare un piano personalizzato.'
        }
      };
    } else if (messageLower.includes('motivazione') || messageLower.includes('motivare') || messageLower.includes('inspirazione')) {
      response = {
        type: 'text',
        payload: {
          message: '💪 Ricorda: ogni grande atleta è iniziato da dove sei tu ora. La costanza batte la perfezione ogni volta. Sei sulla strada giusta!'
        }
      };
    } else if (messageLower.includes('timer') || messageLower.includes('cronometro') || messageLower.includes('tempo')) {
      response = {
        type: 'choice',
        payload: {
          message: 'Perfetto per i tuoi allenamenti! Che tipo di timer ti serve?',
          buttons: [
            { name: 'Timer Tabata (20s/10s)', action: 'tabata_timer' },
            { name: 'Timer Circuito (45s/15s)', action: 'circuit_timer' },
            { name: 'Timer Personalizzato', action: 'custom_timer' }
          ]
        }
      };
    } else if (messageLower.includes('grazie') || messageLower.includes('thanks') || messageLower.includes('thank')) {
      response = {
        type: 'text',
        payload: {
          message: 'Prego! Sono qui per aiutarti a raggiungere i tuoi obiettivi. Continua così! 💪'
        }
      };
    } else {
      // Risposta generica per messaggi non riconosciuti
      const genericResponses = [
        'Interessante! Dimmi di più su quello che vuoi fare.',
        'Capisco! Come posso aiutarti a raggiungere questo obiettivo?',
        'Ottima domanda! Lascia che ti dia alcuni consigli personalizzati.',
        'Sono qui per supportarti! Cosa ti serve per il tuo allenamento?',
        'Perfetto! Posso aiutarti con allenamenti, nutrizione, progressi e molto altro.'
      ];
      
      const randomResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];
      
      response = {
        type: 'choice',
        payload: {
          message: randomResponse,
          buttons: [
            { name: 'Nuovo Allenamento', action: 'new_workout' },
            { name: 'I Miei Progressi', action: 'my_progress' },
            { name: 'Consigli Nutrizionali', action: 'nutrition_advice' },
            { name: 'Impostazioni', action: 'settings' }
          ]
        }
      };
    }

    return [response];
  }

  /**
   * Gestisce le scelte dell'utente
   */
  async sendChoice(sessionID: string, choice: any): Promise<FallbackMessage[]> {
    const session = this.sessions.get(sessionID);
    if (!session) {
      throw new Error('Session not found');
    }

    session.messageCount++;

    let response: FallbackMessage;

    switch (choice.action) {
      case 'create_workout':
        response = {
          type: 'text',
          payload: {
            message: 'Perfetto! Creiamo un allenamento personalizzato. Dimmi: che tipo di allenamento preferisci? (Cardio, Forza, Funzionale, Yoga)'
          }
        };
        break;

      case 'show_recent':
        response = {
          type: 'text',
          payload: {
            message: 'Ecco i tuoi allenamenti recenti! Continua così, la costanza è la chiave del successo. 💪'
          }
        };
        break;

      case 'personal_advice':
        response = {
          type: 'text',
          payload: {
            message: 'Basandomi sui tuoi dati, ti consiglio di: 1) Variare gli allenamenti, 2) Ascoltare il tuo corpo, 3) Mantenere la costanza. Vuoi un piano specifico?'
          }
        };
        break;

      case 'nutrition_tips':
        response = {
          type: 'text',
          payload: {
            message: '🍎 Consigli nutrizionali: 1) Proteine ad ogni pasto, 2) Carboidrati complessi, 3) Grassi buoni, 4) Idratazione costante. Vuoi un piano alimentare?'
          }
        };
        break;

      case 'meal_plan':
        response = {
          type: 'text',
          payload: {
            message: 'Creiamo un piano alimentare personalizzato! Dimmi: qual è il tuo obiettivo principale? (Perdita peso, Aumento massa, Mantenimento)'
          }
        };
        break;

      case 'tabata_timer':
        response = {
          type: 'text',
          payload: {
            message: '⏱️ Timer Tabata attivato! 20 secondi di lavoro intenso, 10 secondi di riposo. Pronto? Iniziamo!'
          }
        };
        break;

      case 'circuit_timer':
        response = {
          type: 'text',
          payload: {
            message: '⏱️ Timer Circuito attivato! 45 secondi di lavoro, 15 secondi di riposo. Perfetto per circuiti intensi!'
          }
        };
        break;

      default:
        response = {
          type: 'text',
          payload: {
            message: 'Ottima scelta! Come posso aiutarti ulteriormente con questo?'
          }
        };
    }

    return [response];
  }

  /**
   * Testa la connessione (sempre true per fallback)
   */
  async testConnection(): Promise<boolean> {
    return true; // Fallback sempre disponibile
  }

  /**
   * Aggiorna il contesto utente
   */
  async updateUserContext(sessionID: string, context: any): Promise<void> {
    const session = this.sessions.get(sessionID);
    if (session) {
      session.context = { ...session.context, ...context };
    }
  }

  /**
   * Ottiene lo stato della sessione
   */
  async getSessionState(sessionID: string): Promise<any> {
    return this.sessions.get(sessionID) || null;
  }
}

// Esporta un'istanza singleton
export const primebotFallback = new PrimeBotFallback();
export default primebotFallback;
