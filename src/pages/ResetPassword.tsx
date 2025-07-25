import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInput } from '@/lib/security';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Verifica se l'utente ha un token valido per il reset
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setHasValidToken(true);
      } else {
        // Se non c'è sessione valida, reindirizza al login
        toast({
          title: "Errore",
          description: "Link di recupero password non valido o scaduto.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    const passwordValidation = validateInput.password(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Errore",
        description: passwordValidation.errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non coincidono.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Successo",
          description: "Password aggiornata con successo! Sarai reindirizzato al login.",
        });
        
        // Reindirizza al login dopo un breve delay
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validateInput.password(value);
    setPasswordErrors(validation.errors);
  };

  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-black border-2 border-pp-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-pp-gold font-black text-3xl">PP</span>
          </div>
          <p className="text-pp-gold">Verifica del token in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-black border-2 border-pp-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-pp-gold font-black text-3xl">PP</span>
          </div>
          <h1 className="text-3xl font-bold text-pp-gold mb-2">Performance Prime</h1>
          <p className="text-pp-gold/80">Reimposta la tua password</p>
        </div>

        <Card className="bg-black border-pp-gold/20 backdrop-blur-sm shadow-2xl border-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-pp-gold">
              Nuova Password
            </CardTitle>
            <CardDescription className="text-pp-gold/80">
              Inserisci la tua nuova password per completare il recupero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-pp-gold">
                  Nuova Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="bg-black border-pp-gold/30 text-pp-gold placeholder:text-pp-gold/50 pr-10 border-2"
                    placeholder="Inserisci la nuova password"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-pp-gold hover:text-pp-gold/80 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.length > 0 && (
                  <div className="text-red-400 text-sm space-y-1 mt-2">
                    {passwordErrors.map((error, index) => (
                      <p key={index}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-pp-gold">
                  Conferma Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black border-pp-gold/30 text-pp-gold placeholder:text-pp-gold/50 pr-10 border-2"
                    placeholder="Conferma la nuova password"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-pp-gold hover:text-pp-gold/80 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-pp-gold text-black hover:bg-black hover:text-pp-gold border-2 border-pp-gold font-semibold"
                disabled={loading}
              >
                {loading ? "Aggiornamento..." : "Aggiorna Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-pp-gold hover:text-pp-gold/80 hover:bg-transparent"
                onClick={() => navigate('/auth')}
              >
                Torna al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;