
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateInput, sanitizeText } from '@/lib/security';

const Security = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '••••••••••',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    
    if (password && password !== '••••••••••') {
      const validation = validateInput.password(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleConfirmPasswordChange = (confirmPassword: string) => {
    setFormData({ ...formData, confirmPassword });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate email
      if (formData.email !== user?.email) {
        if (!validateInput.email(formData.email)) {
          throw new Error('Email non valida');
        }
        const sanitizedEmail = sanitizeText(formData.email);
        const { error: emailError } = await supabase.auth.updateUser({
          email: sanitizedEmail
        });
        if (emailError) throw emailError;
      }

      // Validate password
      if (formData.password !== '••••••••••' && formData.password.length > 0) {
        const passwordValidation = validateInput.password(formData.password);
        if (!passwordValidation.isValid) {
          throw new Error('Password non sicura: ' + passwordValidation.errors.join(', '));
        }
        
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Le password non corrispondono');
        }
        
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });
        if (passwordError) throw passwordError;
      }

      toast({
        title: "Credenziali aggiornate con successo.",
        duration: 3000,
      });
      
      // Reset password fields
      setFormData({ ...formData, password: '••••••••••', confirmPassword: '' });
      setPasswordErrors([]);
    } catch (error: any) {
      toast({
        title: error.message || "Errore nell'aggiornamento delle credenziali.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        
        <div className="bg-black border-2 border-[#EEBA2B] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Password e sicurezza</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-black border-gray-500 text-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="bg-black border-gray-500 text-white pr-10"
                  placeholder="Inserisci nuova password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-400">{error}</p>
                  ))}
                </div>
              )}
            </div>
            
            {formData.password !== '••••••••••' && formData.password.length > 0 && (
              <div>
                <Label htmlFor="confirmPassword" className="text-white">Conferma Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="bg-black border-gray-500 text-white pr-10"
                    placeholder="Conferma la nuova password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password !== formData.confirmPassword && formData.confirmPassword.length > 0 && (
                  <p className="text-sm text-red-400 mt-1">Le password non corrispondono</p>
                )}
              </div>
            )}
            
            <Button 
              onClick={handleSave}
              disabled={isLoading || passwordErrors.length > 0 || (formData.password !== '••••••••••' && formData.password !== formData.confirmPassword)}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Modifica credenziali'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
