
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onObjectiveCreated?: () => void;
}

export const ObjectiveModal = ({ isOpen, onClose, onObjectiveCreated }: ObjectiveModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_objectives')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          completed: false,
          progress: 0
        });

      if (error) throw error;

      setTitle('');
      setDescription('');
      onClose();
      if (onObjectiveCreated) {
        onObjectiveCreated();
      }
    } catch (error) {
      console.error('Error saving objective:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45]" onClick={onClose}>
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
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-black border border-white/20 rounded-lg text-white"
              placeholder="Es. Correre 10km"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Descrizione della sfida
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-black border border-white/20 rounded-lg text-white min-h-[100px] resize-none"
              placeholder="Descrivi in cosa consiste la sfida per completare questo obiettivo..."
              maxLength={200}
            />
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
            disabled={!title.trim() || !description.trim() || isLoading}
            className="flex-1 bg-[#EEBA2B] hover:bg-[#EEBA2B]/80 text-black font-medium"
          >
            {isLoading ? 'Salvando...' : 'Salva'}
          </Button>
        </div>
      </div>
    </div>
  );
};
