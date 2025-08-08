import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { vfPatchState, vfInteract, parseVF } from '@/lib/voiceflow';

type Msg = { id: string; role: 'user' | 'bot'; text: string };

export default function PrimeChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Ciao Utente! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const id = user?.id || userId;
      const fullName =
        (user?.user_metadata as any)?.full_name ||
        user?.email?.split('@')[0] ||
        'Performance Prime User';
      const email = user?.email || '';

      setUserId(id);
      setUserName(fullName);
      setUserEmail(email);

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

  return (
    <div className="w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white min-h-[600px]">
      <header className="px-6 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-t-2xl text-black font-semibold">
        AI Coach Prime <span className="text-sm">• Online • Sempre disponibile</span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-300 min-h-[400px]">
        {msgs.map(m => (
          <div
            key={m.id}
            className={`max-w-[85%] px-4 py-3 rounded-2xl ${
              m.role === 'user' ? 'ml-auto bg-yellow-600 text-black' : 'mr-auto bg-white text-black'
            }`}
          >
            {m.text}
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
          {[
            'Come posso migliorare la mia resistenza?',
            'Quale workout è meglio per oggi?',
            'Consigli per la nutrizione pre-allenamento',
            'Come posso raggiungere i miei obiettivi?'
          ].map(q => (
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
