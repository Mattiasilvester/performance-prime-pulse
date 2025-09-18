import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { vfPatchState, vfInteract, parseVF } from '@/lib/voiceflow';
import { fetchUserProfile } from '@/services/userService';
import { Zap, X } from 'lucide-react';
import { getAIResponse, checkMonthlyLimit } from '@/lib/openai-service';
import { findPresetResponse, disclaimerMessage } from '@/lib/primebot-fallback';

type Msg = { 
  id: string; 
  role: 'user' | 'bot'; 
  text: string; 
  navigation?: { 
    path: string; 
    label: string; 
    action: string; 
  };
  isDisclaimer?: boolean;
};

interface PrimeChatProps {
  isModal: boolean;
  onClose?: () => void;
  onStartChat?: () => void;
}

export default function PrimeChat({ isModal, onClose, onStartChat }: PrimeChatProps) {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [aiLimit, setAiLimit] = useState({ used: 0, remaining: 10 });

  // Test API connection on mount (solo per debug)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_VF_API_KEY;
      if (apiKey) {
      } else {
        console.error('❌ API Key not found!');
      }
    }
  }, []);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  // Logica per mostrare landing page
  const showLanding = msgs.length === 0;

  // Auto-scroll quando arrivano nuovi messaggi
  useEffect(() => {
    // Scrolla all'ultimo messaggio
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]); // Triggera ogni volta che msgs cambia

  // Smooth scroll durante loading del bot
  useEffect(() => {
    if (loading) {
      // Scrolla anche quando il bot sta scrivendo
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [loading]);

  // Nascondi feedback widget quando chat è fullscreen
  useEffect(() => {
    if (isModal) {
      const feedbackWidget = document.querySelector('.feedback-widget');
      if (feedbackWidget) {
        (feedbackWidget as HTMLElement).style.visibility = 'hidden';
      }
      
      return () => {
        if (feedbackWidget) {
          (feedbackWidget as HTMLElement).style.visibility = 'visible';
        }
      };
    }
  }, [isModal]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const id = user?.id || userId;
      
      // Usa il servizio userService per ottenere il nome utente
      const userProfile = await fetchUserProfile();
      const fullName = userProfile?.name || 'Utente';
      const email = user?.email || '';

      setUserId(id);
      setUserName(fullName);
      setUserEmail(email);

      // Dopo aver caricato l'utente, check limite AI
      if (user?.id) {
        checkMonthlyLimit(user.id).then(limit => {
          setAiLimit({
            used: limit.used,
            remaining: limit.remaining
          });
        });
      }

      // Controlla se è un nuovo utente
      const userOnboarded = localStorage.getItem(`user_onboarded_${id}`);
      const isFirstVisit = !sessionStorage.getItem(`first_visit_${id}`);
      
      if (!userOnboarded && isFirstVisit) {
        setIsNewUser(true);
        sessionStorage.setItem(`first_visit_${id}`, 'true');
        
        // Messaggio di benvenuto automatico per nuovo utente
        const welcomeMessage: Msg = {
          id: 'welcome',
          role: 'bot',
          text: `Ciao ${fullName} 👋\n\nBenvenuto in Performance Prime! Sono il tuo PrimeBot personale e ti guiderò attraverso l'app.\n\n🎯 COSA PUOI FARE:\n• 📊 Dashboard - Monitora i tuoi progressi\n• 💪 Allenamenti - Crea e gestisci workout\n• 📅 Appuntamenti - Prenota sessioni\n• 🤖 PrimeBot - Chiedi consigli personalizzati\n• 👤 Profilo - Gestisci il tuo account\n\nVuoi che ti spieghi una sezione specifica o hai domande?`
        };
        
        // setMsgs([welcomeMessage]); // RIMOSSO - impediva landing page
      } else {
        // Utente esistente - messaggio normale
        // setMsgs([{
        //   id: 'welcome',
        //   role: 'bot',
        //   text: `Ciao ${fullName} 👋! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
        // }]); // RIMOSSO - impediva landing page
      }

      try {
        await vfPatchState(id, {
          user_name: fullName,
          user_id: id,
          user_contact: email
        });
      } catch (e) {
        console.warn('Voiceflow state patch error', e);
      }
    })();
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    
    const userMessage: Msg = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed
    };
    
    setMsgs(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Marca utente come onboardato dopo la prima interazione
    if (isNewUser) {
      localStorage.setItem(`user_onboarded_${userId}`, 'true');
      setIsNewUser(false);
    }
    
    try {
      // PRIMA: Cerca risposta preimpostata (GRATIS)
      const preset = findPresetResponse(userMessage.text);
      
      if (preset) {
        // Risposta preimpostata trovata
        const botMessage: Msg = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: preset.text
        };
        
        // Se ha un'azione, aggiungila
        if (preset.action) {
          botMessage.navigation = {
            path: preset.action.link,
            label: preset.action.label,
            action: 'navigate'
          };
        }
        
        setMsgs(prev => [...prev, botMessage]);
        
      } else {
        // SECONDO: Usa OpenAI (COSTA TOKEN)
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user?.id) {
          throw new Error('Devi essere loggato per usare l\'AI');
        }
        
        const aiResponse = await getAIResponse(userMessage.text, userData.user.id);
        
        // Se OpenAI non è disponibile, usa fallback generico
        if (!aiResponse.success) {
          const fallbackMessage: Msg = {
            id: crypto.randomUUID(),
            role: 'bot',
            text: aiResponse.message || 'Mi dispiace, non riesco a rispondere ora. Prova con i suggerimenti qui sotto!'
          };
          setMsgs(prev => [...prev, fallbackMessage]);
          return;
        }
        
        const botMessage: Msg = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: aiResponse.message
        };
        
        // Aggiorna limiti AI
        setAiLimit({
          used: 10 - aiResponse.remaining,
          remaining: aiResponse.remaining
        });
        
        setMsgs(prev => [...prev, botMessage]);
      }
      
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      const errorMessage: Msg = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco!'
      };
      setMsgs(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

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

  // Landing page quando non ci sono messaggi e non è modal
  if (showLanding) {
    return (
      <div className={`w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white ${isModal ? 'min-h-[700px]' : 'min-h-[600px] mb-4 pb-2'}`}>
        {/* Landing Page */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          {/* Icona fulmine gialla in cerchio */}
          <div className="w-24 h-24 bg-[#EEBA2B] rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          
          {/* Titolo e sottotitolo */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#EEBA2B]">PrimeBot</h2>
            <p className="text-lg text-gray-300">Il tuo coach fitness AI personalizzato</p>
          </div>
          
          {/* Bottone Inizia Chat */}
          <button
            onClick={() => {
              if (onStartChat) {
                onStartChat();
              } else {
                // Fallback per quando non c'è onStartChat
                const disclaimer = {
                  id: 'disclaimer',
                  role: 'bot' as const,
                  text: `⚠️ **Importante:** PrimeBot è un assistente AI che può commettere errori. Non sostituisce professionisti qualificati. Per problemi di salute, consulta sempre un medico. Usa il buon senso e ascolta il tuo corpo!`,
                  isDisclaimer: true
                };
                
                const welcomeMsg = {
                  id: 'welcome',
                  role: 'bot' as const,
                  text: `Ciao ${userName} 👋! Sono PrimeBot, il tuo coach fitness AI. Come posso aiutarti oggi? 💪`
                };
                
                setMsgs([disclaimer, welcomeMsg]);
              }
            }}
            className="px-8 py-4 bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-bold rounded-xl transition-colors text-lg"
          >
            Inizia Chat con PrimeBot
          </button>
          
          {/* 3 Card Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">💪</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Allenamenti</h3>
              <p className="text-sm text-gray-400">Workout personalizzati</p>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Obiettivi</h3>
              <p className="text-sm text-gray-400">Raggiungi i tuoi goal</p>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-[#EEBA2B] mb-1">Progressi</h3>
              <p className="text-sm text-gray-400">Monitora i risultati</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat fullscreen modal - Layout completo come Lovable
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[55] bg-black flex flex-col">
        {/* Header fisso in alto */}
        <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-white font-bold">PrimeBot</h2>
              <p className="text-gray-400 text-sm">Il tuo coach fitness AI</p>
              {aiLimit.remaining < 10 && (
                <p className="text-yellow-400 text-xs">
                  Domande AI: {aiLimit.remaining}/10 questo mese
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                // Fallback
                window.location.reload();
              }
            }} 
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area - TUTTO LO SPAZIO DISPONIBILE */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-black p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {msgs.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-yellow-500 text-black ml-auto' 
                    : msg.isDisclaimer 
                      ? 'bg-red-900/30 text-yellow-200 border border-red-500/50'
                      : 'bg-gray-800 text-white border border-gray-700'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-black/60' : 'text-gray-400'
                  }`}>
                    {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* Pulsante di navigazione per messaggi bot */}
                  {msg.role === 'bot' && msg.navigation && (
                    <button
                      onClick={() => navigate(msg.navigation!.path)}
                      className="mt-3 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      {msg.navigation.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white border border-gray-700 rounded-2xl px-4 py-3 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>PrimeBot sta scrivendo…</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Elemento invisibile per lo scroll */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - FISSA IN BASSO */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Quick questions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {questionsToShow.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    send(q);
                  }}
                  className="text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="flex gap-3">
              <input
                aria-label="Scrivi la tua domanda"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Scrivi la tua domanda..."
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat normale embedded
  return (
    <div className={`w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white ${isModal ? 'min-h-[700px]' : 'min-h-[600px] mb-4 pb-2'}`}>
      <header className="px-6 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-t-2xl text-black font-semibold">
        PrimeBot <span className="text-sm">• Online • Sempre disponibile</span>
      </header>

      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-4 ${isModal ? 'bg-black' : 'bg-gray-300'} min-h-[400px] max-h-[400px]`}>
        {msgs.map(m => (
          <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
            <div
              className={`px-4 py-3 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-[#EEBA2B] text-black' // Giallo per utente
                  : m.isDisclaimer
                    ? 'bg-red-100 text-red-800 border border-red-300' // Disclaimer in chat normale
                    : isModal 
                      ? 'bg-gray-800 text-white border border-gray-600' // Grigio scuro per bot in modal
                      : 'bg-white text-black' // Bianco per bot in normale
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {/* Timestamp sotto ogni messaggio */}
              <div className={`text-xs mt-2 ${
                m.role === 'user' 
                  ? 'text-black/70' 
                  : isModal 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
              }`}>
                {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* Pulsante di navigazione per messaggi bot */}
            {m.role === 'bot' && m.navigation && (
              <button
                onClick={() => navigate(m.navigation!.path)}
                className="mt-3 px-4 py-2 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#d4a527] transition-colors"
              >
                {m.navigation.label}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className={`mr-auto px-4 py-3 rounded-2xl animate-pulse ${
            isModal ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-black'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#EEBA2B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>PrimeBot sta scrivendo…</span>
            </div>
          </div>
        )}
        
        {/* Elemento invisibile per lo scroll nella chat normale */}
        {!isModal && <div ref={messagesEndRef} />}
      </div>

      <div className={`p-6 border-t ${isModal ? 'border-[#EEBA2B]/30' : 'border-[#DAA520]'}`}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {questionsToShow.map(q => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                send(q);
              }}
              className={`border transition-colors ${
                isModal 
                  ? 'border-[#EEBA2B]/50 hover:bg-[#EEBA2B]/10 bg-gray-800 text-white text-xs px-2 py-2 rounded-lg'
                  : 'border-[#DAA520] hover:bg-gray-50 bg-white text-black text-sm px-4 py-3 rounded-2xl'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <div className={`flex gap-3 sticky bottom-0 z-50 p-2 rounded-lg border-t-2 ${
          isModal 
            ? 'bg-black border-[#EEBA2B]/30' 
            : 'bg-black border-[#DAA520]'
        }`}>
          <input
            aria-label="Scrivi la tua domanda"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input); }}
            placeholder="Scrivi la tua domanda…"
            className={`flex-1 px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 ${
              isModal
                ? 'bg-gray-800 border-gray-600 focus:ring-[#EEBA2B] text-white placeholder-gray-400'
                : 'bg-white border-[#DAA520] focus:ring-[#DAA520] text-black placeholder-gray-500'
            }`}
          />
          <button
            onClick={() => send(input)}
            className="px-6 py-3 rounded-2xl bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-semibold disabled:opacity-50 transition-colors"
            disabled={loading}
            title="Invia"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
