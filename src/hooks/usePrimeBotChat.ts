// PrimeBot Chat State Management Hook
// Gestione stato chat con integrazione Voiceflow

import { useState, useCallback, useEffect, useRef } from 'react';
import { voiceflowAPI, VoiceflowMessage, ChatSession } from '@/lib/voiceflow-api';
import { primebotFallback, FallbackMessage, FallbackSession } from '@/lib/primebot-fallback';
import { 
  getUserContextForBot, 
  logChatInteraction, 
  incrementMessageCount,
  getUserStats 
} from '@/lib/primebot-supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: Array<{
    id: string;
    text: string;
    action: any;
  }>;
  type: 'text' | 'choice' | 'system';
  isTyping?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionID: string | null;
  isTyping: boolean;
  error: string | null;
  isInitialized: boolean;
  userStats: {
    total_messages: number;
    favorite_topics: string[];
    last_interaction?: Date;
    onboarding_completed: boolean;
  };
}

export const usePrimeBotChat = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionID: null,
    isTyping: false,
    error: null,
    isInitialized: false,
    userStats: {
      total_messages: 0,
      favorite_topics: [],
      onboarding_completed: false
    }
  });

  const [useFallback, setUseFallback] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<ChatSession | null>(null);

  /**
   * Inizializza la chat con il contesto utente
   */
  const initializeChat = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'Utente non autenticato' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Ottieni contesto utente
      const userContext = await getUserContextForBot(user.id);
      
      // Ottieni statistiche utente
      const userStats = await getUserStats(user.id);

      // Prova prima Voiceflow, se fallisce usa il fallback
      let session: ChatSession | FallbackSession;
      try {
        session = await voiceflowAPI.initializeSession(user.id, userContext);
        setUseFallback(false);
      } catch (voiceflowError) {
        console.warn('Voiceflow failed, using fallback:', voiceflowError);
        session = await primebotFallback.initializeSession(user.id, userContext);
        setUseFallback(true);
      }
      
      sessionRef.current = session;

      // Messaggio di benvenuto
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        content: `Ciao ${userContext?.name || 'Utente'}! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setState(prev => ({
        ...prev,
        messages: [welcomeMessage],
        sessionID: session.sessionID,
        isLoading: false,
        isInitialized: true,
        userStats
      }));

    } catch (error) {
      console.error('Error initializing chat:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Errore nell\'inizializzazione della chat'
      }));
    }
  }, [user?.id]);

  /**
   * Invia un messaggio utente
   */
  const sendUserMessage = useCallback(async (message: string) => {
    if (!state.sessionID || !user?.id) {
      setState(prev => ({ ...prev, error: 'Sessione non inizializzata' }));
      return;
    }

    // Aggiungi messaggio utente
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null
    }));

    try {
      // Invia messaggio usando Voiceflow o fallback
      let botResponses: VoiceflowMessage[] | FallbackMessage[];
      if (useFallback) {
        botResponses = await primebotFallback.sendMessage(state.sessionID, message);
      } else {
        botResponses = await voiceflowAPI.sendMessage(state.sessionID, message);
      }
      
      // Incrementa contatore messaggi
      await incrementMessageCount(user.id);

      // Processa risposte bot
      const botMessages: ChatMessage[] = botResponses.map((response, index) => {
        const messageId = `bot_${Date.now()}_${index}`;
        
        if (response.type === 'text' && response.payload.message) {
          return {
            id: messageId,
            content: response.payload.message,
            sender: 'bot',
            timestamp: new Date(),
            type: 'text'
          };
        } else if (response.type === 'choice' && response.payload.buttons) {
          return {
            id: messageId,
            content: 'Scegli un\'opzione:',
            sender: 'bot',
            timestamp: new Date(),
            type: 'choice',
            buttons: response.payload.buttons.map((button, btnIndex) => ({
              id: `${messageId}_btn_${btnIndex}`,
              text: button.name,
              action: useFallback ? button.action : button.request
            }))
          };
        }
        
        return {
          id: messageId,
          content: 'Risposta non riconosciuta',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
      });

      // Registra interazione
      await logChatInteraction({
        user_id: user.id,
        session_id: state.sessionID,
        message_content: message,
        bot_response: botMessages.map(m => m.content).join(' '),
        interaction_type: 'text'
      });

      // Simula typing delay
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, ...botMessages],
          isTyping: false
        }));
      }, 1000 + (botMessages.length * 500)); // Delay basato su numero messaggi

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Mi dispiace, c\'è stato un errore. Riprova tra un momento.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        error: 'Errore nell\'invio del messaggio'
      }));
    }
  }, [state.sessionID, user?.id]);

  /**
   * Seleziona una scelta/opzione
   */
  const selectChoice = useCallback(async (choice: any) => {
    if (!state.sessionID || !user?.id) {
      setState(prev => ({ ...prev, error: 'Sessione non inizializzata' }));
      return;
    }

    setState(prev => ({ ...prev, isTyping: true, error: null }));

    try {
      // Invia scelta usando Voiceflow o fallback
      let botResponses: VoiceflowMessage[] | FallbackMessage[];
      if (useFallback) {
        botResponses = await primebotFallback.sendChoice(state.sessionID, choice);
      } else {
        botResponses = await voiceflowAPI.sendChoice(state.sessionID, choice);
      }
      
      // Incrementa contatore messaggi
      await incrementMessageCount(user.id);

      // Processa risposte bot
      const botMessages: ChatMessage[] = botResponses.map((response, index) => {
        const messageId = `bot_choice_${Date.now()}_${index}`;
        
        if (response.type === 'text' && response.payload.message) {
          return {
            id: messageId,
            content: response.payload.message,
            sender: 'bot',
            timestamp: new Date(),
            type: 'text'
          };
        }
        
        return {
          id: messageId,
          content: 'Risposta non riconosciuta',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
      });

      // Registra interazione
      await logChatInteraction({
        user_id: user.id,
        session_id: state.sessionID,
        message_content: `Scelta: ${JSON.stringify(choice)}`,
        bot_response: botMessages.map(m => m.content).join(' '),
        interaction_type: 'choice'
      });

      // Simula typing delay
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, ...botMessages],
          isTyping: false
        }));
      }, 1000 + (botMessages.length * 500));

    } catch (error) {
      console.error('Error selecting choice:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_choice_${Date.now()}`,
        content: 'Mi dispiace, c\'è stato un errore. Riprova tra un momento.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        error: 'Errore nella selezione'
      }));
    }
  }, [state.sessionID, user?.id]);

  /**
   * Pulisce la chat
   */
  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null
    }));
  }, []);

  /**
   * Aggiorna i dati utente
   */
  const updateUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userStats = await getUserStats(user.id);
      setState(prev => ({
        ...prev,
        userStats
      }));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }, [user?.id]);

  /**
   * Testa la connessione Voiceflow o fallback
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const voiceflowConnected = await voiceflowAPI.testConnection();
      if (voiceflowConnected) {
        setUseFallback(false);
        return true;
      } else {
        setUseFallback(true);
        return true; // Fallback sempre disponibile
      }
    } catch (error) {
      console.error('Voiceflow connection test failed, using fallback:', error);
      setUseFallback(true);
      return true; // Fallback sempre disponibile
    }
  }, []);

  // Cleanup timeout al dismount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Inizializza chat quando l'utente è disponibile
  useEffect(() => {
    if (user?.id && !state.isInitialized && !state.isLoading) {
      initializeChat();
    }
  }, [user?.id, state.isInitialized, state.isLoading, initializeChat]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isTyping: state.isTyping,
    error: state.error,
    isInitialized: state.isInitialized,
    userStats: state.userStats,
    
    // Actions
    sendUserMessage,
    selectChoice,
    clearChat,
    updateUserData,
    initializeChat,
    testConnection
  };
};
