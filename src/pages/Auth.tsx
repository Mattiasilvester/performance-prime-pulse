
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast.success('Accesso effettuato con successo!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Errore durante il login:', error);
      toast.error(error.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Inserisci la tua email per recuperare la password');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Email per il recupero password inviata! Controlla la tua casella di posta.');
      setShowResetPassword(false);
    } catch (error: any) {
      console.error('Errore durante il recupero password:', error);
      toast.error(error.message || 'Errore durante il recupero password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black border-pp-gold border-2 shadow-xl shadow-pp-gold/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-black border-2 border-pp-gold rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-pp-gold font-bold text-2xl">PP</span>
          </div>
          <CardTitle className="text-2xl font-bold text-pp-gold">
            {showResetPassword ? 'Recupera Password' : 'Accedi'}
          </CardTitle>
          <CardDescription className="text-pp-gold/80">
            {showResetPassword 
              ? 'Inserisci la tua email per ricevere il link di recupero'
              : 'Entra nel tuo account Performance Prime'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={showResetPassword ? handleResetPassword : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-pp-gold font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-black border-pp-gold border-2 text-pp-gold placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
              />
            </div>

            {!showResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-pp-gold font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="inserisci la tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-black border-pp-gold border-2 text-pp-gold placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-pp-gold text-black hover:bg-black hover:text-pp-gold border-2 border-pp-gold font-bold transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'Caricamento...' : (showResetPassword ? 'Invia Email' : 'Accedi')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setShowResetPassword(!showResetPassword)}
              disabled={loading}
              className="text-sm text-pp-gold hover:text-pp-gold/80 font-medium"
            >
              {showResetPassword ? 'Torna al login' : 'Recupera password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
