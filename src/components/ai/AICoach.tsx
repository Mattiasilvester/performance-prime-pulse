import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AICoachPrime } from './AICoachPrime';
import { AIInsights } from './AIInsights';
import { CustomPlanModal } from './CustomPlanModal';
import { Lock } from 'lucide-react';

export const AICoach = () => {
  const [activeTab, setActiveTab] = useState('prime');
  const [isPlanModalOpen, setPlanModal] = useState(false);
  const chatInterfaceRef = useRef<any>(null);

  const handleSavePlan = (planData: any) => {
    console.log('Generating plan for:', planData);
    
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
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="locked-container">
        <div className="lock-overlay">
          <Lock className="lock-icon" />
          <h3>Funzionalità in arrivo</h3>
          <p>L'AI Coach sarà disponibile presto!</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-pp-gold">AI Coach Prime</h2>
            <p className="text-white">Il tuo assistente personale per l'allenamento</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#333333] mb-6">
            <TabsTrigger 
              value="prime" 
              className="text-white data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black"
            >
              AI Coach Prime
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="text-white data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black relative"
            >
              Insights AI
              <span className="absolute top-1 right-1 text-xs">🔒</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prime">
            <AICoachPrime 
              onRequestPlan={() => setPlanModal(true)} 
              chatInterfaceRef={chatInterfaceRef}
            />
          </TabsContent>

          <TabsContent value="insights">
            <div className="insights-ai">
              <AIInsights />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal per Piani Personalizzati */}
        {isPlanModalOpen && (
          <CustomPlanModal
            onClose={() => setPlanModal(false)}
            onSave={handleSavePlan}
          />
        )}
      </div>
    </div>
  );
};
