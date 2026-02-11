/**
 * Pagina di conferma reset password: l’utente arriva qui dopo il click sul link nell’email.
 * Form: nuova password + conferma → supabase.auth.updateUser({ password }) → redirect a login.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MIN_PASSWORD_LENGTH = 8;

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri`);
      return false;
    }
    if (password !== confirmPassword) {
      setError('Le due password non corrispondono');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      toast.success('Password aggiornata!', {
        description: 'Ora puoi accedere con la nuova password'
      });
      navigate('/partner/login', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante l\'aggiornamento della password';
      setError(msg);
      toast.error('Errore', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen partner-theme partner-bg py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Logo in alto */}
        <div className="flex justify-center mb-8">
          <Link to="/partner" className="flex items-center gap-3">
            <img
              src="/images/logo-pp-transparent.png"
              alt="Prime Pro"
              className="w-12 h-12 object-contain"
            />
            <div className="flex flex-col">
              <span className="partner-accent-text text-xl font-bold">
                <span style={{ color: 'var(--partner-primary-foreground)' }}>Prime </span>
                <span style={{ color: '#EEBA2B' }}>Pro</span>
              </span>
              <span className="text-xs partner-muted-text">Per Professionisti</span>
            </div>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold partner-heading mb-2">
            Nuova password
          </h1>
          <p className="text-lg partner-muted-text">
            Inserisci la nuova password e confermala
          </p>
        </div>

        {/* Form Card */}
        <div className="partner-card rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Nuova password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full px-4 py-3 pl-11 pr-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition"
                  placeholder="Minimo 8 caratteri"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Conferma nuova password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full px-4 py-3 pl-11 pr-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition"
                  placeholder="Ripeti la password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  aria-label={showConfirm ? 'Nascondi' : 'Mostra'}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[var(--partner-accent)] to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Aggiornamento...</span>
                </>
              ) : (
                <>
                  <span>Aggiorna password</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/partner/login"
              className="text-sm partner-muted-text hover:partner-accent-text transition-colors inline-flex items-center gap-1"
            >
              ← Torna al login
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/partner"
            className="text-sm partner-muted-text hover:partner-accent-text transition-colors"
          >
            ← Torna alla pagina partner
          </Link>
        </div>
      </div>
    </div>
  );
}
