
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PersonalInfo = () => {
  const navigate = useNavigate();

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
              />
            </div>
            
            <div>
              <Label htmlFor="cognome" className="text-white">Cognome</Label>
              <Input
                id="cognome"
                type="text"
                className="bg-black border-gray-500 text-white"
                placeholder="Inserisci il tuo cognome"
              />
            </div>
            
            <div>
              <Label htmlFor="data-nascita" className="text-white">Data di nascita</Label>
              <Input
                id="data-nascita"
                type="date"
                className="bg-black border-gray-500 text-white"
              />
            </div>
            
            <Button className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black">
              Salva modifiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
