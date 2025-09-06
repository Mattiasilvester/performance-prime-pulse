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
import './RegistrationForm.css';

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
  const [validationResult, setValidationResult] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  // Debounced validation
  const validateEmailDebounced = useCallback(
    debounce(async (emailValue) => {
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
      
      try {
        const result = await emailValidation.validateEmail(emailValue);
        setValidationResult(result);
        
        if (!result.valid) {
          setEmailError(result.errors[0] || 'Email non valida');
        } else if (result.warnings.length > 0) {
          setEmailWarning(result.warnings[0]);
        }
        
        setValidationScore(result.score);
        
        // Log per debug
        
      } catch (error) {
        console.error('Errore validazione:', error);
        setEmailError('Errore durante la validazione');
      } finally {
        setIsValidating(false);
      }
    }, 500),
    []
  );
  
  // Validazione real-time mentre l'utente digita
  useEffect(() => {
    if (email) {
      validateEmailDebounced(email);
    }
  }, [email, validateEmailDebounced]);
  
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
  };
  
  const handleSubmit = async (e) => {
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
      // Validazione finale prima del submit
      const finalValidation = await emailValidation.validateEmail(email);
      
      if (!finalValidation.valid) {
        setEmailError('Email non valida. Utilizzare un indirizzo email reale.');
        setIsSubmitting(false);
        return;
      }
      
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
        toast.error(result.message || 'Errore durante la registrazione. Riprova più tardi.');
      }
      
    } catch (error: any) {
      
      // Gestione errori di rete o sistema
      if (error?.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Problema di connessione. Verifica la tua connessione internet.');
        } else if (error.message.includes('timeout')) {
          toast.error('Timeout della richiesta. Riprova più tardi.');
        } else if (error.message.includes('supabase')) {
          toast.error('Errore del servizio. Riprova più tardi.');
        } else {
          toast.error(`Errore imprevisto: ${error.message}`);
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
  
  // Funzione debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
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
            />
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
            className="w-full"
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
          
          {validationResult && (
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
