
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AICoachPrime } from './AICoachPrime';
import { AIInsights } from './AIInsights';
import { CustomPlanModal } from './CustomPlanModal';

export const AICoach = () => {
  const [activeTab, setActiveTab] = useState('prime');
  const [isPlanModalOpen, setPlanModal] = useState(false);

  const handleSavePlan = (planData: any) => {
    console.log('Saving plan:', planData);
    // TODO: Implementare salvataggio del piano tramite API
    setPlanModal(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
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
          <AICoachPrime onRequestPlan={() => setPlanModal(true)} />
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
  );
};
