
import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { Send, Bot, User, Copy, Check, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
  navigation?: {
    path: string;
    action: string;
  };
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

interface ChatInterfaceProps {
  onClose?: () => void;
}

export const ChatInterface = forwardRef<{ sendMessage: (text: string) => void }, ChatInterfaceProps>((props, ref) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  // Inizializza i messaggi dal localStorage o usa quelli iniziali
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Converte le date da stringa a oggetto Date
        return parsed.map((msg: { timestamp?: string; [key: string]: unknown }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp ?? Date.now())
        }));
      } catch (error) {
        console.error('Errore nel parsing dei messaggi salvati:', error);
        return [];
      }
    }
    return [];
  });
  
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const { toast } = useToast();

  // Funzione per gestire i suggerimenti
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Funzione per gestire la navigazione
  const handleNavigation = (path: string) => {
    navigate(path);
    toast({
      title: "Navigazione",
      description: `Ti sto portando a ${path}`,
    });
  };

  // Funzione per ottenere il testo del pulsante di navigazione
  const getNavigationButtonText = (path: string): string => {
    const pathMap: { [key: string]: string } = {
      '/workouts': 'Vai a Workouts',
      '/nutrition': 'Vai a Nutrition', 
      '/dashboard': 'Vai a Dashboard',
      '/profile': 'Vai a Profile',
      '/schedule': 'Vai a Schedule',
      '/timer': 'Vai a Timer'
    };
    return pathMap[path] || `Vai a ${path}`;
  };

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
        const userName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name || user?.email?.split('@')[0] || 'Utente';
        
        const userOnboarded = localStorage.getItem(`user_onboarded_${userId}`);
        const isFirstVisit = !sessionStorage.getItem(`first_visit_${userId}`);
        
        if (!userOnboarded && isFirstVisit && messages.length === 0) {
          setIsNewUser(true);
          sessionStorage.setItem(`first_visit_${userId}`, 'true');
          
          // Messaggio di benvenuto automatico per nuovo utente
          const welcomeMessage: Message = {
            id: 'welcome',
                          text: `Ciao ${userName} 👋\n\nBenvenuto in Performance Prime! Sono il tuo PrimeBot personale e ti guiderò attraverso l'app.\n\n🎯 COSA PUOI FARE:\n• 📊 Dashboard - Monitora i tuoi progressi\n• 💪 Allenamenti - Crea e gestisci workout\n• 📅 Appuntamenti - Prenota sessioni\n• 🤖 PrimeBot - Chiedi consigli personalizzati\n• 👤 Profilo - Gestisci il tuo account\n\nVuoi che ti spieghi una sezione specifica o hai domande?`,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages([welcomeMessage]);
        } else if (messages.length === 0) {
          // Utente esistente - messaggio normale
          setMessages([{
            id: '1',
            text: 'Ciao Marco! Sono il tuo AI Coach. Come posso aiutarti oggi con il tuo allenamento?',
            sender: 'ai',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Errore nel controllo nuovo utente:', error);
        // Fallback a messaggio normale
        if (messages.length === 0) {
          setMessages([{
            id: '1',
            text: 'Ciao Marco! Sono il tuo AI Coach. Come posso aiutarti oggi con il tuo allenamento?',
            sender: 'ai',
            timestamp: new Date(),
          }]);
        }
      }
    };
    
    checkNewUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run only on mount; adding messages.length would re-run on every message and alter welcome flow
  }, []);

  // Salva i messaggi nel localStorage ogni volta che cambiano
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

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

    // Simulate AI response with suggestions and navigation
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: generateAIResponse(text),
      sender: 'ai',
      timestamp: new Date(),
      suggestions: generateSuggestions(text),
      navigation: generateNavigation(text) ?? undefined
    };

    setMessages(prev => [...prev, userMessage, aiResponse]);
    setInputText('');
  };

  // Genera suggerimenti basati sul messaggio
  const generateSuggestions = (text: string): string[] => {
    const lowerText = (text || '').toString().toLowerCase().trim();
    
    if (lowerText.includes('workout') || lowerText.includes('allenamento')) {
      return [
        "Mostrami esercizi specifici",
        "Crea un piano settimanale",
        "Vai alla sezione Workouts"
      ];
    }
    
    if (lowerText.includes('nutrizione') || lowerText.includes('dieta')) {
      return [
        "Calcola le mie calorie",
        "Suggeriscimi ricette",
        "Vai alla sezione Nutrition"
      ];
    }
    
    if (lowerText.includes('progressi') || lowerText.includes('statistiche')) {
      return [
        "Mostra i miei grafici",
        "Vai alla Dashboard",
        "Analizza le mie performance"
      ];
    }
    
    return [
      "Come posso aiutarti?",
      "Hai altre domande?",
      "Esplora le funzionalità"
    ];
  };

  // Genera navigazione basata sul messaggio
  const generateNavigation = (text: string) => {
    const lowerText = (text || '').toString().toLowerCase().trim();
    
    // Riconosce domande che iniziano con "dove" per creare allenamenti
    if (lowerText.includes('dove') && (lowerText.includes('creare') || lowerText.includes('allenamento'))) {
      return { path: '/workouts', action: 'navigate_to_workouts' };
    }
    
    if (lowerText.includes('workout') || lowerText.includes('esercizi') || lowerText.includes('allenamento') || lowerText.includes('creare allenamento')) {
      return { path: '/workouts', action: 'navigate_to_workouts' };
    }
    
    // Riconosce domande che iniziano con "dove" per nutrizione
    if (lowerText.includes('dove') && (lowerText.includes('nutrizione') || lowerText.includes('dieta') || lowerText.includes('alimentazione'))) {
      return { path: '/nutrition', action: 'navigate_to_nutrition' };
    }
    
    if (lowerText.includes('nutrizione') || lowerText.includes('dieta') || lowerText.includes('alimentazione')) {
      return { path: '/nutrition', action: 'navigate_to_nutrition' };
    }
    
    // Riconosce domande che iniziano con "dove" per dashboard
    if (lowerText.includes('dove') && (lowerText.includes('progressi') || lowerText.includes('dashboard') || lowerText.includes('statistiche'))) {
      return { path: '/dashboard', action: 'navigate_to_dashboard' };
    }
    
    if (lowerText.includes('progressi') || lowerText.includes('dashboard') || lowerText.includes('statistiche')) {
      return { path: '/dashboard', action: 'navigate_to_dashboard' };
    }
    
    // Riconosce domande che iniziano con "dove" per profilo
    if (lowerText.includes('dove') && (lowerText.includes('profilo') || lowerText.includes('impostazioni') || lowerText.includes('settings'))) {
      return { path: '/profile', action: 'navigate_to_profile' };
    }
    
    if (lowerText.includes('profilo') || lowerText.includes('impostazioni') || lowerText.includes('settings')) {
      return { path: '/profile', action: 'navigate_to_profile' };
    }
    
    if (lowerText.includes('schedule') || lowerText.includes('appuntamenti') || lowerText.includes('prenotazioni')) {
      return { path: '/schedule', action: 'navigate_to_schedule' };
    }
    
    if (lowerText.includes('timer') || lowerText.includes('cronometro')) {
      return { path: '/timer', action: 'navigate_to_timer' };
    }
    
    return null;
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
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCopiedMessageId(null);
        timeoutRef.current = null;
      }, 2000);
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il messaggio.",
        variant: "destructive",
      });
    }
  };

  const generateAIResponse = (userText: string): string => {
    const lowerText = (userText || '').toString().toLowerCase().trim();
    
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
    
    // Navigazione per creare allenamenti
    if (lowerText.includes('dove') && (lowerText.includes('creare') || lowerText.includes('allenamento'))) {
      return `Perfetto! Per creare un allenamento personalizzato, vai alla sezione Workouts. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!`;
    }
    
    // Navigazione per dashboard
    if (lowerText.includes('dove') && (lowerText.includes('dashboard') || lowerText.includes('progressi') || lowerText.includes('statistiche'))) {
      return `Perfetto! Per vedere i tuoi progressi e statistiche, vai alla Dashboard. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!`;
    }
    
    // Navigazione per nutrizione
    if (lowerText.includes('dove') && (lowerText.includes('nutrizione') || lowerText.includes('dieta') || lowerText.includes('alimentazione'))) {
      return `Perfetto! Per gestire la tua nutrizione e piani alimentari, vai alla sezione Nutrition. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!`;
    }
    
    // Navigazione per profilo
    if (lowerText.includes('dove') && (lowerText.includes('profilo') || lowerText.includes('impostazioni') || lowerText.includes('settings'))) {
      return `Perfetto! Per gestire il tuo profilo e le impostazioni, vai alla sezione Profile. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!`;
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
              <h3 className="font-semibold text-white">PrimeBot</h3>
              <p className="text-sm text-purple-100">Online • Sempre disponibile</p>
            </div>
          </div>
          {props.onClose && (
            <Button
              onClick={props.onClose}
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
                {message.sender === 'ai' && (
                  <Bot className="h-4 w-4 text-[#EEBA2B] mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-black'} whitespace-pre-wrap`}>
                    {message.text}
                  </div>
                  {message.sender === 'ai' && (
                    <div className="mt-2 space-y-2">
                      <button
                        onClick={() => copyMessage(message.id, message.text)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs text-gray-600"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedMessageId === message.id ? 'Copiato!' : 'Copia'}
                      </button>
                      
                      {/* Suggerimenti cliccabili */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs px-3 py-1 bg-[#EEBA2B] text-black rounded-full hover:bg-[#EEBA2B]/80 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Pulsante di navigazione */}
                      {message.navigation && (
                        <button
                          onClick={() => handleNavigation(message.navigation!.path)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Navigation className="h-4 w-4" />
                          {getNavigationButtonText(message.navigation.path)}
                        </button>
                      )}
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
      </div>

      {/* Suggested Questions */}
      <div className="p-4 border-t border-[#EEBA2B]">
        <div className="flex flex-wrap gap-2 mb-3">
          {questionsToShow.map((question, index) => (
            <button
              key={index}
              onClick={() => sendMessage(question)}
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
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
            placeholder="Scrivi la tua domanda..."
            className="flex-1 px-4 py-2 border border-[#EEBA2B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] text-black bg-white placeholder-gray-500"
          />
          <Button 
            onClick={() => sendMessage(inputText)}
            className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black"
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
