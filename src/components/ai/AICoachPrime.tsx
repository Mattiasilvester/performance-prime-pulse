
import React, { useState } from 'react';
import PrimeChat from '../PrimeChat';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, X } from 'lucide-react';

interface AICoachPrimeProps {
  onRequestPlan: () => void;
  chatInterfaceRef?: React.RefObject<any>;
}

export const AICoachPrime: React.FC<AICoachPrimeProps> = ({ onRequestPlan, chatInterfaceRef }) => {
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  const openFullScreenChat = () => {
    setIsFullScreenChat(true);
  };

  const closeFullScreenChat = () => {
    setIsFullScreenChat(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <div 
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={openFullScreenChat}
          >
            <PrimeChat isModal={false} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-black border border-gray-500 rounded-2xl p-6 quick-actions relative">

            <h3 className="text-lg font-semibold text-[#EEBA2B] mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Azioni Rapide
            </h3>
            <div className="space-y-3">
              <Button 
                onClick={onRequestPlan}
                className="w-full btn-primary flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Crea Piano Personalizzato
              </Button>
            </div>
            
            {/* Overlay unico su tutta la sezione Azioni Rapide */}
            <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-bold text-white mb-2">Funzionalità in arrivo</h3>
                <p className="text-sm text-gray-200">Le azioni rapide saranno disponibili presto!</p>
              </div>
            </div>
          </div>
          
          <div className="bg-black border border-gray-500 rounded-2xl p-6 ai-suggestions relative">

            <h3 className="text-lg font-semibold text-[#EEBA2B] mb-4">
              Suggerimenti AI
            </h3>
            <div className="space-y-3 text-sm text-white">
              <div className="p-3 bg-gradient-to-r from-black to-[#C89116] rounded-lg">
                <p className="font-medium">💡 Consiglio del giorno</p>
                <p className="text-xs mt-1 opacity-90">Aumenta l'intensità gradualmente per evitare infortuni</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-black to-[#C89116] rounded-lg">
                <p className="font-medium">🎯 Focus della settimana</p>
                <p className="text-xs mt-1 opacity-90">Concentrati sui movimenti funzionali</p>
              </div>
            </div>
            
            {/* Overlay unico su tutta la sezione Suggerimenti AI */}
            <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-bold text-white mb-2">Funzionalità in arrivo</h3>
                <p className="text-sm text-gray-200">I suggerimenti AI saranno disponibili presto!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chat a Tutto Schermo */}
      {isFullScreenChat && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop sfocato con click per chiudere */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300 ease-in-out cursor-pointer" 
            onClick={closeFullScreenChat}
          />
          
          {/* Chat Modal centrato */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div 
              className="w-full max-w-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pulsante X per chiudere */}
              <button
                onClick={closeFullScreenChat}
                className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
              <PrimeChat isModal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
