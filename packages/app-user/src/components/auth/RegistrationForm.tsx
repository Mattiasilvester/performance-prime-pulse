import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { validateInput } from '@/lib/security';

function debounce<A extends unknown[]>(func: (...args: A) => void | Promise<void>, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => void func(...args), wait);
  };
}

const RegistrationForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateEmailDebounced = useCallback(
    debounce(async (emailValue: string) => {
      if (!emailValue) {
        setEmailError('');
        setIsValidating(false);
        return;
      }
      setIsValidating(true);
      setEmailError('');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(emailValue)) {
        setEmailError('');
      } else {
        setEmailError('Formato email non valido');
      }
      setIsValidating(false);
    }, 500),
    []
  );

  useEffect(() => {
    if (email) validateEmailDebounced(email);
  }, [email, validateEmailDebounced]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValidating || emailError) {
      toast.error('Correggere gli errori prima di procedere');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    if (password.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Devi accettare i Termini di Servizio e la Privacy Policy per continuare');
      return;
    }

    setIsSubmitting(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Formato email non valido');
        setIsSubmitting(false);
        return;
      }

      const result = await signUp(email, password, `${firstName} ${lastName}`);

      if (result.success) {
        toast.success(result.message);
        if (result.message.includes('accesso effettuato')) {
          navigate('/dashboard');
        } else {
          toast.info("Controlla la tua email per confermare l'account prima di accedere.");
        }
      } else {
        toast.error(result.message || 'Errore durante la registrazione. Riprova più tardi.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : null;
      if (message) {
        if (message.includes('network') || message.includes('fetch')) {
          toast.error('Problema di connessione. Verifica la tua connessione internet.');
        } else {
          toast.error(`Errore: ${message}`);
        }
      } else {
        toast.error('Errore imprevisto durante la registrazione. Riprova più tardi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-[13px] text-[#F0EDE8] text-[16px] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold uppercase tracking-[0.5px] text-[#F0EDE8]/50 mb-[7px]';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>Nome</label>
          <Input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Nome"
            className={inputBase}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Cognome</label>
          <Input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Cognome"
            className={inputBase}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@esempio.com"
          required
          className={`${inputBase} ${emailError ? 'border-red-500/50' : ''}`}
          disabled={isSubmitting}
        />
        {emailError && <p className="text-[13px] text-[#EF4444] mt-1">{emailError}</p>}
        {isValidating && <p className="text-[13px] text-[#F0EDE8]/50 mt-1">Validazione...</p>}
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimo 8 caratteri"
            className={`${inputBase} pr-12`}
            disabled={isSubmitting}
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
        {password.length > 0 && password.length < 8 && (
          <p className="text-[13px] text-[#EF4444] mt-1">La password deve essere di almeno 8 caratteri</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClass}>Conferma Password</label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Ripeti la password"
            className={`${inputBase} pr-12`}
            disabled={isSubmitting}
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
        {confirmPassword && password !== confirmPassword && (
          <p className="text-[13px] text-[#EF4444] mt-1">Le password non coincidono</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/[0.14] bg-[#1E1E24] text-[#EEBA2B] focus:ring-[#EEBA2B]/20"
          required
        />
        <label htmlFor="terms" className="text-[13px] text-[#F0EDE8]/70">
          Accetto i{' '}
          <Link to="/terms-and-conditions" className="text-[#EEBA2B] hover:underline">Termini di Servizio</Link>
          {' '}e la{' '}
          <Link to="/privacy-policy" className="text-[#EEBA2B] hover:underline">Privacy Policy</Link>
          {' '}*
        </label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || isValidating || !!emailError || !email || !firstName || !lastName || !password || !confirmPassword || password !== confirmPassword || !acceptedTerms}
        className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a] transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Registrazione...
          </>
        ) : (
          <>
            Crea Account
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );
};

export default RegistrationForm;
