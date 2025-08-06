import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getResetPasswordUrl } from '@/shared/config/environments';
import { analytics } from '@/services/analytics';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Traccia login riuscito
      analytics.trackAuth('login');
      
      toast({
        title: "Accesso effettuato con successo!",
        duration: 3000,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Traccia errore login
      analytics.trackError('login_error', {
        error: error.message,
        email: email
      });
      
      toast({
        title: "Errore durante l'accesso",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      // Traccia registrazione riuscita
      analytics.trackAuth('register');
      
      toast({
        title: "Registrazione completata!",
        description: "Controlla la tua email per confermare l'account.",
        duration: 5000,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Traccia errore registrazione
      analytics.trackError('register_error', {
        error: error.message,
        email: email
      });
      
      toast({
        title: "Errore durante la registrazione",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: getResetPasswordUrl(),
      });

      if (error) {
        throw error;
      }

      // Traccia richiesta reset password
      analytics.trackAuth('password_reset');
      
      toast({
        title: "Email di reset inviata!",
        description: "Controlla la tua email per reimpostare la password.",
        duration: 5000,
      });

      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Traccia errore reset password
      analytics.trackError('password_reset_error', {
        error: error.message,
        email: resetEmail
      });
      
      toast({
        title: "Errore durante l'invio",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-surface-primary border-2 border-brand-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-primary">
            Performance Prime
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Accedi o registrati per iniziare il tuo percorso
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-surface-secondary">
              <TabsTrigger value="login" className="text-text-primary data-[state=active]:bg-brand-primary data-[state=active]:text-background">
                Accedi
              </TabsTrigger>
              <TabsTrigger value="register" className="text-text-primary data-[state=active]:bg-brand-primary data-[state=active]:text-background">
                Registrati
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-text-primary">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="la-tua-email@esempio.com"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-text-primary">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la tua password"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary text-background hover:bg-brand-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-text-primary">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="la-tua-email@esempio.com"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-text-primary">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crea una password sicura"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary text-background hover:bg-brand-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-6 border-t border-border-primary">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-text-primary">Reset Password</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email per il reset"
                  className="bg-surface-secondary border-border-primary text-text-primary"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                variant="outline"
                className="w-full border-border-primary text-text-primary hover:bg-surface-secondary"
                disabled={isResetLoading}
              >
                {isResetLoading ? 'Invio in corso...' : 'Invia email di reset'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
