
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#F5C118] mb-4">
            ABBONAMENTI
          </h1>
          <p className="text-gray-300 text-lg">
            Scegli il piano perfetto per i tuoi obiettivi
          </p>
        </div>

        {/* Centered Horizontal Carousel */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl overflow-x-auto">
            <div 
              className="flex gap-6 pb-4 px-4 justify-center min-w-fit"
              style={{ 
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth'
              }}
            >
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className="flex-shrink-0 w-80 md:w-96"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div className="relative h-full">
                    <Card className={`
                      h-full min-h-[600px] bg-white text-black relative transition-all duration-300 flex flex-col
                      border-2 border-[#F5C118] hover:border-[#F5C118] hover:shadow-lg hover:shadow-[#F5C118]/25
                      ${plan.popular ? 'transform scale-105 shadow-2xl shadow-[#F5C118]/40 ring-2 ring-[#F5C118] ring-offset-2 ring-offset-black' : ''}
                    `}>
                      {plan.popular && (
                        <div className="absolute -top-3 -right-3 z-10">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold transform rotate-12">
                            MOST POPULAR
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-3xl font-bold mb-4">
                          {plan.name}
                        </CardTitle>
                        <div className="border-b-2 border-[#F5C118] w-24 mx-auto mb-6"></div>
                        <div className="text-2xl font-bold">
                          {plan.price}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        <div className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <Check className="h-5 w-5 text-[#F5C118] mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium leading-relaxed">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          className="w-full bg-[#87CEEB] hover:bg-[#87CEEB]/80 text-white font-bold py-3 text-lg rounded-lg mt-auto"
                        >
                          ABBONATI
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
