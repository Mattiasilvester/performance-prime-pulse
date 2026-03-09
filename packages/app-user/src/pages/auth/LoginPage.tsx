import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Accesso effettuato con successo!",
        duration: 3000,
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: onboardingData } = await supabase
        .from('user_onboarding_responses')
        .select('onboarding_completed_at')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!onboardingData?.onboarding_completed_at) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      const err = error as Error
      toast({
        title: "Errore durante l'accesso",
        description: err.message,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) {
        toast({
          title: "Errore durante il login con Google",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (_error: unknown) {
      toast({
        title: "Errore durante il login con Google",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] mx-auto">
        {/* Header — NO icona */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#F0EDE8]">
            Bentornato su Performance Prime
          </h1>
          <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
            Accedi al tuo account per continuare
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8 mt-8">
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-[#1E1E24] border border-white/[0.14] rounded-[10px] py-[14px] font-semibold text-[15px] text-[#F0EDE8] hover:bg-[#1E1E24]/90 hover:border-white/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Accedi con Google
          </Button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-[#F0EDE8]/30">oppure continua con email</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#F0EDE8]/50 mb-[7px]">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua-email@esempio.com"
                className="w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-[13px] text-[#F0EDE8] text-[16px] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none transition-colors"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#F0EDE8]/50 mb-[7px]">
                Password
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la tua password"
                  className="w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-[13px] pr-12 text-[#F0EDE8] text-[16px] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#F0EDE8]/50 hover:text-[#F0EDE8] transition-colors"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/auth/reset-password"
                className="text-[13px] text-[#F0EDE8]/50 hover:text-[#EEBA2B] transition-colors"
              >
                Password dimenticata?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a] transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </form>
        </div>

        <p className="text-center text-[#F0EDE8]/50 text-[15px] mt-6">
          Non hai ancora un account?{' '}
          <Link to="/auth/register" className="text-[#EEBA2B] font-semibold hover:underline">
            Registrati gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
