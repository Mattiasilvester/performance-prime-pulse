import { Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  isOpen: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function WelcomeModal({ isOpen, onStart, onCancel }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-[#EEBA2B]/30 p-6">
        <div className="text-center space-y-6">
          {/* Avatar PrimeBot animato */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Bot icon */}
              <div
                className="
                  w-20 h-20 
                  bg-gradient-to-br from-purple-500 to-blue-500 
                  rounded-full 
                  flex items-center justify-center
                  animate-pulse
                "
              >
                <Bot className="h-10 w-10 text-white" />
              </div>

              {/* Cerchi animati intorno */}
              <div
                className="
                  absolute inset-0 
                  rounded-full 
                  border-2 border-purple-500/30 
                  animate-ping
                "
              />
              <div
                className="
                  absolute inset-[-8px]
                  rounded-full 
                  border-2 border-blue-500/20 
                  animate-pulse
                "
              />
            </div>
          </div>

          {/* Contenuto */}
          <div className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Crea il tuo Piano Personalizzato
            </DialogTitle>

            <DialogDescription className="text-base text-gray-300">
              PrimeBot, il tuo coach AI, ti guiderà nella creazione di un piano di allenamento perfetto per te.
              <br />
              <br />
              Ti farò alcune domande sui tuoi obiettivi e preferenze. In pochi minuti avrai un piano completo e personalizzato!
            </DialogDescription>
          </div>

          {/* Bottoni */}
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={onCancel} className="border-white/20 text-white hover:bg-white/10">
              Annulla
            </Button>
            <Button
              onClick={onStart}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              Iniziamo 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

