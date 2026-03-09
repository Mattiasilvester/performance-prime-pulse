import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Info, Send, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInput } from '@/lib/security';

const inputBase =
  'w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-[13px] text-[#F0EDE8] text-[16px] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none transition-colors';
const labelClass = 'block text-xs font-semibold uppercase tracking-[0.5px] text-[#F0EDE8]/50 mb-[7px]';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setCheckingToken(true);
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            toast({
              title: 'Errore',
              description: 'Link di recupero password non valido o scaduto.',
              variant: 'destructive',
            });
            navigate('/auth');
          } else {
            setHasValidToken(true);
          }
        })
        .catch(() => {
          toast({
            title: 'Errore',
            description: 'Link di recupero password non valido o scaduto.',
            variant: 'destructive',
          });
          navigate('/auth');
        })
        .finally(() => setCheckingToken(false));
    } else {
      setCheckingToken(false);
    }
  }, [searchParams, navigate, toast]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
      toast({
        title: 'Email inviata!',
        description: 'Controlla la tua email per reimpostare la password.',
        duration: 5000,
      });
    } catch (err: unknown) {
      toast({
        title: 'Errore durante l\'invio',
        description: err instanceof Error ? err.message : 'Riprova più tardi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordValidation = validateInput.password(password);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Errore',
        description: passwordValidation.errors.join('. '),
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Errore',
        description: 'Le password non coincidono.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: 'Successo',
        description: 'Password aggiornata con successo! Reindirizzamento al login...',
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        navigate('/auth/login');
        timeoutRef.current = null;
      }, 2000);
    } catch (err: unknown) {
      toast({
        title: 'Errore',
        description: err instanceof Error ? err.message : 'Riprova più tardi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
        <p className="text-[#F0EDE8]/50">Verifica del link in corso...</p>
      </div>
    );
  }

  if (hasValidToken) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#F0EDE8]">Imposta nuova password</h1>
            <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
              Inserisci la nuova password per completare il recupero
            </p>
          </div>
          <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className={labelClass}>Nuova Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la nuova password"
                    required
                    disabled={loading}
                    className={`${inputBase} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#F0EDE8]/50 hover:text-[#F0EDE8]"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Conferma Password</label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma la nuova password"
                    required
                    disabled={loading}
                    className={`${inputBase} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#F0EDE8]/50 hover:text-[#F0EDE8]"
                    aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a]"
              >
                {loading ? 'Salvataggio...' : 'Salva nuova password'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-[#F0EDE8]/50 hover:text-[#EEBA2B]"
                onClick={() => navigate('/auth/login')}
              >
                Torna ad Accedi
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-[14px] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#10B981]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0EDE8]">Email inviata!</h1>
            <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
              Controlla la tua casella. Il link scade tra 30 minuti.
            </p>
          </div>
          <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8">
            <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-[10px] p-[13px] text-[13px] text-[#10B981]/90 mb-6">
              Non vedi l&apos;email? Controlla spam o riprova con un altro indirizzo.
            </div>
            <Button
              asChild
              className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a]"
            >
              <Link to="/auth/login">Torna ad Accedi</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F0EDE8]">Recupera la tua password</h1>
          <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
            Ti invieremo un link per reimpostare la password
          </p>
        </div>
        <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8">
          <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] rounded-[10px] p-[13px] flex gap-3 text-[13px] text-blue-300 mb-6">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>Inserisci l&apos;email con cui hai creato l&apos;account.</span>
          </div>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className={labelClass}>Email</label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="la-tua-email@esempio.com"
                required
                disabled={loading}
                className={inputBase}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a] flex items-center justify-center gap-2"
            >
              {loading ? 'Invio in corso...' : 'Invia link di reset'}
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
