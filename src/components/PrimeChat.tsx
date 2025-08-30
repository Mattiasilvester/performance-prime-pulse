import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { vfPatchState, vfInteract, parseVF } from '@/lib/voiceflow';
import { fetchUserProfile } from '@/services/userService';

type Msg = { id: string; role: 'user' | 'bot'; text: string };

export default function PrimeChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');
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
      const { texts, choices } = parseVF(traces);

      setMsgs(m => [
        ...m,
        ...texts.map(t => ({ id: crypto.randomUUID(), role: 'bot' as const, text: t })),
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

  return (
    <div className="w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white min-h-[600px]">
      <header className="px-6 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-t-2xl text-black font-semibold">
        PrimeBot <span className="text-sm">• Online • Sempre disponibile</span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-300 min-h-[400px] max-h-[400px]">
        {msgs.map(m => (
                      <div
              key={m.id}
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                m.role === 'user' ? 'ml-auto bg-yellow-600 text-black' : 'mr-auto bg-white text-black'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
        ))}
        {loading && (
          <div className="mr-auto px-4 py-3 rounded-2xl bg-white animate-pulse text-black">
            PrimeBot sta scrivendo…
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#DAA520]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {questionsToShow.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-sm px-4 py-3 rounded-2xl border border-[#DAA520] hover:bg-gray-50 bg-white text-black"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            aria-label="Scrivi la tua domanda"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input); }}
            placeholder="Scrivi la tua domanda…"
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-[#DAA520] focus:outline-none focus:ring-2 focus:ring-[#DAA520] text-black placeholder-gray-500"
          />
          <button
            onClick={() => send(input)}
            className="px-6 py-3 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-black font-semibold disabled:opacity-50"
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
