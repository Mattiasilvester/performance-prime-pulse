
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings/privacy')}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        
        <div className="bg-black border-2 border-[#EEBA2B] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Informativa sulla Privacy</h2>
          
          <div className="space-y-6 text-white">
            <div>
              <h3 className="text-lg font-semibold text-[#EEBA2B] mb-3">Raccolta dati</h3>
              <p className="text-sm leading-relaxed">
                In conformità al GDPR, raccogliamo i tuoi dati personali solo previo consenso esplicito e per finalità specifiche quali:
                analisi delle prestazioni, personalizzazione dell'esperienza utente, e miglioramento dei nostri servizi.
                I dati vengono utilizzati esclusivamente per fornire un'esperienza personalizzata e migliorare le funzionalità dell'app.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#EEBA2B] mb-3">Sicurezza dei dati</h3>
              <p className="text-sm leading-relaxed">
                I tuoi dati sono protetti attraverso crittografia avanzata sia durante la trasmissione che nell'archiviazione.
                Implementiamo controlli di accesso rigorosi e conduciamo audit di sicurezza regolari per garantire la massima protezione
                delle tue informazioni personali. Solo il personale autorizzato può accedere ai dati, nel rispetto dei principi di minimizzazione.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
