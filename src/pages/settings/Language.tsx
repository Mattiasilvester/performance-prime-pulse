
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Language = () => {
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
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Lingua e regione</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="language" className="text-white">Lingua</Label>
              <Select>
                <SelectTrigger className="bg-black border-gray-500 text-white">
                  <SelectValue placeholder="Seleziona lingua" />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-500">
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="region" className="text-white">Regione</Label>
              <Input
                id="region"
                type="text"
                className="bg-black border-gray-500 text-white"
                value="Italia"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Language;
