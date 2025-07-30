
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { validateInput, sanitizeText, authRateLimiter } from '@/lib/security';
import { toast } from 'sonner';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onObjectiveCreated?: () => void;
}

export const ObjectiveModal = ({ isOpen, onClose, onObjectiveCreated }: ObjectiveModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    } else if (!validateInput.textLength(title, 100)) {
      newErrors.title = 'Il titolo non può superare i 100 caratteri';
    } else if (!validateInput.noScriptTags(title)) {
      newErrors.title = 'Il titolo contiene contenuto non valido';
    }

    // Validate description
    if (!description.trim()) {
      newErrors.description = 'La descrizione è obbligatoria';
    } else if (!validateInput.textLength(description, 500)) {
      newErrors.description = 'La descrizione non può superare i 500 caratteri';
    } else if (!validateInput.noScriptTags(description)) {
      newErrors.description = 'La descrizione contiene contenuto non valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Correggi gli errori nel modulo prima di continuare');
      return;
    }

    // Rate limiting check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Devi essere autenticato per creare un obiettivo');
      return;
    }

    if (!authRateLimiter.isAllowed(user.id)) {
      toast.error('Troppi tentativi. Riprova tra qualche minuto.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Sanitize inputs before saving
      const sanitizedTitle = sanitizeText(title.trim());
      const sanitizedDescription = sanitizeText(description.trim());

      const { error } = await supabase
        .from('user_objectives')
        .insert({
          user_id: user.id,
          title: sanitizedTitle,
          description: sanitizedDescription,
          completed: false,
          progress: 0
        });

      if (error) throw error;

      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
      if (onObjectiveCreated) {
        onObjectiveCreated();
      }
      toast.success('Obiettivo creato con successo!');
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error('Errore durante il salvataggio dell\'obiettivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string, setter: (value: string) => void) => {
    setter(value);
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-black border-2 border-[#EEBA2B] rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#EEBA2B]">Nuovo Obiettivo</h3>
          <button onClick={onClose} className="text-white hover:text-[#EEBA2B]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Titolo dell'obiettivo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleInputChange('title', e.target.value, setTitle)}
              className={`w-full p-3 bg-black border rounded-lg text-white ${errors.title ? 'border-red-500' : 'border-white/20'}`}
              placeholder="Es. Correre 10km"
              maxLength={100}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Descrizione della sfida
            </label>
            <textarea
              value={description}
              onChange={(e) => handleInputChange('description', e.target.value, setDescription)}
              className={`w-full p-3 bg-black border rounded-lg text-white min-h-[100px] resize-none ${errors.description ? 'border-red-500' : 'border-white/20'}`}
              placeholder="Descrivi in cosa consiste la sfida per completare questo obiettivo..."
              maxLength={500}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Elimina
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !description.trim() || isLoading || Object.keys(errors).length > 0}
            className="flex-1 bg-[#EEBA2B] hover:bg-[#EEBA2B]/80 text-black font-medium"
          >
            {isLoading ? 'Salvando...' : 'Salva'}
          </Button>
        </div>
      </div>
    </div>
  );
};
