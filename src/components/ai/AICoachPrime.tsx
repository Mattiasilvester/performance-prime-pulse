
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
  console.log('AICoachPrime rendering - NO OVERLAY');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <ChatInterface ref={chatInterfaceRef} />
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
          </div>
        </div>
      </div>
    </div>
  );
};
