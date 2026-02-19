import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PartnerResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('L\'email è obbligatoria');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato email non valido');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'https://pro.performanceprime.it/partner/update-password',
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast.success('Email inviata!', {
        description: 'Controlla la tua casella di posta'
      });
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Errore durante l\'invio dell\'email';
      setError(errorMessage);
      toast.error('Errore', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen partner-theme partner-bg">
      {/* Barra fissa in cima: riempie la safe area (Dynamic Island) — bianco puro per evitare buco nero */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          minHeight: 'env(safe-area-inset-top, 0px)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          backgroundColor: '#FFFFFF',
          zIndex: 50,
        }}
        aria-hidden
      />
      <div
        className="py-12 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)' }}
      >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold partner-heading mb-2">
            {emailSent ? 'Email inviata!' : 'Reimposta password'}
          </h1>
          <p className="text-lg partner-muted-text">
            {emailSent 
              ? 'Controlla la tua casella di posta'
              : 'Inserisci la tua email e ti invieremo un link per reimpostare la password'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="partner-card rounded-2xl p-6 sm:p-8">
          {emailSent ? (
            /* Stato Successo */
            <div className="text-center space-y-6">
              {/* Icona Check */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Messaggio */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Email inviata con successo!
                </h2>
                <p className="text-gray-600 text-sm">
                  Abbiamo inviato un link di reset a{' '}
                  <span className="font-medium text-gray-900">{email}</span>.
                  <br />
                  Controlla la tua casella di posta.
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  💡 Non trovi l'email? Controlla la cartella spam o le email indesiderate.
                </p>
              </div>

              {/* Bottone Torna al Login */}
              <Link
                to="/partner/login"
                className="inline-flex items-center gap-2 w-full justify-center py-3 px-4 bg-gradient-to-r from-[var(--partner-accent)] to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <span>Torna al login</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            /* Form Iniziale */
            <>
              {/* Icona Mail */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[hsl(16_85%_58%_/_0.1)] flex items-center justify-center">
                  <Mail className="w-8 h-8 text-[var(--partner-accent)]" />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
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
                        if (error) setError(null);
                      }}
                      className={`w-full px-4 py-3 pl-11 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition text-base ${
                        error ? 'border-red-300' : 'border-gray-600'
                      }`}
                      style={{ fontSize: '16px' }}
                      placeholder="mario.rossi@example.com"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
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
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <>
                      <span>Invia link di reset</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Link Torna al Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/partner/login"
                  className="text-sm partner-muted-text hover:partner-accent-text transition-colors inline-flex items-center gap-1"
                >
                  ← Torna al login
                </Link>
              </div>
            </>
          )}
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
    </div>
  );
}

