import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exerciseDescriptions } from '@/data/exerciseDescriptions';

interface ExerciseExplanationProps {
  exerciseName: string;
  trigger?: React.ReactNode;
}

export const ExerciseExplanation = ({ exerciseName, trigger }: ExerciseExplanationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const description = exerciseDescriptions[exerciseName] || 'Descrizione non disponibile per questo esercizio.';

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-pp-gold/60 hover:text-pp-gold animate-fade-in"
      onClick={() => setIsOpen(true)}
    >
      <Info className="h-4 w-4" />
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-black border-2 border-pp-gold text-white animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-pp-gold flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              {exerciseName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-pp-gold/10 border border-pp-gold/20 rounded-lg p-4 animate-fade-in">
              <h4 className="text-pp-gold font-semibold mb-2">Come eseguire:</h4>
              <p className="text-white/90 leading-relaxed">
                {description}
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 animate-fade-in">
              <p className="text-blue-300 text-sm">
                💡 <strong>Consiglio:</strong> Esegui l'esercizio lentamente la prima volta per imparare la tecnica corretta.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)} className="animate-scale-in">
              Ho capito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};