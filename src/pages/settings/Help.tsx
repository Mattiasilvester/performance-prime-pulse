
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Help = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Simula un'azione di conferma
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Grazie per aver visitato il centro assistenza.",
        duration: 3000,
      });
      
      // Naviga automaticamente alla pagina precedente
      navigate('/profile');
    } catch (error) {
      toast({
        title: "Errore nell'operazione.",
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
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Centro assistenza</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
              <Mail className="h-5 w-5 text-[#EEBA2B]" />
              <div>
                <p className="text-white text-sm">Contattaci via email:</p>
                <a
                  href="mailto:primeassistenza@gmail.com"
                  className="text-[#EEBA2B] font-medium hover:underline"
                >
                  primeassistenza@gmail.com
                </a>
              </div>
            </div>
            
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black disabled:opacity-50"
            >
              {isLoading ? 'Confermando...' : 'Conferma'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
