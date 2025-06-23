
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          setFormData({
            nome: profile.name || '',
            cognome: profile.surname || '',
            dataNascita: '' // This would need to be added to the profile schema
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    try {
      await updateUserProfile({
        name: formData.nome,
        surname: formData.cognome,
        birthPlace: formData.dataNascita
      });
      
      toast({
        title: "Informazioni personali aggiornate con successo.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Errore nell'aggiornamento delle informazioni.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-md mx-auto">
          <div className="text-white text-center">Caricamento...</div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Informazioni personali</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-white">Nome</Label>
              <Input
                id="nome"
                type="text"
                className="bg-black border-gray-500 text-white"
                placeholder="Inserisci il tuo nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="cognome" className="text-white">Cognome</Label>
              <Input
                id="cognome"
                type="text"
                className="bg-black border-gray-500 text-white"
                placeholder="Inserisci il tuo cognome"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="data-nascita" className="text-white">Data di nascita</Label>
              <Input
                id="data-nascita"
                type="date"
                className="bg-black border-gray-500 text-white"
                value={formData.dataNascita}
                onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
              />
            </div>
            
            <Button 
              onClick={handleSave}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black"
            >
              Salva modifiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
