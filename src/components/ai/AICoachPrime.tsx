
import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { Button } from '@/components/ui/button';
import { Sparkles, Target } from 'lucide-react';
import { Lock } from 'lucide-react';

interface AICoachPrimeProps {
  onRequestPlan: () => void;
  chatInterfaceRef?: React.RefObject<any>;
}

export const AICoachPrime: React.FC<AICoachPrimeProps> = ({ onRequestPlan, chatInterfaceRef }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <ChatInterface ref={chatInterfaceRef} />
          {/* Overlay specifico per la chat */}
          <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-[1px] rounded-2xl border-2 border-gray-500 z-10 flex flex-col items-center justify-center text-white text-center p-6">
            <Lock className="h-12 w-12 text-white mb-4" />
            <h3 className="text-xl font-bold mb-2">Funzionalità in arrivo</h3>
            <p className="text-sm opacity-90">La chat AI sarà disponibile presto!</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-black border border-gray-500 rounded-2xl p-6 quick-actions relative">
            {/* Overlay specifico per le azioni rapide */}
            <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-[1px] rounded-2xl border-2 border-gray-500 z-10 flex flex-col items-center justify-center text-white text-center p-6">
              <Lock className="h-8 w-8 text-white mb-3" />
              <h3 className="text-lg font-bold mb-1">Funzionalità in arrivo</h3>
              <p className="text-xs opacity-90">Le azioni rapide saranno disponibili presto!</p>
            </div>

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
          </div>
          
          <div className="bg-black border border-gray-500 rounded-2xl p-6 ai-suggestions relative">
            {/* Overlay specifico per i suggerimenti AI */}
            <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-[1px] rounded-2xl border-2 border-gray-500 z-10 flex flex-col items-center justify-center text-white text-center p-6">
              <Lock className="h-8 w-8 text-white mb-3" />
              <h3 className="text-lg font-bold mb-1">Funzionalità in arrivo</h3>
              <p className="text-xs opacity-90">I suggerimenti AI saranno disponibili presto!</p>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};
