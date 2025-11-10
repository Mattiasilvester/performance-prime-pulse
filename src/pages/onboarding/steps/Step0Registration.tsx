import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function Step0Registration() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { nextStep, updateData } = useOnboardingStore();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      confirmPassword: ''
    };

    // Nome
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Il nome deve contenere almeno 2 caratteri';
    }

    // Cognome
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Il cognome deve contenere almeno 2 caratteri';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Inserisci un\'email valida';
    }

    // Password
    if (formData.password.length < 8) {
      newErrors.password = 'La password deve contenere almeno 8 caratteri';
    }

    // Conferma Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGeneralError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setGeneralError(error.message);
        setIsLoading(false);
      }
      // Se successo, Supabase fa redirect automaticamente
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'accesso con Google';
      setGeneralError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('=== SUBMIT STEP 0 DEBUG ===');
    console.log('1. Form data:', formData);
    
    setGeneralError('');

    // Validazione
    const isValid = validateForm();
    console.log('2. Validation result:', isValid);
    
    if (!isValid) {
      console.log('2a. Validation errors:', errors);
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      console.log('3. Calling signUp with:', { email: formData.email.trim(), fullName });
      
      const result = await signUp(formData.email.trim(), formData.password, fullName);
      
      console.log('4. SignUp result:', result);
      
      if (result.success) {
        console.log('5. SignUp successful, calling nextStep...');
        
        // Salva dati nello store onboarding
        updateData({
          nome: fullName,
        });
        
        console.log('6. Data updated in store');

        // Salva anche in localStorage per riferimento
        try {
          localStorage.setItem('pp_registration_data', JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim()
          }));
        } catch (storageError) {
          console.warn('Errore salvataggio localStorage:', storageError);
        }

        // Pulisci form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        console.log('7. Form cleared');

        // Vai allo step successivo
        console.log('8. Calling nextStep()...');
        const currentStepBefore = useOnboardingStore.getState().currentStep;
        console.log('8a. Current step before nextStep:', currentStepBefore);
        
        nextStep();
        
        // Verifica step dopo nextStep
        setTimeout(() => {
          const currentStepAfter = useOnboardingStore.getState().currentStep;
          console.log('8b. Current step after nextStep:', currentStepAfter);
          console.log('8c. Expected step:', currentStepBefore + 1);
        }, 100);
        
        console.log('9. nextStep() called successfully');
      } else {
        console.log('5. SignUp failed:', result.message);
        setGeneralError(result.message || 'Errore durante la registrazione');
      }
    } catch (error: unknown) {
      console.error('ERROR in handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore imprevisto durante la registrazione';
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('=== END SUBMIT DEBUG ===');
    }
  };

  // Validazione in tempo reale per Conferma Password
  useEffect(() => {
    if (formData.confirmPassword && formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Le password non coincidono' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    } else if (formData.confirmPassword && !formData.password) {
      // Se conferma password è compilato ma password è vuoto, non mostrare errore ancora
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Pulisci errore del campo quando l'utente inizia a digitare (tranne per confirmPassword che ha validazione in tempo reale)
    if (errors[field as keyof FormErrors] && field !== 'confirmPassword') {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setGeneralError('');
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="text-5xl mb-4 animate-scale-in" style={{ animationDelay: '0.15s' }}>
          👋
        </div>

        <h2
          className="text-3xl md:text-4xl font-bold text-white mb-3 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          Benvenuto su Performance Prime
        </h2>

        <p
          className="text-lg text-gray-400 animate-fade-in"
          style={{ animationDelay: '0.25s' }}
        >
          Crea il tuo account per iniziare il percorso
        </p>
      </div>

      {/* Form Card */}
      <div
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 animate-scale-in"
        style={{ animationDelay: '0.3s' }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PRIMO: Bottone Google */}
          <div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-white/90 text-black font-semibold h-12 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Accedi con Google
            </Button>
          </div>

          {/* Divisore corretto */}
          <div
            className="relative flex items-center my-6 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-sm text-gray-500">
              oppure continua con email
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Nome e Cognome in grid 2 colonne su desktop */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up"
            style={{ animationDelay: '0.45s' }}
          >
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-400 mb-2 block">
                Nome
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Mario"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                disabled={isLoading}
                required
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1 animate-fade-in">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-400 mb-2 block">
                Cognome
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Rossi"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                disabled={isLoading}
                required
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1 animate-fade-in">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Label htmlFor="email" className="text-sm font-medium text-gray-400 mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="mario.rossi@email.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
              disabled={isLoading}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 animate-fade-in">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="animate-slide-up" style={{ animationDelay: '0.55s' }}>
            <Label htmlFor="password" className="text-sm font-medium text-gray-400 mb-2 block">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 8 caratteri"
                value={formData.password}
                onChange={handleInputChange('password')}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 animate-fade-in">
                {errors.password}
              </p>
            )}
          </div>

          {/* Conferma Password */}
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-400 mb-2 block">
              Conferma Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
              <p className="text-red-500 text-sm mt-1 animate-fade-in">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Messaggio errore generale */}
          {generalError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 animate-slide-down">
              <p className="text-red-500 text-sm">{generalError}</p>
            </div>
          )}

          {/* Bottone Submit */}
          <div className="animate-slide-up" style={{ animationDelay: '0.65s' }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creazione account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continua
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Link login */}
        <div
          className="text-center mt-4 animate-fade-in"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-gray-400">
            Hai già un account?{' '}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-[#FFD700] hover:text-[#FFD700]/80 font-semibold underline underline-offset-2 transition-colors"
            >
              Accedi
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

