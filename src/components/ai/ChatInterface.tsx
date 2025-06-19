
import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Ciao Marco! Sono il tuo AI Coach. Come posso aiutarti oggi con il tuo allenamento?',
    sender: 'ai',
    timestamp: new Date(),
  },
];

const suggestedQuestions = [
  'Come posso migliorare la mia resistenza?',
  'Quale workout è meglio per oggi?',
  'Consigli per la nutrizione pre-allenamento',
  'Come posso raggiungere i miei obiettivi?',
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    // Simulate AI response
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: generateAIResponse(text),
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, aiResponse]);
    setInputText('');
  };

  const generateAIResponse = (userText: string): string => {
    if (userText.toLowerCase().includes('resistenza')) {
      return 'Per migliorare la resistenza, ti consiglio di integrare 3-4 sessioni di cardio a settimana, alternando HIIT e steady-state. Vuoi che creo un piano personalizzato?';
    }
    if (userText.toLowerCase().includes('workout')) {
      return 'Basandomi sui tuoi progressi recenti, oggi sarebbe perfetto un allenamento di forza per la parte superiore. Hai circa 45 minuti disponibili?';
    }
    if (userText.toLowerCase().includes('nutrizione')) {
      return 'Per l\'allenamento pre-workout, ti consiglio carboidrati semplici 30-60 minuti prima (banana o avena) e molta idratazione. Evita grassi e fibre eccessive.';
    }
    return 'Ottima domanda! Basandomi sui tuoi dati e obiettivi, posso aiutarti a ottimizzare il tuo percorso. Dimmi di più su cosa ti preoccupa o su cosa vorresti migliorare.';
  };

  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#EEBA2B] rounded-t-2xl" style={{background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)'}}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Coach Prime</h3>
            <p className="text-sm text-purple-100">Online • Sempre disponibile</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-blue-600'
                  : 'bg-slate-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && (
                  <Bot className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-black'}`}>
                  {message.text}
                </p>
                {message.sender === 'user' && (
                  <User className="h-4 w-4 text-blue-200 mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Questions */}
      <div className="p-4 border-t border-[#EEBA2B]">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => sendMessage(question)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-white px-3 py-2 rounded-full transition-colors"
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
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
            placeholder="Scrivi la tua domanda..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button 
            onClick={() => sendMessage(inputText)}
            className="bg-[#EEBA2B] hover:bg-[#EEBA2B] text-black"
            disabled={!inputText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
