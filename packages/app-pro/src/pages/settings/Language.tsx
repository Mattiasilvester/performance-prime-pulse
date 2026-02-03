
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

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <div className="bg-surface-primary border-2 border-[#EEBA2B] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">{t('settings.language')}</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-white">Lingua / Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="bg-surface-secondary border-gray-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-secondary border-gray-500">
                    <SelectItem value="it" className="text-white hover:bg-gray-800 focus:bg-gray-800">
                      Italiano
                    </SelectItem>
                    <SelectItem value="en" className="text-white hover:bg-gray-800 focus:bg-gray-800">
                      English
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="region" className="text-white">Regione / Region</Label>
                <input
                  id="region"
                  type="text"
                  className="w-full h-10 px-3 py-2 bg-surface-secondary border border-gray-500 text-white rounded-md"
                  value={language === 'it' ? 'Italia' : 'Italy'}
                  readOnly
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black disabled:opacity-50"
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
