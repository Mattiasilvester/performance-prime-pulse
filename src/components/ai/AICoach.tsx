
import React, { useState, useRef } from 'react';

import { AICoachPrime } from './AICoachPrime';
import { AIInsights } from './AIInsights';
import { CustomPlanModal } from './CustomPlanModal';
import { Lock } from 'lucide-react';

export const AICoach = () => {
  const [activeTab, setActiveTab] = useState('prime');
  const [isPlanModalOpen, setPlanModal] = useState(false);
  const chatInterfaceRef = useRef<any>(null);

  const handleSavePlan = (planData: any) => {
    
    // Genera il messaggio per l'AI
    const aiMessage = generateAIPlan(planData);
    
    // Invia il messaggio automaticamente alla chat
    if (chatInterfaceRef.current) {
      chatInterfaceRef.current.sendMessage(aiMessage);
    }
    
    setPlanModal(false);
  };

  const generateAIPlan = (planData: any) => {
    const goalMap = {
      'forza': 'aumentare la forza',
      'resistenza': 'migliorare la resistenza cardiovascolare',
      'perdita-peso': 'perdere peso',
      'massa-muscolare': 'aumentare la massa muscolare',
      'tonificazione': 'tonificare il corpo',
      'flessibilita': 'migliorare la flessibilità',
      'condizionamento': 'migliorare il condizionamento fisico generale'
    };

    let message = `Crea un piano di allenamento personalizzato per ${goalMap[planData.goal] || planData.goal}`;
    
    if (planData.title) {
      message += ` con il titolo "${planData.title}"`;
    }
    
    if (planData.details) {
      message += `. Dettagli aggiuntivi: ${planData.details}`;
    }
    
    message += '. Fornisci un piano dettagliato con esercizi specifici, serie, ripetizioni e consigli.';
    
    return message;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">PrimeBot</h2>
          <p className="text-white">Il tuo assistente personale per l'allenamento</p>
        </div>
      </div>

      <div className="w-full">
        <div className="grid w-full grid-cols-2 bg-[#333333] mb-6 p-1 rounded-lg" style={{ padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('prime')}
            className={`text-white rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'prime' ? 'bg-[#EEBA2B] text-black' : 'bg-transparent'
            }`}
            style={{ borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            PrimeBot
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`text-white rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'insights' ? 'bg-[#EEBA2B] text-black' : 'bg-transparent'
            }`}
            style={{ borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="flex items-center gap-2">
              Insights AI
              <span className="text-xs">🔒</span>
            </span>
          </button>
        </div>

        {activeTab === 'prime' && (
          <div>
            <AICoachPrime 
              onRequestPlan={() => setPlanModal(true)} 
              chatInterfaceRef={chatInterfaceRef}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-ai">
            <AIInsights />
          </div>
        )}
      </div>

      {/* Modal per Piani Personalizzati */}
      {isPlanModalOpen && (
        <CustomPlanModal
          onClose={() => setPlanModal(false)}
          onSave={handleSavePlan}
        />
      )}
    </div>
  );
};
