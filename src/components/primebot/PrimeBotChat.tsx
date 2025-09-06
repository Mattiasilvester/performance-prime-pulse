// PrimeBotChat Component
// Chat container principale per PrimeBot

import React, { useRef, useEffect, useState } from 'react';
import { usePrimeBotChat } from '@/hooks/usePrimeBotChat';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

interface PrimeBotChatProps {
  onClose?: () => void;
  isFullScreen?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: { id: string; text: string; action: string }[];
}

export const PrimeBotChat: React.FC<PrimeBotChatProps> = ({
  onClose,
  isFullScreen = false
}) => {
  const {
    messages: primeBotMessages,
    isLoading: primeBotIsLoading,
    isTyping,
    error,
    isInitialized,
    userStats,
    sendUserMessage,
    selectChoice,
    clearChat,
    initializeChat,
    testConnection
  } = usePrimeBotChat();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Ciao! Sono PrimeBot, il tuo AI Coach. Come posso aiutarti oggi?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Error handling
  const { handleError, handleNetworkError } = useErrorHandler({
    context: { component: 'PrimeBotChat' }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Test connection on mount
  useEffect(() => {
    const testConn = async () => {
      setConnectionStatus('testing');
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      setIsUsingFallback(!isConnected);
    };
    testConn();
  }, [testConnection]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Controlla se è un nuovo utente al mount
  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'guest';
        const userName = (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || 'Utente';
        
        const userOnboarded = localStorage.getItem(`user_onboarded_${userId}`);
        const isFirstVisit = !sessionStorage.getItem(`first_visit_${userId}`);
        
        if (!userOnboarded && isFirstVisit) {
          setIsNewUser(true);
          sessionStorage.setItem(`first_visit_${userId}`, 'true');
          
          // Messaggio di benvenuto automatico per nuovo utente
          const welcomeMessage: Message = {
            id: 'welcome',
                          text: `Ciao ${userName} 👋\n\nBenvenuto in Performance Prime! Sono il tuo PrimeBot personale e ti guiderò attraverso l'app.\n\n🎯 COSA PUOI FARE:\n• 📊 Dashboard - Monitora i tuoi progressi\n• 💪 Allenamenti - Crea e gestisci workout\n• 📅 Appuntamenti - Prenota sessioni\n• 🤖 PrimeBot - Chiedi consigli personalizzati\n• 👤 Profilo - Gestisci il tuo account\n\nVuoi che ti spieghi una sezione specifica o hai domande?`,
            sender: 'bot',
            timestamp: new Date(),
          };
          
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        handleError(error, { action: 'checkNewUser' });
      }
    };
    
    checkNewUser();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Marca utente come onboardato dopo la prima interazione
    if (isNewUser) {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest';
      localStorage.setItem(`user_onboarded_${userId}`, 'true');
      setIsNewUser(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate AI response
    timeoutRef.current = setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(text),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      timeoutRef.current = null;
    }, 1000);
  };

  const handleChoiceSelect = async (choice: any) => {
    await selectChoice(choice);
  };

  const handleRetryConnection = async () => {
    setConnectionStatus('testing');
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'error');
  };

  const handleClearChat = () => {
    clearChat();
  };

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

  // Funzione per generare risposte AI
  const generateAIResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('dashboard')) {
      return `📊 DASHBOARD - IL TUO CENTRO DI CONTROLLO

La Dashboard è il cuore della tua esperienza Performance Prime:

🎯 METRICHE PRINCIPALI:
• Progressi settimanali
• Allenamenti completati
• Obiettivi raggiunti
• Statistiche personali

⚡ AZIONI RAPIDE:
• Inizia Allenamento - Crea workout istantaneo
• Prenota Sessione - Con professionisti (Premium)
• Chat AI Coach - Consigli personalizzati

📈 VISUALIZZAZIONI:
• Grafici progressi
• Trend performance
• Confronti periodici

Vuoi che ti spieghi come personalizzare la dashboard o hai domande specifiche?`;
    }
    
    if (lowerText.includes('allenamento') || lowerText.includes('workout')) {
      return `💪 CREARE UN ALLENAMENTO - GUIDA COMPLETA

Ecco come creare il tuo primo allenamento:

📝 METODO 1: CREAZIONE MANUALE
1. Vai alla sezione "Allenamento"
2. Clicca "Crea Nuovo Workout"
3. Scegli categoria (Forza, Cardio, etc.)
4. Aggiungi esercizi uno per uno
5. Imposta serie, ripetizioni, riposo
6. Salva e inizia!

📄 METODO 2: CARICA SCHEDA
1. Clicca "Carica Scheda"
2. Seleziona file PDF/immagine
3. L'AI analizza automaticamente
4. Rivedi esercizi estratti
5. Modifica se necessario
6. Salva e inizia!

🎯 SUGGERIMENTI:
• Inizia con 3-4 esercizi
• Focalizzati su un gruppo muscolare
• Aumenta gradualmente intensità
• Traccia sempre i progressi

Vuoi che ti mostri come caricare una scheda esistente?`;
    }
    
    if (lowerText.includes('premium') || lowerText.includes('funzionalità')) {
      return `⭐ FUNZIONALITÀ PREMIUM - IL PROSSIMO LIVELLO

Ecco cosa ti aspettano con i piani premium:

🔒 FUNZIONI ATTUALMENTE BLOCCATE:
• Prenotazioni con professionisti
• Chat AI Coach avanzata
• Analisi performance dettagliate
• Piani personalizzati completi
• Albo delle medaglie
• Insights AI avanzati

💎 PIANI DISPONIBILI:
• BASIC - Funzioni essenziali (gratuito)
• ADVANCED - Analisi avanzate + AI Coach
• PRO - Tutto incluso + professionisti

🚀 VANTAGGI PREMIUM:
• Consigli personalizzati 24/7
• Piani allenamento su misura
• Supporto professionisti
• Analytics avanzati
• Contenuti esclusivi

Vuoi sapere di più sui piani o hai domande specifiche?`;
    }
    
    if (lowerText.includes('progressi') || lowerText.includes('tracciare')) {
      return `📈 TRACCIARE I PROGRESSI - SISTEMA COMPLETO

Ecco come monitorare i tuoi miglioramenti:

📊 METRICHE AUTOMATICHE:
• Peso sollevato per esercizio
• Numero di ripetizioni
• Tempo di allenamento
• Frequenza settimanale
• Progressi nel tempo

📝 COME TRACCIARE:
1. Durante l'allenamento - Registra serie/ripetizioni
2. Dopo l'allenamento - Aggiungi note personali
3. Settimanalmente - Rivedi grafici progressi
4. Mensilmente - Valuta obiettivi

📱 FUNZIONI TRACKING:
• Timer integrato per riposo
• Contatore serie/ripetizioni
• Note personali per ogni esercizio
• Foto progressi (opzionale)
• Confronti periodici

🎯 SUGGERIMENTI:
• Sii costante nel tracciare
• Fai foto mensili
• Misura circonferenze
• Registra come ti senti
• Celebra ogni miglioramento

Vuoi che ti mostri come impostare obiettivi specifici?`;
    }
    
    if (lowerText.includes('passi') || lowerText.includes('prossimi')) {
      return `🎯 PROSSIMI PASSI - PIANO D'AZIONE

Ecco il tuo piano per iniziare subito:

📅 OGGI:
1. Esplora la Dashboard
2. Crea il tuo primo allenamento
3. Imposta obiettivi personali
4. Familiarizza con l'interfaccia

📅 QUESTA SETTIMANA:
1. Completa 2-3 allenamenti
2. Traccia tutti i progressi
3. Esplora le funzionalità
4. Chiedi consigli all'AI Coach

📅 PROSSIME 2 SETTIMANE:
1. Stabilisci routine regolare
2. Valuta upgrade premium
3. Connetti con altri utenti
4. Pianifica obiettivi a lungo termine

💡 CONSIGLI INIZIALI:
• Inizia gradualmente
• Sii costante
• Ascolta il tuo corpo
• Usa l'AI Coach per consigli
• Celebra ogni progresso

🎯 OBIETTIVI RACCOMANDATI:
• 3 allenamenti a settimana
• Tracciamento costante
• Miglioramento graduale
• Mantenimento motivazione

Vuoi che ti aiuti a creare il tuo primo allenamento?`;
    }
    
    return `Grazie per la domanda! Sono qui per aiutarti con il tuo fitness.

🎯 POSSO SUPPORTARTI CON:
• Piani di allenamento personalizzati
• Consigli nutrizionali specifici  
• Strategie per obiettivi fitness
• Workout per oggi
• Tecniche di esercizi

💬 DIMMI COSA TI INTERESSA:
Vuoi un piano specifico? Hai domande su nutrizione? Cerchi un workout per oggi?

Fammi sapere come posso aiutarti!`;
  };

  return (
    <>
      {/* CONTAINER CHAT */}
      <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] flex flex-col" 
           style={{ 
             height: 'calc(100vh - 400px)', // Card più piccola per mostrare input
             marginBottom: '20px' 
           }}>
        
        {/* Header */}
        <div className="bg-[#EEBA2B] text-black p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black">PrimeBot</h3>
                <p className="text-sm text-black/70">
                  {connectionStatus === 'connected' ? (isUsingFallback ? 'Online (Fallback)' : 'Online') : 
                   connectionStatus === 'testing' ? 'Connessione...' : 'Offline'} • Sempre disponibile
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-black hover:text-black/70"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900" style={{ maxHeight: 'calc(100vh - 500px)' }}>
          {!isInitialized && isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex space-x-1 mb-4">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-600">Inizializzazione PrimeBot...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-4">
              <ErrorFallback
                type="network"
                message={error}
                onRetry={handleRetryConnection}
                onGoHome={() => window.location.href = '/'}
                className="max-w-md"
              />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#EEBA2B] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-800">PB</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Benvenuto in PrimeBot!
                </h3>
                <p className="text-gray-600 mb-4">
                  Il tuo AI Coach personale è pronto ad aiutarti con allenamenti, 
                  progressi e motivazione.
                </p>
                {userStats.total_messages > 0 && (
                  <p className="text-sm text-gray-500">
                    Hai già inviato {userStats.total_messages} messaggi
                  </p>
                )}
              </div>
            </div>
                   ) : (
             <div className="space-y-4">
               {messages.map((message) => (
                 <div
                   key={message.id}
                   className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div
                     className={`max-w-[80%] p-3 rounded-2xl ${
                       message.sender === 'user'
                         ? 'bg-blue-600'
                         : 'bg-white'
                     } relative group`}
                   >
                     <div className="flex items-start space-x-2">
                       {message.sender === 'bot' && (
                         <Bot className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
                       )}
                       <div className="flex-1">
                         <div className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-black'} whitespace-pre-wrap`}>
                           {message.text}
                         </div>
                         {message.buttons && message.buttons.length > 0 && (
                           <div className="mt-3 flex flex-wrap gap-2">
                             {message.buttons.map((button) => (
                               <Button
                                 key={button.id}
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleChoiceSelect(button.action)}
                                 className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                               >
                                 {button.text}
                               </Button>
                             ))}
                           </div>
                         )}
                       </div>
                       {message.sender === 'user' && (
                         <User className="h-4 w-4 text-blue-200 mt-0.5 flex-shrink-0" />
                       )}
                     </div>
                   </div>
                 </div>
               ))}
               
               {/* Typing Indicator */}
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="max-w-[80%] p-3 rounded-2xl bg-white relative group">
                     <div className="flex items-start space-x-2">
                       <Bot className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
                       <div className="flex-1">
                         <div className="flex items-center gap-1">
                           <div className="flex space-x-1">
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                           </div>
                           <span className="text-sm text-gray-500 ml-2">PrimeBot sta scrivendo...</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               
               <div ref={messagesEndRef} />
             </div>
           )}
         </div>

        {/* Card suggerimenti DENTRO il container */}
        <div className="p-2 border-t border-[#EEBA2B]">
          <div className="grid grid-cols-2 gap-1">
            {questionsToShow.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputText(question);
                  handleSendMessage(question);
                }}
                className="text-xs bg-white hover:bg-gray-50 text-black px-1.5 py-1 rounded-md transition-colors border border-[#EEBA2B] truncate"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INPUT FUORI DAL CONTAINER - FIXED IN BASSO */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-black/95 backdrop-blur-sm z-[99999] border-t border-[#EEBA2B]">
        <div className="container max-w-4xl mx-auto">
          <div className="flex space-x-2 bg-black/90 p-2 rounded-lg border-t-2 border-[#EEBA2B]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Scrivi la tua domanda..."
              className="flex-1 px-3 py-2 border border-[#EEBA2B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] text-white bg-gray-800 placeholder-gray-400"
            />
            <Button 
              onClick={() => handleSendMessage(inputText)}
              className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black px-3"
              disabled={!inputText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
