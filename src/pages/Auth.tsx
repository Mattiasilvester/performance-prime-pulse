import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email.trim(),
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
        // Reset form
        setRegisterData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Errore durante la registrazione:', error);
      toast.error(error.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      toast.error('Inserisci la tua email per recuperare la password');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
        redirectTo: 'https://76fb77d7-848e-47a8-9377-c4c9eb88c0fd.lovableproject.com/reset-password',
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
          <CardTitle className="text-2xl font-bold text-pp-gold">Performance Prime</CardTitle>
          <CardDescription className="text-pp-gold/80">
            Accedi o registrati per iniziare il tuo percorso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-pp-gold font-medium">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="inserisci la tua email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-pp-gold text-black hover:bg-black hover:text-pp-gold border-2 border-pp-gold font-bold transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Caricamento...' : 'Invia Email'}
              </Button>
              <Button
                variant="link"
                onClick={() => setShowResetPassword(false)}
                disabled={loading}
                className="w-full text-sm text-pp-gold hover:text-pp-gold/80 font-medium"
              >
                Torna al login
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black border border-pp-gold">
                <TabsTrigger 
                  value="login" 
                  className="text-pp-gold data-[state=active]:bg-pp-gold data-[state=active]:text-black"
                >
                  Accedi
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="text-pp-gold data-[state=active]:bg-pp-gold data-[state=active]:text-black"
                >
                  Registrati
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-pp-gold font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="inserisci la tua email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-pp-gold font-medium">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="inserisci la tua password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-pp-gold text-black hover:bg-black hover:text-pp-gold border-2 border-pp-gold font-bold transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading ? 'Caricamento...' : 'Accedi'}
                  </Button>
                </form>
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setShowResetPassword(true)}
                    disabled={loading}
                    className="text-sm text-pp-gold hover:text-pp-gold/80 font-medium"
                  >
                    Recupera password
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-pp-gold font-medium">Nome</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Nome"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                        required
                        disabled={loading}
                        className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-pp-gold font-medium">Cognome</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Cognome"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                        required
                        disabled={loading}
                        className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-pp-gold font-medium">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="inserisci la tua email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-pp-gold font-medium">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="crea una password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-pp-gold font-medium">Conferma Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="conferma la password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-black border-pp-gold border-2 text-white placeholder:text-pp-gold/50 focus:ring-pp-gold focus:border-pp-gold"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-pp-gold text-black hover:bg-black hover:text-pp-gold border-2 border-pp-gold font-bold transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading ? 'Caricamento...' : 'Registrati'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
