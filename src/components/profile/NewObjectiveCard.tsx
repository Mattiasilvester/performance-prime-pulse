
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ObjectiveModal } from './ObjectiveModal';

interface NewObjectiveCardProps {
  onObjectiveCreated?: () => void;
}

export const NewObjectiveCard = ({ onObjectiveCreated }: NewObjectiveCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleObjectiveCreated = () => {
    if (onObjectiveCreated) {
      onObjectiveCreated();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        onClick={handleOpenModal}
        className="p-4 rounded-xl border-2 border-dashed border-[#EEBA2B] bg-black hover:bg-[#EEBA2B]/10 transition-all duration-200 cursor-pointer"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EEBA2B]/20 flex items-center justify-center mb-3">
            <Plus className="h-6 w-6 text-[#EEBA2B]" />
          </div>
          
          <h4 className="font-semibold text-sm mb-1 text-[#EEBA2B]">
            Nuovo Obiettivo
          </h4>
          
          <p className="text-xs text-white/70">
            Crea la tua sfida personalizzata
          </p>
        </div>
      </div>

      <ObjectiveModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onObjectiveCreated={handleObjectiveCreated}
      />
    </>
  );
};
