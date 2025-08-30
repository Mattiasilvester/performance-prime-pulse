// Voiceflow API Service
// Integrazione con Voiceflow per PrimeBot

export interface VoiceflowMessage {
  type: 'text' | 'choice' | 'carousel';
  payload: {
    message?: string;
    buttons?: Array<{
      name: string;
      request: {
        type: string;
        payload: any;
      };
    }>;
  };
}

export interface ChatSession {
  sessionID: string;
  userID: string;
  context: Record<string, any>;
}

export interface UserContext {
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

const VOICEFLOW_CONFIG = {
  API_KEY: 'VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT',
  PROJECT_ID: '6894f932492efb4bf2460ab0',
  VERSION_ID: '64dbb6696a8fab0013dba194',
  BASE_URL: 'https://general-runtime.voiceflow.com'
};

class VoiceflowAPI {
  private baseURL: string;
  private apiKey: string;
  private projectId: string;
  private versionId: string;

  constructor() {
    this.baseURL = VOICEFLOW_CONFIG.BASE_URL;
    this.apiKey = VOICEFLOW_CONFIG.API_KEY;
    this.projectId = VOICEFLOW_CONFIG.PROJECT_ID;
    this.versionId = VOICEFLOW_CONFIG.VERSION_ID;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Voiceflow API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Voiceflow API request failed:', error);
      throw error;
    }
  }

  /**
   * Inizializza una nuova sessione chat con Voiceflow
   */
  async initializeSession(userID: string, userContext?: UserContext): Promise<ChatSession> {
    try {
      const sessionID = `session_${userID}_${Date.now()}`;
      
      // Inizializza la sessione con il contesto utente
      const initBody = {
        action: {
          type: 'launch',
          payload: {}
        },
        config: {
          tts: false,
          stripSSML: true,
          stopAll: true,
          excludeTypes: ['block', 'debug', 'flow']
        }
      };

      // Aggiungi contesto utente se disponibile
      if (userContext) {
        initBody.config = {
          ...initBody.config,
          user: {
            id: userID,
            name: userContext.name,
            data: {
              fitness_level: userContext.fitness_level,
              goals: userContext.goals,
              has_trainer: userContext.has_trainer,
              subscription_status: userContext.subscription_status,
              preferences: userContext.preferences
            }
          }
        };
      }

      const response = await this.makeRequest(
        `/state/${this.projectId}/${this.versionId}/${sessionID}/interact`,
        'POST',
        initBody
      );

      return {
        sessionID,
        userID,
        context: response.context || {}
      };
    } catch (error) {
      console.error('Failed to initialize Voiceflow session:', error);
      throw error;
    }
  }

  /**
   * Invia un messaggio testuale a Voiceflow
   */
  async sendMessage(sessionID: string, message: string): Promise<VoiceflowMessage[]> {
    try {
      const response = await this.makeRequest(
        `/state/${this.projectId}/${this.versionId}/${sessionID}/interact`,
        'POST',
        {
          action: {
            type: 'text',
            payload: message
          },
          config: {
            tts: false,
            stripSSML: true,
            stopAll: true,
            excludeTypes: ['block', 'debug', 'flow']
          }
        }
      );

      return this.parseVoiceflowResponse(response);
    } catch (error) {
      console.error('Failed to send message to Voiceflow:', error);
      throw error;
    }
  }

  /**
   * Invia una scelta/selezione a Voiceflow
   */
  async sendChoice(sessionID: string, choice: any): Promise<VoiceflowMessage[]> {
    try {
      const response = await this.makeRequest(
        `/state/${this.projectId}/${this.versionId}/${sessionID}/interact`,
        'POST',
        {
          action: {
            type: 'choice',
            payload: choice
          },
          config: {
            tts: false,
            stripSSML: true,
            stopAll: true,
            excludeTypes: ['block', 'debug', 'flow']
          }
        }
      );

      return this.parseVoiceflowResponse(response);
    } catch (error) {
      console.error('Failed to send choice to Voiceflow:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il contesto utente in Voiceflow
   */
  async updateUserContext(sessionID: string, context: any): Promise<void> {
    try {
      await this.makeRequest(
        `/state/${this.projectId}/${this.versionId}/${sessionID}/variables`,
        'PATCH',
        context
      );
    } catch (error) {
      console.error('Failed to update user context in Voiceflow:', error);
      throw error;
    }
  }

  /**
   * Ottiene lo stato corrente della sessione
   */
  async getSessionState(sessionID: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        `/state/${this.projectId}/${this.versionId}/${sessionID}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get session state from Voiceflow:', error);
      throw error;
    }
  }

  /**
   * Parsing della risposta Voiceflow in messaggi utilizzabili
   */
  private parseVoiceflowResponse(response: any): VoiceflowMessage[] {
    const messages: VoiceflowMessage[] = [];

    if (response.reply && Array.isArray(response.reply)) {
      response.reply.forEach((item: any) => {
        if (item.type === 'text' && item.payload?.message) {
          messages.push({
            type: 'text',
            payload: {
              message: item.payload.message
            }
          });
        } else if (item.type === 'choice' && item.payload?.buttons) {
          messages.push({
            type: 'choice',
            payload: {
              buttons: item.payload.buttons
            }
          });
        } else if (item.type === 'carousel' && item.payload?.items) {
          messages.push({
            type: 'carousel',
            payload: {
              message: item.payload.message,
              buttons: item.payload.items
            }
          });
        }
      });
    }

    return messages;
  }

  /**
   * Verifica la connessione con Voiceflow
   */
  async testConnection(): Promise<boolean> {
    try {
      const testSessionID = `test_${Date.now()}`;
      await this.initializeSession(testSessionID);
      return true;
    } catch (error) {
      console.error('Voiceflow connection test failed:', error);
      return false;
    }
  }
}

// Esporta un'istanza singleton
export const voiceflowAPI = new VoiceflowAPI();
export default voiceflowAPI;
