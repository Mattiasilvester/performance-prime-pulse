
import { useState, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

export const ChatInterface = forwardRef((props, ref) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Espone il metodo sendMessage al componente padre
  useImperativeHandle(ref, () => ({
    sendMessage
  }));

  const copyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast({
        title: "Messaggio copiato!",
        description: "Il messaggio è stato copiato negli appunti.",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il messaggio.",
        variant: "destructive",
      });
    }
  };

  const generateAIResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    // Se il messaggio contiene "piano" e obiettivi specifici, crea un piano direttamente
    if (lowerText.includes('piano') || lowerText.includes('allenamento')) {
      if (lowerText.includes('perdere peso') || lowerText.includes('perdita') || lowerText.includes('dimagrire')) {
        return `## 🔥 Piano Personalizzato per Perdita Peso

**Obiettivo:** Perdita di peso efficace e sostenibile
**Durata:** 6 settimane
**Frequenza:** 4-5 volte a settimana

### 📋 Struttura Settimanale

**Lunedì - HIIT Cardio (30 min)**
- Riscaldamento: 5 min camminata veloce
- 20 min HIIT: 30 sec alta intensità + 30 sec recupero
- Defaticamento: 5 min stretching

**Martedì - Forza Upper Body (40 min)**
- Push-up: 3x8-12
- Trazioni assistite: 3x6-10
- Shoulder press: 3x10-12
- Plank: 3x30-45 sec

**Mercoledì - Riposo Attivo**
- Camminata 30-45 min oppure yoga leggero

**Giovedì - Circuito Full Body (35 min)**
- Squat: 3x12-15
- Burpees: 3x8-10
- Mountain climbers: 3x20
- Jumping jacks: 3x30 sec

**Venerdì - Cardio Steady State (40 min)**
- Corsa leggera, bici o ellittica
- Zona frequenza cardiaca: 65-75% FCmax

**Weekend - Attività ricreativa**
- Escursioni, sport, nuoto, danza

### 🍎 Linee Guida Nutrizionali
- Deficit calorico di 300-500 cal/giorno
- Proteine: 1.6-2g per kg peso corporeo
- Idratazione: 2-3 litri acqua/giorno
- 5 pasti piccoli invece di 3 grandi

### 📈 Progressione
- Settimana 1-2: Adattamento
- Settimana 3-4: Aumento intensità 10%
- Settimana 5-6: Picco di intensità

**Monitoraggio:** Pesati 1 volta a settimana, stesso giorno e orario.

Hai domande specifiche su questo piano? Vuoi che modifichi qualche esercizio?`;
      }
      
      if (lowerText.includes('forza') || lowerText.includes('massa')) {
        return `## 💪 Piano Forza e Massa Muscolare

**Obiettivo:** Aumento forza e massa muscolare
**Durata:** 8 settimane
**Frequenza:** 4 volte a settimana

### 📋 Split di Allenamento

**Giorno A - Upper Push (Petto, Spalle, Tricipiti)**
- Panca piana: 4x6-8
- Military press: 3x8-10
- Dips: 3x8-12
- Alzate laterali: 3x12-15

**Giorno B - Lower Body (Gambe, Glutei)**
- Squat: 4x6-8
- Stacco rumeno: 3x8-10
- Affondi bulgari: 3x10 per gamba
- Polpacci: 4x15-20

**Giorno C - Upper Pull (Schiena, Bicipiti)**
- Trazioni: 4x6-8
- Rematore: 3x8-10
- Curl bilanciere: 3x10-12
- Face pull: 3x12-15

**Giorno D - Full Body Power**
- Squat jump: 4x5
- Push-up esplosivi: 4x5
- Kettlebell swing: 4x15
- Plank dinamico: 3x30 sec

### ⚖️ Principi di Progressione
- Aumenta peso del 2.5-5% quando completi tutte le serie
- Riposo 2-3 minuti tra serie pesanti
- Focus su forma perfetta

### 🥗 Supporto Nutrizionale
- Surplus calorico di 200-400 cal/giorno
- Proteine: 2-2.5g per kg peso corporeo
- Carboidrati pre/post workout
- Creatina: 3-5g giornalieri

Quale parte vorresti approfondire? Hai attrezzature specifiche a disposizione?`;
      }
    }
    
    if (lowerText.includes('resistenza') || lowerText.includes('cardio')) {
      return `## 🏃‍♂️ Piano Resistenza Cardiovascolare

**Obiettivo:** Miglioramento resistenza e capacità aerobica
**Durata:** 6 settimane
**Frequenza:** 5 volte a settimana

### 📋 Programma Settimanale

**Lunedì - Base Aerobica (45 min)**
- Zona 2: 65-75% FCmax
- Corsa/bici ritmo conversazione

**Martedì - Intervalli Medi (35 min)**
- Riscaldamento: 10 min
- 6x3 min al 85% FCmax (rec 90 sec)
- Defaticamento: 10 min

**Mercoledì - Cross-training (40 min)**
- Nuoto, ellittica, rowing
- Intensità moderata

**Giovedì - HIIT Brevi (25 min)**
- Riscaldamento: 8 min
- 8x30 sec max + 90 sec recupero
- Defaticamento: 7 min

**Venerdì - Long Slow Distance (60+ min)**
- Ritmo comodo e sostenibile
- Zona 1-2: 60-70% FCmax

### 📈 Test di Controllo
- Settimana 2: Test 5km
- Settimana 4: Test 10km
- Settimana 6: Test finale

### 💡 Consigli Pratici
- Monitora frequenza cardiaca
- Idratazione costante
- Recovery attivo nei giorni off

Su quale aspetto della resistenza vuoi concentrarti di più?`;
    }
    
    // Risposte più generiche ma comunque utili
    if (lowerText.includes('workout') || lowerText.includes('oggi')) {
      return 'Perfetto! Basandomi sui tuoi progressi, oggi ti consiglio un allenamento che combini forza e cardio. Hai preferenze per la parte del corpo da allenare? E quanto tempo hai a disposizione?';
    }
    
    if (lowerText.includes('nutrizione') || lowerText.includes('alimentazione')) {
      return 'Ottima domanda! Per l\'alimentazione pre-workout ti consiglio:\n\n🍌 **30-60 min prima:**\n- Banana + un po\' di miele\n- Avena con frutta\n- Toast integrale con marmellata\n\n💧 **Idratazione:**\n- 400-500ml acqua 2 ore prima\n- 200ml 15 min prima\n\n❌ **Evita:**\n- Grassi e fibre eccessive\n- Pasti troppo abbondanti\n\nHai qualche intolleranza o preferenza alimentare?';
    }
    
    if (lowerText.includes('obiettivi') || lowerText.includes('raggiungere')) {
      return 'Eccellente approccio! Per raggiungere i tuoi obiettivi è fondamentale:\n\n🎯 **Definire obiettivi SMART:**\n- Specifici e misurabili\n- Realistici e temporizzati\n\n📊 **Monitoraggio costante:**\n- Progresso settimanale\n- Adattamenti del piano\n\n🔄 **Consistenza:**\n- Routine sostenibile\n- Recovery adeguato\n\nQual è il tuo obiettivo principale in questo momento? Posso creare un piano specifico per te.';
    }
    
    // Risposta di default più interattiva
    return 'Interessante! Dimmi di più su cosa ti preoccupa o cosa vorresti migliorare. Posso aiutarti con:\n\n💪 Piani di allenamento personalizzati\n🏃‍♂️ Programmi cardio e resistenza\n🍎 Consigli nutrizionali\n📈 Strategie di progressione\n\nChe tipo di supporto ti serve oggi?';
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
              } relative group`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && (
                  <Bot className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-black'} whitespace-pre-wrap`}>
                    {message.text}
                  </div>
                  {message.sender === 'ai' && (
                    <button
                      onClick={() => copyMessage(message.id, message.text)}
                      className="mt-2 p-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs text-gray-600"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedMessageId === message.id ? 'Copiato!' : 'Copia'}
                    </button>
                  )}
                </div>
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
              className="text-xs bg-slate-100 hover:bg-slate-200 text-black px-3 py-2 rounded-full transition-colors border border-[#EEBA2B]"
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
            className="flex-1 px-4 py-2 border border-[#EEBA2B] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
});

ChatInterface.displayName = 'ChatInterface';
