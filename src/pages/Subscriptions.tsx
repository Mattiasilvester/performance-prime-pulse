
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#F5C118] mb-4">
            ABBONAMENTI
          </h1>
          <p className="text-gray-300 text-lg">
            Scegli il piano perfetto per i tuoi obiettivi
          </p>
        </div>

        {/* Mobile and Desktop Carousel */}
        <div className="max-w-6xl mx-auto">
          <Carousel 
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {plans.map((plan) => (
                <CarouselItem key={plan.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="relative">
                    <Card className={`
                      h-full bg-white text-black relative transition-all duration-300
                      border-2 border-[#F5C118] hover:border-[#F5C118] hover:shadow-lg hover:shadow-[#F5C118]/25
                      ${plan.popular ? 'ring-2 ring-[#F5C118] ring-offset-2 ring-offset-black' : ''}
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
                          className="w-full bg-[#87CEEB] hover:bg-[#87CEEB]/80 text-white font-bold py-3 text-lg rounded-lg"
                        >
                          ABBONATI
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation buttons - visible on larger screens */}
            <div className="hidden md:block">
              <CarouselPrevious className="bg-[#F5C118] text-black hover:bg-[#F5C118]/80 border-[#F5C118]" />
              <CarouselNext className="bg-[#F5C118] text-black hover:bg-[#F5C118]/80 border-[#F5C118]" />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
