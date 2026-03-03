/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { cn } from '@/lib/utils';

const Security = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
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

  const inputClass = 'bg-[#1A1A1F] border border-[rgba(255,255,255,0.1)] rounded-[14px] text-[#F0EDE8] placeholder:text-[#5C5C66] focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] px-4 py-3';
  const labelClass = 'text-sm font-medium text-[#8A8A96] mb-2';

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6">
      <div className="max-w-md mx-auto w-full pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-[#8A8A96] hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[#F0EDE8]">Password e sicurezza</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96]">Modifica email e password</p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className={labelClass}>Email</Label>
              <Input
                id="email"
                type="email"
                className={cn('border-0', inputClass)}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password" className={labelClass}>Nuova Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={cn('border-0', inputClass, 'pr-10')}
                  placeholder="Inserisci nuova password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-[#8A8A96] hover:text-[#F0EDE8]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-[13px] text-[#EF4444]">{error}</p>
                  ))}
                </div>
              )}
            </div>
            {formData.password !== '••••••••••' && formData.password.length > 0 && (
              <div>
                <Label htmlFor="confirmPassword" className={labelClass}>Conferma Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className={cn('border-0', inputClass, 'pr-10')}
                    placeholder="Conferma la nuova password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-[#8A8A96] hover:text-[#F0EDE8]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password !== formData.confirmPassword && formData.confirmPassword.length > 0 && (
                  <p className="text-[13px] text-[#EF4444] mt-1">Le password non corrispondono</p>
                )}
              </div>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || passwordErrors.length > 0 || (formData.password !== '••••••••••' && formData.password !== formData.confirmPassword)}
              className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
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
