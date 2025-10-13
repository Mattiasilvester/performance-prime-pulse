
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Zap, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const Subscriptions = () => {
  const plans = [
    {
      id: 'basic',
      name: 'BASIC',
      price: '!!!',
      period: '/mese',
      originalPrice: '€9,99/mese',
      icon: Shield,
      features: [
        'Tutte le funzioni gratuite',
        '5 allenamenti salvati',
        '1 consulenza mensile gratuita',
        'Accesso diretto ai professionisti',
        'Offerte limitate su palestre'
      ],
      popular: false,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'advanced',
      name: 'ADVANCED',
      price: '!!!',
      period: '/mese',
      originalPrice: '€19,99/mese',
      icon: Star,
      features: [
        'Tutte le funzioni Basic',
        'Workout illimitati',
        'Tracciamento avanzato',
        'Sconti esclusivi su palestre',
        'Rimozione completa pubblicità',
        'Supporto prioritario'
      ],
      popular: true,
      color: 'from-pp-gold to-yellow-500'
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '!!!',
      period: '/mese',
      originalPrice: '€29,99/mese',
      icon: Crown,
      features: [
        'Tutte le funzioni Advanced',
        'Analisi IA delle performance',
        'Suggerimenti personalizzati',
        'Accesso esclusivo eventi live',
        'Coaching personalizzato 1:1',
        'Piano nutrizionale personalizzato'
      ],
      popular: false,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pp-gold/10 via-transparent to-pp-gold/5"></div>
          <div className="relative container mx-auto px-4 py-16 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-pp-gold mb-6">
                ABBONAMENTI
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Scegli il piano perfetto per superare ogni limite
              </p>
              <div className="flex items-center justify-center gap-4 text-pp-gold/80">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Nessun impegno</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Disdici quando vuoi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Supporto 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <div 
                  key={plan.id} 
                  className={`relative group ${plan.popular ? 'md:-mt-8' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        ⭐ PIÙ POPOLARE
                      </div>
                    </div>
                  )}
                  
                  <Card className={`
                    h-full bg-gradient-to-br from-gray-900 to-black border-2 transition-all duration-500 group-hover:scale-105
                    ${plan.popular 
                      ? 'border-pp-gold shadow-2xl shadow-pp-gold/30' 
                      : 'border-gray-700 hover:border-pp-gold/50 hover:shadow-lg hover:shadow-pp-gold/20'
                    }
                  `}>
                    <CardHeader className="text-center pb-6 pt-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      
                      <CardTitle className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </CardTitle>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-pp-gold">{plan.price}</span>
                          <span className="text-gray-400">{plan.period}</span>
                        </div>

                      </div>
                    </CardHeader>
                    
                    <CardContent className="px-6 pb-8">
                      <div className="space-y-4 mb-8">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-pp-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-pp-gold" />
                            </div>
                            <span className="text-gray-300 text-sm leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className={`
                          w-full py-3 text-base font-bold rounded-xl transition-all duration-300
                          ${plan.popular 
                            ? 'bg-gradient-to-r from-pp-gold to-yellow-500 text-black hover:from-yellow-400 hover:to-pp-gold shadow-lg shadow-pp-gold/30' 
                            : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500'
                          }
                        `}
                      >
                        {plan.popular ? '🚀 INIZIA ORA' : 'Scegli Piano'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-gray-900 to-black py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-pp-gold mb-4">
                Perché scegliere Performance Prime?
              </h2>
              <p className="text-gray-300 text-lg">
                La piattaforma di fitness più avanzata per raggiungere i tuoi obiettivi
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pp-gold/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-pp-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Avanzata</h3>
                <p className="text-gray-400">Algoritmi di intelligenza artificiale per personalizzare il tuo allenamento</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pp-gold/20 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-pp-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sicurezza Totale</h3>
                <p className="text-gray-400">I tuoi dati sono protetti con crittografia di livello militare</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pp-gold/20 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-pp-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Risultati Garantiti</h3>
                <p className="text-gray-400">Supporto continuo e strumenti digitali per raggiungere i tuoi obiettivi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscriptions;
