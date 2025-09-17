import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { vfPatchState, vfInteract, parseVF } from '@/lib/voiceflow';
import { fetchUserProfile } from '@/services/userService';

type Msg = { 
  id: string; 
  role: 'user' | 'bot'; 
  text: string; 
  navigation?: { 
    path: string; 
    label: string; 
    action: string; 
  }; 
};

interface PrimeChatProps {
  isModal?: boolean;
}

export default function PrimeChat({ isModal = false }: PrimeChatProps) {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');

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

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

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
        
        setMsgs([welcomeMessage]);
      } else {
        // Utente esistente - messaggio normale
        setMsgs([{
          id: 'welcome',
          role: 'bot',
          text: `Ciao ${fullName} 👋! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
        }]);
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

    setMsgs(m => [...m, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    // Marca utente come onboardato dopo la prima interazione
    if (isNewUser) {
      localStorage.setItem(`user_onboarded_${userId}`, 'true');
      setIsNewUser(false);
    }

    try {
      const traces = await vfInteract(userId, trimmed);
      const { texts, choices, navigation } = parseVF(traces);

      setMsgs(m => [
        ...m,
        ...texts.map(t => ({ 
          id: crypto.randomUUID(), 
          role: 'bot' as const, 
          text: t,
          navigation: navigation || undefined
        })),
        ...(choices.length
          ? [{
              id: crypto.randomUUID(),
              role: 'bot' as const,
              text: choices.map(c => `• ${c}`).join('\n')
            }]
          : [])
      ]);
    } catch (e) {
      setMsgs(m => [
        ...m,
        { id: crypto.randomUUID(), role: 'bot', text: 'Ops, connessione instabile. Riprova tra qualche secondo.' }
      ]);
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

  // Landing page quando non ci sono messaggi
  if (msgs.length === 0) {
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
              const welcomeMsg = {
                id: 'welcome',
                role: 'bot' as const,
                text: `Ciao ${userName} 👋! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
              };
              setMsgs([welcomeMsg]);
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
