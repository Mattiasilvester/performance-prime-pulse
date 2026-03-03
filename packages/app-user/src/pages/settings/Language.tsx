import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { useState } from 'react';

const Language = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  const handleLanguageChange = (newLanguage: 'it' | 'en') => {
    changeLanguage(newLanguage);
    toast.success(newLanguage === 'it' ? 'Lingua cambiata in Italiano' : 'Language changed to English');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simula un salvataggio al server
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Impostazioni lingua salvate con successo');
      
      // Naviga automaticamente alla pagina precedente dopo il salvataggio
      navigate('/profile');
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni lingua');
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
          <h1 className="text-xl font-bold text-[#F0EDE8]">{t('settings.language')}</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96]">Lingua e regione</p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className={labelClass}>Lingua / Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1F] border border-[rgba(255,255,255,0.1)] rounded-[14px]">
                    <SelectItem value="it" className="text-[#F0EDE8] focus:bg-[#1E1E24] focus:text-[#F0EDE8] data-[highlight]:bg-[#1E1E24]">
                      Italiano
                    </SelectItem>
                    <SelectItem value="en" className="text-[#F0EDE8] focus:bg-[#1E1E24] focus:text-[#F0EDE8] data-[highlight]:bg-[#1E1E24]">
                      English
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region" className={labelClass}>Regione / Region</Label>
                <input
                  id="region"
                  type="text"
                  readOnly
                  className={`w-full ${inputClass} cursor-default`}
                  value={language === 'it' ? 'Italia' : 'Italy'}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
            >
              {isLoading ? 'Salvando...' : 'Salva impostazioni'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Language;
