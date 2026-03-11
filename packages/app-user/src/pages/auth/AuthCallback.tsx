import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

type Status = 'loading' | 'success' | 'error'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const handledRef = useRef(false)

  useEffect(() => {
    // detectSessionInUrl: true nel client Supabase gestisce già il token dall'URL.
    // Non chiamiamo exchangeCodeForSession manualmente per evitare double-consume.
    // Aspettiamo la sessione tramite onAuthStateChange.

    let timeout: ReturnType<typeof setTimeout>

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Gestiamo sia SIGNED_IN sia INITIAL_SESSION (redirect email confirm può emettere INITIAL_SESSION)
        const isRelevant = (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session
        if (!isRelevant || handledRef.current) return

        handledRef.current = true
        setStatus('success')

        // Stessa logica di LoginPage: onboarding in tabella user_onboarding_responses
        const { data: onboardingData } = await supabase
          .from('user_onboarding_responses')
          .select('onboarding_completed_at')
          .eq('user_id', session.user.id)
          .maybeSingle()

        const onboardingCompleted = !!onboardingData?.onboarding_completed_at

        clearTimeout(timeout)
        subscription.unsubscribe()

        setTimeout(() => {
          navigate(onboardingCompleted ? '/dashboard' : '/onboarding', {
            replace: true,
          })
        }, 1500)
      }
    )

    // Fallback: se dopo 8 secondi non arriva nessuna sessione,
    // link scaduto o token non valido.
    timeout = setTimeout(() => {
      if (handledRef.current) return
      subscription.unsubscribe()
      setStatus('error')
      setTimeout(() => {
        navigate('/auth/login', { replace: true })
      }, 2500)
    }, 8000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0A0A0C' }}
    >
      <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">

        {status === 'loading' && (
          <>
            <div
              className="w-14 h-14 rounded-full border-4 animate-spin"
              style={{
                borderColor: 'rgba(238,186,43,0.2)',
                borderTopColor: '#EEBA2B',
              }}
            />
            <div className="flex flex-col gap-2">
              <p
                className="text-white text-lg font-semibold"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Conferma in corso...
              </p>
              <p className="text-sm" style={{ color: '#8A8A96' }}>
                Stiamo verificando il tuo account
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(238,186,43,0.12)',
                border: '2px solid #EEBA2B',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke="#EEBA2B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <p
                className="text-white text-xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Account confermato! 🎉
              </p>
              <p className="text-sm" style={{ color: '#8A8A96' }}>
                Benvenuto su Performance Prime
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '2px solid #EF4444',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <p
                className="text-white text-xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Link non valido
              </p>
              <p className="text-sm" style={{ color: '#8A8A96' }}>
                Il link è scaduto o già utilizzato.
                <br />
                Torna al login e riprova.
              </p>
              <p className="text-xs mt-1" style={{ color: '#EEBA2B' }}>
                Reindirizzamento in corso...
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
