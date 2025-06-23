
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Notifications = () => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
        </div>
      </div>
    </div>
  );
};

export default Notifications;
