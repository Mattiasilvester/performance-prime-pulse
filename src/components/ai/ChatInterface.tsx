
import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
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

// Chiave per il localStorage
const CHAT_STORAGE_KEY = 'ai_coach_chat_messages';

export const ChatInterface = forwardRef((props, ref) => {
  // Inizializza i messaggi dal localStorage o usa quelli iniziali
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Converte le date da stringa a oggetto Date
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (error) {
        console.error('Errore nel parsing dei messaggi salvati:', error);
        return initialMessages;
      }
    }
    return initialMessages;
  });
  
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { toast } = useToast();

  // Salva i messaggi nel localStorage ogni volta che cambiano
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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
    
    // Piano personalizzato per perdita peso
    if (lowerText.includes('perdere peso') || lowerText.includes('perdita') || lowerText.includes('dimagrire') || lowerText.includes('dimagrimento')) {
      return `🏋️‍♀️ PIANO FORZA E MASSA MUSCOLARE

📋 OBIETTIVO: Perdita di peso efficace e sostenibile
📅 DURATA: 6 settimane  
🔄 FREQUENZA: 4-5 volte a settimana

📊 STRUTTURA SETTIMANALE

🔥 LUNEDÌ - HIIT Cardio (30 min)
• Riscaldamento: 5 min camminata veloce
• 20 min HIIT: 30 sec alta intensità + 30 sec recupero  
• Defaticamento: 5 min stretching

💪 MARTEDÌ - Forza Upper Body (40 min)
• Push-up: 3x8-12
• Trazioni assistite: 3x6-10
• Shoulder press: 3x10-12
• Plank: 3x30-45 sec

🚶‍♀️ MERCOLEDÌ - Riposo Attivo
• Camminata 30-45 min oppure yoga leggero

🔄 GIOVEDÌ - Circuito Full Body (35 min)
• Squat: 3x12-15
• Burpees: 3x8-10
• Mountain climbers: 3x20
• Jumping jacks: 3x30 sec

🏃‍♀️ VENERDÌ - Cardio Steady State (40 min)
• Corsa leggera, bici o ellittica
• Zona frequenza cardiaca: 65-75% FCmax

🎯 WEEKEND - Attività ricreativa
• Escursioni, sport, nuoto, danza

🍎 LINEE GUIDA NUTRIZIONALI
• Deficit calorico di 300-500 cal/giorno
• Proteine: 1.6-2g per kg peso corporeo
• Idratazione: 2-3 litri acqua/giorno
• 5 pasti piccoli invece di 3 grandi

📈 PROGRESSIONE
• Settimana 1-2: Adattamento
• Settimana 3-4: Aumento intensità 10%
• Settimana 5-6: Picco di intensità

Hai domande su esercizi specifici o la progressione?`;
    }
    
    // Piano per forza e massa
    if (lowerText.includes('forza') || lowerText.includes('massa') || lowerText.includes('muscol')) {
      return `💪 PIANO FORZA E MASSA MUSCOLARE

📋 OBIETTIVO: Aumento forza e massa muscolare
📅 DURATA: 8 settimane
🔄 FREQUENZA: 4 volte a settimana

📊 SPLIT DI ALLENAMENTO

🔴 GIORNO A - Upper Push (Petto, Spalle, Tricipiti)
• Panca piana: 4x6-8
• Military press: 3x8-10
• Dips: 3x8-12
• Alzate laterali: 3x12-15

🔵 GIORNO B - Lower Body (Gambe, Glutei)
• Squat: 4x6-8
• Stacco rumeno: 3x8-10
• Affondi bulgari: 3x10 per gamba
• Polpacci: 4x15-20

🟢 GIORNO C - Upper Pull (Schiena, Bicipiti)
• Trazioni: 4x6-8
• Rematore: 3x8-10
• Curl bilanciere: 3x10-12
• Face pull: 3x12-15

🟡 GIORNO D - Full Body Power
• Squat jump: 4x5
• Push-up esplosivi: 4x5
• Kettlebell swing: 4x15
• Plank dinamico: 3x30 sec

⚖️ PRINCIPI DI PROGRESSIONE
• Aumenta peso del 2.5-5% quando completi tutte le serie
• Riposo 2-3 minuti tra serie pesanti
• Focus su forma perfetta

🥗 SUPPORTO NUTRIZIONALE
• Surplus calorico di 200-400 cal/giorno
• Proteine: 2-2.5g per kg peso corporeo
• Carboidrati pre/post workout
• Creatina: 3-5g giornalieri

Vuoi dettagli su tecnica degli esercizi o periodizzazione?`;
    }
    
    // Piano resistenza
    if (lowerText.includes('resistenza') || lowerText.includes('cardio') || lowerText.includes('corsa')) {
      return `🏃‍♂️ PIANO RESISTENZA CARDIOVASCOLARE

📋 OBIETTIVO: Miglioramento resistenza e capacità aerobica
📅 DURATA: 6 settimane
🔄 FREQUENZA: 5 volte a settimana

📊 PROGRAMMA SETTIMANALE

🔵 LUNEDÌ - Base Aerobica (45 min)
• Zona 2: 65-75% FCmax
• Corsa/bici ritmo conversazione

🔴 MARTEDÌ - Intervalli Medi (35 min)
• Riscaldamento: 10 min
• 6x3 min al 85% FCmax (rec 90 sec)
• Defaticamento: 10 min

🟢 MERCOLEDÌ - Cross-training (40 min)
• Nuoto, ellittica, rowing
• Intensità moderata

🟡 GIOVEDÌ - HIIT Brevi (25 min)
• Riscaldamento: 8 min
• 8x30 sec max + 90 sec recupero
• Defaticamento: 7 min

🔵 VENERDÌ - Long Slow Distance (60+ min)
• Ritmo comodo e sostenibile
• Zona 1-2: 60-70% FCmax

📈 TEST DI CONTROLLO
• Settimana 2: Test 5km
• Settimana 4: Test 10km
• Settimana 6: Test finale

💡 CONSIGLI PRATICI
• Monitora frequenza cardiaca
• Idratazione costante
• Recovery attivo nei giorni off

Preferisci focus su velocità o resistenza pura?`;
    }
    
    // Consigli nutrizionali
    if (lowerText.includes('nutrizione') || lowerText.includes('alimentazione') || lowerText.includes('dieta')) {
      return `🍎 GUIDA NUTRIZIONALE PRE-WORKOUT

⏰ TIMING OTTIMALE (30-60 min prima)
• Banana + miele
• Avena con frutta
• Toast integrale con marmellata
• Smoothie con frutta

💧 IDRATAZIONE
• 400-500ml acqua 2 ore prima
• 200ml 15 min prima dell'allenamento

❌ DA EVITARE
• Grassi eccessivi (rallentano digestione)
• Fibre in eccesso (possono causare crampi)
• Pasti troppo abbondanti
• Cibi piccanti o acidi

🥗 POST-WORKOUT (entro 30-60 min)
• Proteine: 20-30g
• Carboidrati: 30-60g
• Esempio: Yogurt greco + frutta + miele

⚡ ENERGIA DURANTE L'ALLENAMENTO
• Sessioni >60 min: drink sportivo
• Sessioni <60 min: solo acqua

Hai intolleranze alimentari specifiche da considerare?`;
    }
    
    // Consigli per obiettivi
    if (lowerText.includes('obiettivi') || lowerText.includes('raggiungere') || lowerText.includes('meta')) {
      return `🎯 STRATEGIA PER RAGGIUNGERE I TUOI OBIETTIVI

📋 PRINCIPI SMART
• Specifici: Definisci esattamente cosa vuoi
• Misurabili: Usa metriche concrete
• Raggiungibili: Sii realistico
• Rilevanti: Allineati alle tue priorità
• Temporizzati: Stabilisci scadenze

📊 SISTEMA DI MONITORAGGIO
• Progresso settimanale: foto, misure, performance
• Diario di allenamento: esercizi, pesi, ripetizioni
• Feedback corporeo: energia, sonno, umore

🔄 ADATTAMENTO CONTINUO
• Revisione bi-settimanale del piano
• Aggiustamenti basati sui risultati
• Variazione per evitare plateau

💪 FATTORI CHIAVE
• Consistenza: meglio poco ma costante
• Recovery: riposo e sonno adeguati
• Pazienza: i risultati arrivano nel tempo
• Supporto: condividi il percorso

🎖️ CELEBRA I PROGRESSI
• Riconosci ogni piccolo miglioramento
• Premia te stesso per i traguardi raggiunti

Qual è il tuo obiettivo principale in questo momento?`;
    }
    
    // Consigli per workout di oggi
    if (lowerText.includes('workout') || lowerText.includes('allenamento') || lowerText.includes('oggi')) {
      return `💪 WORKOUT CONSIGLIATO PER OGGI

🔥 CIRCUITO FULL BODY (30 minuti)

🏃‍♀️ RISCALDAMENTO (5 min)
• Marcia sul posto: 1 min
• Cerchi con le braccia: 30 sec
• Jumping jacks: 1 min
• Stretching dinamico: 2.5 min

💪 PARTE PRINCIPALE (20 min - 4 giri)
🔴 Circuito A (45 sec lavoro, 15 sec riposo):
• Squat
• Push-up (anche sulle ginocchia)
• Plank
• Burpees modificati

🔵 Riposo attivo: 2 min tra i circuiti

❄️ DEFATICAMENTO (5 min)
• Stretching statico
• Respirazione profonda

⚡ INTENSITÀ: Moderata-Alta
🎯 BENEFICI: Forza, resistenza, brucia grassi

💡 ADATTAMENTI:
• Principiante: riduci durata a 20 min totali
• Avanzato: aggiungi pesi o aumenta ritmo

Hai attrezzature specifiche a disposizione?`;
    }
    
    // Risposta di default più mirata
    return `Ciao! Sono qui per aiutarti con il tuo fitness. 

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
            className="flex-1 px-4 py-2 border border-[#EEBA2B] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white placeholder-gray-500"
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
