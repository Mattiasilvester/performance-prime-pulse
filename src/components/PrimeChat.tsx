import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getAIResponse } from '@/lib/openai-service';
import { getPrimeBotFallbackResponse } from '@/lib/primebot-fallback';
import { fetchUserProfile } from '@/services/userService';
import { usePrimeBot } from '@/contexts/PrimeBotContext';
import {
  getOrCreateSessionId,
  saveInteraction,
  type PrimeBotInteraction,
} from '@/services/primebotConversationService';

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
  isModal?: boolean;
}

// Funzione per formattare markdown senza librerie
const renderFormattedMessage = (text: string) => {
  if (!text) return null;
  
  // Splitta per ** e processa
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Grassetto
      return <strong key={index} className="font-bold text-yellow-400">
        {part.slice(2, -2)}
      </strong>;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      // Corsivo
      return <em key={index} className="italic">
        {part.slice(1, -1)}
      </em>;
    }
    // Testo normale
    return <span key={index}>{part}</span>;
  });
};

export default function PrimeChat({ isModal = false }: PrimeChatProps) {
  const navigate = useNavigate();
  const { setIsFullscreen } = usePrimeBot();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>('guest-' + crypto.randomUUID());
  const [userName, setUserName] = useState<string>('Performance Prime User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Voiceflow rimosso - ora usa solo OpenAI
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

  // Focus automatico quando si apre la chat
  useEffect(() => {
    if (hasStartedChat && msgs.length > 0) {
      setTimeout(() => {
        const inputElement = document.querySelector('input[aria-label="Scrivi la tua domanda"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          console.log('🎯 FOCUS AUTOMATICO APPLICATO VIA useEffect');
        }
      }, 200);
    }
  }, [hasStartedChat, msgs.length]);

  useEffect(() => {
    console.log('useEffect PRINCIPALE: INIZIO');
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const id = user?.id || userId;
        
        // Usa il servizio userService per ottenere il nome utente
        let userProfile;
        let fullName = 'Utente';
        let email = '';
        
        try {
          userProfile = await fetchUserProfile();
          fullName = userProfile?.name || 'Utente';
          email = user?.email || '';
        } catch (e) {
          console.warn('Error fetching user profile:', e);
          fullName = 'Utente';
        }

        setUserId(id);
        setUserName(fullName);
        setUserEmail(email);
        
        console.log('useEffect PRINCIPALE: setUserId, setUserName, setUserEmail');

        // Recupera o crea session ID per la conversazione
        try {
          const currentSessionId = await getOrCreateSessionId(id);
          setSessionId(currentSessionId);
          console.log('✅ Session ID recuperato/creato:', currentSessionId.substring(0, 8) + '...');
        } catch (sessionError) {
          console.warn('⚠️ Errore recupero session ID (continuo comunque):', sessionError);
          // Continua senza session ID se il recupero fallisce
        }

        // Controlla se è un nuovo utente
        const userOnboarded = localStorage.getItem(`user_onboarded_${id}`);
        const isFirstVisit = !sessionStorage.getItem(`first_visit_${id}`);
        
        if (!userOnboarded && isFirstVisit) {
          setIsNewUser(true);
          sessionStorage.setItem(`first_visit_${id}`, 'true');
        }
        
        // NON aggiungere messaggi automaticamente - mostra sempre la Landing Page inizialmente
        // I messaggi vengono gestiti solo dal bottone "Inizia Chat"
        console.log('useEffect PRINCIPALE: FINE - non aggiungo messaggi automaticamente');

        // Voiceflow rimosso - ora usa solo OpenAI
      } catch (error) {
        console.error('Error in PrimeChat useEffect:', error);
        // NON aggiungere messaggi automaticamente - mantieni la Landing Page
        // I messaggi vengono gestiti solo dal bottone "Inizia Chat"
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

    // Assicurati di avere un sessionId (recupera/crea se necessario)
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        currentSessionId = await getOrCreateSessionId(userId);
        setSessionId(currentSessionId);
        console.log('✅ Session ID creato durante send:', currentSessionId.substring(0, 8) + '...');
      } catch (sessionError) {
        console.warn('⚠️ Errore creazione session ID (continuo comunque):', sessionError);
        // Continua senza session ID se il recupero fallisce
      }
    }

    try {
      // PRIMA: Controlla se esiste una risposta preimpostata
      const presetResponse = getPrimeBotFallbackResponse(trimmed);
      
      if (presetResponse) {
        console.log('🎯 Risposta preimpostata trovata:', presetResponse);
        
        // Crea il messaggio con la risposta preimpostata
        const message: Msg = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: presetResponse.text
        };
        
        // Se c'è un'azione (bottone), aggiungi la navigazione
        if (presetResponse.action) {
          message.navigation = {
            path: presetResponse.action.link,
            label: presetResponse.action.label,
            action: 'navigate'
          };
        }
        
        setMsgs(m => [...m, message]);
        
        // Salva anche le risposte preimpostate su database (se abbiamo sessionId)
        if (currentSessionId && userId && !userId.startsWith('guest-')) {
          try {
            const interaction: PrimeBotInteraction = {
              user_id: userId,
              session_id: currentSessionId,
              message_content: trimmed,
              bot_response: presetResponse.text,
              interaction_type: 'text',
              user_context: {
                page: window.location.pathname,
                is_preset_response: true,
              },
            };
            await saveInteraction(interaction);
            console.log('✅ Risposta preimpostata salvata su database');
          } catch (saveError) {
            console.warn('⚠️ Errore salvataggio risposta preimpostata (continuo comunque):', saveError);
            // Non bloccare il flusso se il salvataggio fallisce
          }
        }
        
        setLoading(false);
        return;
      }
      
      // SECONDO: Se non c'è risposta preimpostata, usa l'AI
      console.log('🤖 Nessuna risposta preimpostata, uso AI');
      const aiResponse = await getAIResponse(trimmed, userId, currentSessionId || undefined);
      
      if (aiResponse.success) {
        setMsgs(m => [
          ...m,
          { 
            id: crypto.randomUUID(), 
            role: 'bot' as const, 
            text: aiResponse.message
          }
        ]);
      } else {
        setMsgs(m => [
          ...m,
          { 
            id: crypto.randomUUID(), 
            role: 'bot' as const, 
            text: aiResponse.message
          }
        ]);
      }
    } catch (e) {
      console.error('Errore chiamata OpenAI:', e);
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

  // DEBUG: Console.log per verificare lo stato
  console.log('RENDER: hasStartedChat =', hasStartedChat);
  console.log('RENDER: msgs.length =', msgs.length);
  console.log('RENDER: msgs =', msgs);

  // FIX NAVIGAZIONE: Mostra Landing Page solo se non ha iniziato la chat
  if (!hasStartedChat) {
    console.log('MOSTRO LANDING PAGE');
    return (
      <div className={`w-full h-full flex flex-col rounded-2xl border border-[#DAA520] bg-black text-white ${hasStartedChat ? 'min-h-[700px]' : 'min-h-[600px] mb-4 pb-2'}`}>
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
          
          {/* Bottone Inizia Chat - FIX NAVIGAZIONE */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🚀 BOTTONE CLICCATO!');
              console.log('PRIMA CLICK: hasStartedChat =', hasStartedChat);
              console.log('PRIMA CLICK: msgs =', msgs);
              
              setHasStartedChat(true);
              setIsFullscreen(true); // Imposta fullscreen quando inizia la chat
              setMsgs([
                {
                  id: 'disclaimer',
                  role: 'bot' as const,
                  text: 'Disclaimer: Questo è un assistente AI per scopi informativi. Consulta sempre un professionista per consigli medici specifici.',
                  isDisclaimer: true
                },
                {
                  id: 'welcome',
                  role: 'bot' as const,
                  text: `Ciao ${userName} 👋! Sono PrimeBot, il tuo AI Coach personale. Come posso aiutarti oggi con il tuo allenamento?`
                }
              ]);
              
              // Focus automatico al campo di input dopo un breve delay
              setTimeout(() => {
                const inputElement = document.querySelector('input[aria-label="Scrivi la tua domanda"]') as HTMLInputElement;
                if (inputElement) {
                  inputElement.focus();
                  console.log('🎯 FOCUS AUTOMATICO APPLICATO AL CAMPO INPUT');
                }
              }, 100);
              
              console.log('DOPO CLICK: hasStartedChat dovrebbe essere true');
              console.log('DOPO CLICK: msgs dovrebbe avere 2 messaggi');
            }}
            onMouseDown={(e) => e.stopPropagation()} // BLOCCA ANCHE MOUSEDOWN
            onMouseUp={(e) => e.stopPropagation()}   // BLOCCA ANCHE MOUSEUP
            className="px-8 py-4 bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-bold rounded-xl transition-colors text-lg"
            type="button"
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

  // Chat Interface - FIX FULLSCREEN E EVENT BUBBLING
  console.log('MOSTRO CHAT INTERFACE');
  
  // Chat Interface - quando hasStartedChat = true
  if (hasStartedChat) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center px-4 py-3 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black font-semibold">
          <button
            onClick={() => {
              setHasStartedChat(false);
              setMsgs([]);
              setIsFullscreen(false); // Reset fullscreen quando si chiude la chat
            }}
            className="text-xl hover:opacity-70"
            title="Torna a PrimeBot"
          >
            ←
          </button>
          <span className="font-bold ml-4">PrimeBot</span>
          <span className="text-sm ml-2">• Online • Sempre disponibile</span>
        </header>

        {/* Area Messaggi - con spazio sopra */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-4 py-16 space-y-4">
            {msgs.map(m => (
              <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-[#EEBA2B] text-black'
                    : (m as any).isDisclaimer 
                      ? 'bg-red-900 text-red-100 border border-red-600 text-sm font-semibold'
                      : 'bg-gray-800 text-white border border-gray-600'
                }`}>
                  {(m as any).isDisclaimer && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>⚠️ AVVISO IMPORTANTE</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {renderFormattedMessage(m.text)}
                  </div>
                  
                  {/* Bottone di navigazione per messaggi bot */}
                  {m.role === 'bot' && m.navigation && (
                    <button
                      onClick={() => navigate(m.navigation!.path)}
                      className="mt-3 w-full px-4 py-2 bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {m.navigation.label}
                      <span>→</span>
                    </button>
                  )}
                  
                  <div className={`text-xs mt-2 ${m.role === 'user' ? 'text-black/70' : 'text-white'}`}>
                    {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto px-4 py-3 rounded-2xl bg-gray-800 text-white border border-gray-600">
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
        </div>

        {/* Area Bottom - Quick Replies + Input */}
        <div className="flex-shrink-0 border-t border-[#DAA520]/30 bg-black">
          {/* Quick Replies */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {questionsToShow.map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); send(q); }}
                  className="border border-[#DAA520] hover:bg-[#EEBA2B]/10 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <input
                aria-label="Scrivi la tua domanda"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(input); }}
                placeholder="Scrivi la tua domanda…"
                className="flex-1 px-4 py-3 rounded-2xl border border-[#DAA520] focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] bg-gray-800 text-white placeholder-gray-400"
              />
              <button
                onClick={() => send(input)}
                className="px-6 py-3 rounded-2xl bg-[#EEBA2B] hover:bg-[#d4a527] text-black font-semibold disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT NORMALE (non fullscreen)
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-[#DAA520] bg-black text-white min-h-[600px] mb-4 pb-2 md:max-w-4xl sm:max-w-full sm:mx-2">
      <header className="px-6 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-t-2xl text-black font-semibold">
        PrimeBot <span className="text-sm">• Online • Sempre disponibile</span>
      </header>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-black min-h-[400px] max-h-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {msgs.map(m => (
            <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-[#EEBA2B] text-black' // Giallo per utente
                    : (m as any).isDisclaimer 
                      ? 'bg-red-900 text-red-100 border border-red-600 text-sm font-semibold' // Rosso per disclaimer
                      : 'bg-gray-800 text-white border border-gray-600' // Grigio scuro per bot
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {(m as any).isDisclaimer && (
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-200 font-bold">⚠️ AVVISO IMPORTANTE</span>
                    </div>
                  )}
                  {renderFormattedMessage(m.text)}
                </div>
                
                {/* Timestamp sotto ogni messaggio */}
                <div className={`text-xs mt-2 ${
                  m.role === 'user' 
                    ? 'text-black/70' 
                    : 'text-white'
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
            <div className="mr-auto px-4 py-3 rounded-2xl animate-pulse bg-gray-800 text-white border border-gray-600">
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
      </div>

      <div className="p-6 border-t border-[#DAA520]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {questionsToShow.map(q => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                send(q);
              }}
              className="border border-[#DAA520] hover:bg-[#EEBA2B]/10 bg-gray-800 text-white text-sm px-4 py-3 rounded-2xl transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
