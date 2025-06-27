
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const Subscriptions = () => {
  const plans = [
    {
      id: 'basic',
      name: 'BASIC',
      price: 'da !!!/mese',
      originalPrice: 'da €4,99/mese',
      features: [
        'Tutte le funzioni free',
        '5 allenamenti salvati nel profilo',
        '1 consulenza al mese free con un professionista',
        'Accesso diretto a professionisti',
        'Offerte limitate su palestre e e-commerce'
      ],
      popular: false
    },
    {
      id: 'advanced',
      name: 'ADVANCED',
      price: 'da !!!/mese',
      originalPrice: 'da €9,99/mese',
      features: [
        'Tutte le funzioni basic',
        'Workout illimitati',
        'Tracciamento avanzato',
        'Accesso diretto a professionisti',
        'Sconti esclusivi su palestre e e-commerce',
        'Rimozione completa pubblicità'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'PRO',
      price: 'da !!!/mese',
      originalPrice: 'da €14,99/mese',
      features: [
        'Tutte le funzioni premium',
        'Analisi dettagliata delle performance con IA',
        'Suggerimenti personalizzati per allenamento e diete',
        'Accesso esclusivo a eventi live',
        'Coaching personalizzato'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5C118] mb-4">
            ABBONAMENTI
          </h1>
          <p className="text-gray-300 text-base">
            Scegli il piano perfetto per i tuoi obiettivi
          </p>
        </div>

        <div 
          className="flex gap-6 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide justify-center pt-20"
        >
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="flex-shrink-0 w-64 snap-center relative"
            >
              <Card className={`
                h-full min-h-[420px] bg-white text-black relative transition-all duration-300 flex flex-col mt-4
                border-2 border-[#F5C118] hover:border-[#F5C118] hover:shadow-lg hover:shadow-[#F5C118]/25
                ${plan.popular ? 'transform scale-105 shadow-xl shadow-[#F5C118]/30 ring-2 ring-[#F5C118]' : ''}
              `}>
                {plan.popular && (
                  <div className="absolute -top-6 -right-2 z-10 most-popular-badge">
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold transform rotate-12">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-xl font-bold mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="border-b-2 border-[#F5C118] w-16 mx-auto mb-3"></div>
                  <div className="text-lg font-bold">
                    {plan.price}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col px-4">
                  <div className="space-y-2 mb-4 flex-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-[#F5C118] mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-medium leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full bg-[#87CEEB] hover:bg-[#87CEEB]/80 text-white font-bold py-2 text-sm rounded-lg mt-auto"
                  >
                    ABBONATI
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
