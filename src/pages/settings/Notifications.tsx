
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved notification preference
    const saved = localStorage.getItem('notificationsEnabled');
    if (saved !== null) {
      setNotificationsEnabled(JSON.parse(saved));
    }
  }, []);

  const handleToggleChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('notificationsEnabled', JSON.stringify(checked));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simula un salvataggio al server (qui potresti chiamare un'API)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Impostazioni notifiche salvate con successo.",
        duration: 3000,
      });
      
      // Naviga automaticamente alla pagina precedente dopo il salvataggio
      navigate('/profile');
    } catch (error) {
      toast({
        title: "Errore nel salvataggio delle notifiche.",
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
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Notifiche</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle" className="text-white">
                Attiva notifiche
              </Label>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={handleToggleChange}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white"
              />
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

export default Notifications;
