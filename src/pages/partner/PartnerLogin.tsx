import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { professionalAuthService } from '@/services/professionalAuthService';
import { toast } from 'sonner';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Formato email non valido';
      }
    }

    if (!password) {
      newErrors.password = 'La password è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await professionalAuthService.login(email.trim().toLowerCase(), password);
      
      toast.success('Accesso effettuato con successo!', {
        description: 'Bentornato su Performance Prime'
      });

      // Salva rememberMe se necessario
      if (rememberMe) {
        localStorage.setItem('partner_remember_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('partner_remember_email');
      }

      // Redirect a dashboard professionista
      navigate('/partner/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'accesso';
      
      // Gestione errori specifici
      if (errorMessage.includes('Invalid login credentials') || 
          errorMessage.includes('email') || 
          errorMessage.includes('password')) {
        setErrors({ 
          general: 'Email o password non corretti. Controlla le tue credenziali e riprova.' 
        });
        toast.error('Credenziali non valide', {
          description: 'Email o password errati'
        });
      } else if (errorMessage.includes('non trovato') || errorMessage.includes('professionista')) {
        setErrors({ 
          general: 'Account non trovato. Sei sicuro di essere registrato come professionista?' 
        });
        toast.error('Account non trovato', {
          description: 'Verifica di essere registrato come professionista'
        });
      } else {
        setErrors({ 
          general: 'Errore di connessione. Riprova più tardi.' 
        });
        toast.error('Errore di connessione', {
          description: 'Impossibile connettersi al server'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Carica email salvata se rememberMe era attivo
  useEffect(() => {
    const savedEmail = localStorage.getItem('partner_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen partner-theme partner-bg py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold partner-heading mb-2">
            Bentornato
          </h1>
          <p className="text-lg partner-muted-text">
            Accedi al tuo account professionale
          </p>
        </div>

        {/* Form Card */}
        <div className="partner-card rounded-2xl p-6 sm:p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-4 py-3 pl-11 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition ${
                    errors.email ? 'border-red-300' : 'border-gray-600'
                  }`}
                  placeholder="mario.rossi@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.password;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-4 py-3 pl-11 pr-12 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition ${
                    errors.password ? 'border-red-300' : 'border-gray-600'
                  }`}
                  placeholder="Inserisci la tua password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me e Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[var(--partner-accent)] border-gray-300 rounded focus:ring-[var(--partner-accent)]"
                />
                <span className="text-sm text-gray-700">Ricordami</span>
              </label>
              <Link
                to="/partner/reset-password"
                className="text-sm partner-accent-text hover:underline"
              >
                Password dimenticata?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[var(--partner-accent)] to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Accesso in corso...</span>
                </>
              ) : (
                <>
                  <span>Accedi</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">oppure</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Link Registrazione */}
          <div className="text-center">
            <p className="text-sm partner-muted-text">
              Non hai un account?{' '}
              <Link
                to="/partner/registrazione"
                className="partner-accent-text font-semibold hover:underline inline-flex items-center gap-1"
              >
                Registrati
                <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer minimale */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm partner-muted-text hover:partner-accent-text transition-colors"
          >
            ← Torna alla pagina partner
          </Link>
        </div>
      </div>
    </div>
  );
}

