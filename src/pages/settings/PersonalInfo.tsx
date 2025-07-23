
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: null as Date | null
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          setFormData({
            nome: profile.name || '',
            cognome: profile.surname || '',
            dataNascita: null // This would need to be added to the profile schema
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
        birthPlace: formData.dataNascita ? format(formData.dataNascita, 'yyyy-MM-dd') : ''
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-black border-gray-500 text-white hover:bg-gray-900 hover:text-white",
                      !formData.dataNascita && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataNascita ? format(formData.dataNascita, "dd/MM/yyyy") : <span>Seleziona data di nascita</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black border-[#EEBA2B]" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dataNascita}
                    onSelect={(date) => setFormData({ ...formData, dataNascita: date })}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    defaultMonth={new Date(1990, 0)} // Inizia da gennaio 1990
                    className={cn("p-3 pointer-events-auto")}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-white",
                      caption_label: "text-sm font-medium text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-[#EEBA2B]/20 text-white hover:text-[#EEBA2B]",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#EEBA2B] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal text-white hover:bg-[#EEBA2B]/20 hover:text-[#EEBA2B] aria-selected:opacity-100",
                      day_selected: "bg-[#EEBA2B] text-black hover:bg-[#EEBA2B] hover:text-black focus:bg-[#EEBA2B] focus:text-black",
                      day_today: "bg-gray-800 text-white",
                      day_outside: "text-gray-600 opacity-50",
                      day_disabled: "text-gray-600 opacity-50",
                      day_range_middle: "aria-selected:bg-[#EEBA2B] aria-selected:text-black",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
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
