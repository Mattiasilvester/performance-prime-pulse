import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface DurationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number) => void;
  category: {
    name: string;
    description: string;
  };
}

export const DurationSelector = ({ isOpen, onClose, onConfirm, category }: DurationSelectorProps) => {
  const [duration, setDuration] = useState([20]);

  const handleConfirm = () => {
    onConfirm(duration[0]);
    onClose();
  };

  const getDurationDescription = (minutes: number) => {
    if (minutes <= 15) return 'Allenamento Express - Perfetto per una pausa veloce';
    if (minutes <= 30) return 'Allenamento Standard - Equilibrato ed efficace';
    return 'Allenamento Intenso - Massimo risultato';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-2 border-pp-gold text-white">
        <DialogHeader>
          <DialogTitle className="text-pp-gold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scegli la Durata - {category.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <p className="text-white/80 text-sm mb-4">{category.description}</p>
          </div>

          <div className="space-y-4">
            <Label className="text-pp-gold">Durata allenamento: {duration[0]} minuti</Label>
            
            <div className="px-3">
              <Slider
                value={duration}
                onValueChange={setDuration}
                max={60}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60 mt-2">
                <span>10 min</span>
                <span>35 min</span>
                <span>60 min</span>
              </div>
            </div>

            <div className="bg-pp-gold/10 border border-pp-gold/20 rounded-lg p-4">
              <p className="text-pp-gold text-sm font-medium">
                {getDurationDescription(duration[0])}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-white hover:bg-gray-800"
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-pp-gold text-black hover:bg-pp-gold/90"
            >
              Inizia Allenamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};