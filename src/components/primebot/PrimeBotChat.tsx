// PrimeBotChat Component
// Chat container principale per PrimeBot

import React, { useRef, useEffect, useState } from 'react';
import { usePrimeBotChat } from '@/hooks/usePrimeBotChat';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, User } from 'lucide-react';

interface PrimeBotChatProps {
  onClose?: () => void;
  isFullScreen?: boolean;
}

export const PrimeBotChat: React.FC<PrimeBotChatProps> = ({
  onClose,
  isFullScreen = false
}) => {
  const {
    messages,
    isLoading,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [isUsingFallback, setIsUsingFallback] = useState(false);

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

  const handleSendMessage = async (message: string) => {
    await sendUserMessage(message);
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

  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#EEBA2B] rounded-t-2xl" style={{background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Coach Prime</h3>
              <p className="text-sm text-purple-100">
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
              className="text-white hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-300">
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={initializeChat} variant="outline">
                Riprova
              </Button>
            </div>
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
                         {message.content}
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

      {/* Suggested Questions */}
      <div className="p-4 border-t border-[#EEBA2B]">
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            'Come posso migliorare la mia resistenza?',
            'Quale workout è meglio per oggi?',
            'Consigli per la nutrizione pre-allenamento',
            'Come posso raggiungere i miei obiettivi?'
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(question)}
              className="text-xs bg-white hover:bg-gray-50 text-black px-3 py-2 rounded-full transition-colors border border-[#EEBA2B]"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder="Scrivi la tua domanda..."
            className="flex-1 px-4 py-2 border border-[#EEBA2B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] text-black bg-white placeholder-gray-500"
          />
          <Button 
            onClick={() => handleSendMessage(inputText)}
            className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black"
            disabled={!inputText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
