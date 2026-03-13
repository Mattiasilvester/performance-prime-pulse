import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const inputBase =
  'w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-[13px] text-[#F0EDE8] text-[16px] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none transition-colors';
const labelClass =
  'block text-xs font-semibold uppercase tracking-[0.5px] text-[#F0EDE8]/50 mb-[7px]';

export function Step0Registration() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { nextStep, updateData } = useOnboardingStore();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Il nome deve contenere almeno 2 caratteri';
    }
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Il cognome deve contenere almeno 2 caratteri';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Inserisci un'email valida";
    }
    if (formData.password.length < 8) {
      newErrors.password = 'La password deve contenere almeno 8 caratteri';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGeneralError('');
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setGeneralError(error.message);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Errore durante l'accesso con Google";
      setGeneralError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError('');
    const isValid = validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const result = await signUp(formData.email.trim(), formData.password, fullName);

      if (result.success) {
        updateData({ nome: fullName });
        try {
          localStorage.setItem(
            'pp_registration_data',
            JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(),
            })
          );
        } catch {
          // ignore
        }
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        nextStep();
      } else {
        setGeneralError(result.message || 'Errore durante la registrazione');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Errore imprevisto durante la registrazione';
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.confirmPassword && formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Le password non coincidono' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    } else if (formData.confirmPassword && !formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors] && field !== 'confirmPassword') {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setGeneralError('');
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="max-w-[440px] mx-auto w-full px-4">
      {/* Header — NO icona, solo titolo + sottotitolo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#F0EDE8]">
          Benvenuto su Performance Prime
        </h1>
        <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
          Crea il tuo account per iniziare il percorso
        </p>
      </div>

      {/* Card — stessa struttura di RegisterPage */}
      <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className={labelClass}>Nome</label>
              <Input
                id="firstName"
                type="text"
                placeholder="Mario"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                className={inputBase}
                disabled={isLoading}
                required
              />
              {errors.firstName && (
                <p className="text-[13px] text-[#EF4444] mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>Cognome</label>
              <Input
                id="lastName"
                type="text"
                placeholder="Rossi"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                className={inputBase}
                disabled={isLoading}
                required
              />
              {errors.lastName && (
                <p className="text-[13px] text-[#EF4444] mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <Input
              id="email"
              type="email"
              placeholder="mario.rossi@email.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              className={inputBase}
              disabled={isLoading}
              required
            />
            {errors.email && (
              <p className="text-[13px] text-[#EF4444] mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 8 caratteri"
                value={formData.password}
                onChange={handleInputChange('password')}
                className={`${inputBase} pr-12`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#F0EDE8]/50 hover:text-[#F0EDE8]"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[13px] text-[#EF4444] mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Conferma Password</label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className={`${inputBase} pr-12`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#F0EDE8]/50 hover:text-[#F0EDE8]"
                aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[13px] text-[#EF4444] mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {generalError && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[10px] p-3">
              <p className="text-[13px] text-[#EF4444]">{generalError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#EEBA2B] text-black font-bold text-[15px] rounded-[10px] py-[14px] hover:bg-[#f5c93a] transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Creazione account...
              </>
            ) : (
              <>
                Continua
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[#F0EDE8]/50 text-[15px] mt-6">
          Hai già un account?{' '}
          <button
            type="button"
            onClick={handleGoToLogin}
            className="text-[#EEBA2B] font-semibold hover:underline"
          >
            Accedi
          </button>
        </p>
      </div>
    </div>
  );
}
