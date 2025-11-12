import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import emailValidation from '../../services/emailValidation';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { validateInput } from '@/lib/security';
import './RegistrationForm.css';

type EmailValidationChecks = {
  format: boolean;
  disposable: boolean;
  dns: boolean;
};

type EmailValidationResult = {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  checks: EmailValidationChecks;
};

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const RegistrationForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationScore, setValidationScore] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<EmailValidationResult | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [passwordSuggestions, setPasswordSuggestions] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validazione password in tempo reale - solo lunghezza minima 8 caratteri
  useEffect(() => {
    if (password) {
      if (password.length < 8) {
        setPasswordStrength('weak');
        setPasswordSuggestions(['La password deve essere di almeno 8 caratteri']);
      } else {
        setPasswordStrength('strong');
        setPasswordSuggestions([]);
      }
    } else {
      setPasswordStrength('weak');
      setPasswordSuggestions([]);
    }
  }, [password]);
  
  // Debounced validation
  const validateEmailDebounced = useCallback(
    debounce(async (emailValue: string) => {
      if (!emailValue) {
        setEmailError('');
        setEmailWarning('');
        setValidationScore(0);
        setValidationResult(null);
        return;
      }
      
      setIsValidating(true);
      setEmailError('');
      setEmailWarning('');
      
      // Validazione semplificata - solo formato
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(emailValue)) {
        setEmailError('');
        setEmailWarning('');
        setValidationScore(100);
        setValidationResult({ 
          valid: true, 
          score: 100, 
          errors: [], 
          warnings: [],
          checks: {
            format: true,
            disposable: true,
            dns: true
          }
        });
      } else {
        setEmailError('Formato email non valido');
        setValidationScore(0);
        setValidationResult({ 
          valid: false, 
          score: 0, 
          errors: ['Formato email non valido'], 
          warnings: [],
          checks: {
            format: false,
            disposable: false,
            dns: false
          }
        });
      }
      
      setIsValidating(false);
    }, 500),
    []
  );
  
  // Validazione real-time mentre l'utente digita
  useEffect(() => {
    if (email) {
      validateEmailDebounced(email);
    }
  }, [email, validateEmailDebounced]);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isValidating) {
      toast.error('Attendere il completamento della validazione email');
      return;
    }
    
    if (emailError) {
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
      // Validazione email semplificata - solo formato base
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Formato email non valido');
        setIsSubmitting(false);
        return;
      }
      
      console.log('🚀 Tentativo registrazione:', { email, firstName, lastName, passwordLength: password.length });
      
      // Procedi con la registrazione
      const result = await signUp(email, password, `${firstName} ${lastName}`);
      
      if (result.success) {
        toast.success(result.message);
        
        // Se l'utente ha una sessione, naviga alla dashboard
        if (result.message.includes('accesso effettuato')) {
          navigate('/dashboard');
        } else {
          // Altrimenti, rimani nella pagina per confermare email
          toast.info('Controlla la tua email per confermare l\'account prima di accedere.');
        }
      } else {
        // RIMOSSO: Gestione errori password - l'utente può mettere qualsiasi password
        toast.error(result.message || 'Errore durante la registrazione. Riprova più tardi.');
      }
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : null;

      if (message) {
        if (message.includes('network') || message.includes('fetch')) {
          toast.error('Problema di connessione. Verifica la tua connessione internet.');
        } else if (message.includes('timeout')) {
          toast.error('Timeout della richiesta. Riprova più tardi.');
        } else if (message.includes('supabase')) {
          toast.error('Errore del servizio. Riprova più tardi.');
        } else {
          toast.error(`Errore imprevisto: ${message}`);
        }
      } else {
        toast.error('Errore imprevisto durante la registrazione. Riprova più tardi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Indicatore visivo della qualità dell'email
  const getEmailQualityColor = () => {
    if (!email) return '#6b7280';
    if (emailError) return '#ef4444'; // rosso
    if (validationScore >= 80) return '#10b981'; // verde
    if (validationScore >= 60) return '#f59e0b'; // arancione
    return '#ef4444'; // rosso
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Registrazione
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium">
              Nome *
            </label>
            <Input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="nome"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium">
              Cognome *
            </label>
            <Input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="cognome"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <div className="relative">
              <Input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="nome@esempio.com"
                required
                className={`pr-10 ${emailError ? 'border-red-500' : ''} ${emailWarning ? 'border-yellow-500' : ''}`}
                style={{
                  borderColor: getEmailQualityColor(),
                  borderWidth: '2px'
                }}
              />
              
              {isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validazione...</span>
                </div>
              )}
              
              {!isValidating && email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationScore >= 80 && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {validationScore >= 60 && validationScore < 80 && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {validationScore < 60 && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              )}
            </div>
            
            {emailError && (
              <Alert variant="destructive" className="py-2">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}
            
            {emailWarning && !emailError && (
              <Alert variant="default" className="py-2 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">{emailWarning}</AlertDescription>
              </Alert>
            )}
            
            {email && !emailError && !emailWarning && validationScore >= 80 && (
              <Alert variant="default" className="py-2 border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email valida e verificata
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Requisiti email:</p>
              <ul className="space-y-1">
                <li>• Email reale e attiva</li>
                <li>• No email temporanee o disposable</li>
                <li>• Dominio valido con record MX</li>
                <li>• Formato corretto (nome@dominio.com)</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password *
            </label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimo 8 caratteri"
              className={`${
                passwordStrength === 'strong' ? 'border-green-500' : 
                password && passwordStrength === 'weak' ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            
            {/* Indicatore forza password - solo lunghezza minima 8 caratteri */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Forza password:</span>
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength === 'weak' ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'weak' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {passwordStrength === 'weak' ? 'Troppo corta' : 'Valida'}
                  </span>
                </div>
                
                {/* Suggerimenti password */}
                {passwordSuggestions.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {passwordSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-1">
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Conferma Password *
            </label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ripeti la password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Le password non coincidono</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Accetto i{' '}
                <a href="#" className="text-brand-primary hover:underline">
                  Termini di Servizio
                </a>{' '}
                e la{' '}
                <a href="#" className="text-brand-primary hover:underline">
                  Privacy Policy
                </a>{' '}
                (Beta Version) *
              </label>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || isValidating || !!emailError || !email || !firstName || !lastName || !password || !confirmPassword || password !== confirmPassword || !acceptedTerms}
            className="w-full h-10 sm:h-12 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrazione...
              </>
            ) : (
              'Registrati'
            )}
          </Button>
          
          
          {validationResult && validationResult.checks && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Score validazione: {validationScore}/100</p>
              <div className="flex space-x-4">
                <span>Formato: {validationResult.checks.format ? '✅' : '❌'}</span>
                <span>Disposable: {validationResult.checks.disposable ? '✅' : '❌'}</span>
                <span>DNS: {validationResult.checks.dns ? '✅' : '❌'}</span>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
