import React, { useState } from 'react';
import { Brain, Target, Clock, MapPin, Users, BarChart3 } from 'lucide-react';
import { FeatureModal } from '../FeatureModal';

type FeatureKey = 'aiCoach' | 'tracking' | 'timer' | 'finder' | 'community' | 'analytics';

const FEATURE_DETAILS = {
  aiCoach: {
    title: "AI Coach Personalizzato",
    bullets: [
      "Analisi biomeccanica in tempo reale",
      "Programmi personalizzati basati sui tuoi obiettivi",
      "Correzione della forma istantanea",
      "Adattamento dinamico al tuo progresso"
    ]
  },
  tracking: {
    title: "Tracking Avanzato",
    bullets: [
      "Monitora peso, ripetizioni e serie automaticamente",
      "Tracciamento del tempo di recupero ottimale",
      "Statistiche dettagliate per ogni muscolo",
      "Progressi visualizzati in grafici intuitivi"
    ]
  },
  timer: {
    title: "Timer Intelligente",
    bullets: [
      "Timer automatico basato sul tipo di esercizio",
      "Avvisi per il recupero ottimale tra le serie",
      "Cronometro per esercizi a tempo",
      "Gestione superserie e circuit training"
    ]
  },
  finder: {
    title: "Gym Finder",
    bullets: [
      "Trova palestre vicine con un tap",
      "Filtri per attrezzature e servizi",
      "Recensioni della community",
      "Orari e prezzi aggiornati"
    ]
  },
  community: {
    title: "Community",
    bullets: [
      "Connettiti con atleti del tuo livello",
      "Sfide e competizioni mensili",
      "Condividi i tuoi progressi",
      "Trova partner di allenamento"
    ]
  },
  analytics: {
    title: "Analytics Pro",
    bullets: [
      "Analisi dettagliata delle performance",
      "Previsioni basate su AI",
      "Report settimanali e mensili",
      "Confronto con i tuoi obiettivi"
    ]
  }
};

const FeaturesSection = () => {
  const [flippingCard, setFlippingCard] = useState<number | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey | null>(null);

  const handleFeatureClick = (feature: FeatureKey, index: number) => {
    if (flippingCard === index) {
      setFlippingCard(null); // Torna al fronte
    } else {
      setFlippingCard(index); // Gira la card
    }
  };

  const features = [
    { icon: Brain, key: 'aiCoach' as FeatureKey, title: "AI Coach Personalizzato", desc: "Il tuo allenatore virtuale che ti segue 24/7" },
    { icon: Target, key: 'tracking' as FeatureKey, title: "Tracking Avanzato", desc: "Monitora ogni progresso in tempo reale" },
    { icon: Clock, key: 'timer' as FeatureKey, title: "Timer Intelligente", desc: "Ottimizza i tempi di recupero e allenamento" },
    { icon: MapPin, key: 'finder' as FeatureKey, title: "Gym Finder", desc: "Trova la palestra perfetta ovunque tu sia" },
    { icon: Users, key: 'community' as FeatureKey, title: "Community", desc: "Connettiti con atleti che condividono i tuoi obiettivi" },
    { icon: BarChart3, key: 'analytics' as FeatureKey, title: "Analytics Pro", desc: "Grafici e statistiche per ottimizzare le performance" }
  ];

  return (
    <>


      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Funzionalità che fanno la differenza
            </h2>
            <p className="text-xl text-gray-400">
              Tutto ciò che ti serve per raggiungere i tuoi obiettivi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative cursor-pointer"
                style={{ 
                  perspective: '1000px',
                  width: '100%',
                  height: '280px'
                }}
                onClick={() => handleFeatureClick(feature.key, index)}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.7s',
                    transform: flippingCard === index ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONTE */}
                  <div 
                    className="absolute w-full h-full rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 hover:border-brand-primary/50"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    <feature.icon className="w-12 h-12 text-brand-primary mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.desc}</p>
                  </div>

                  {/* RETRO */}
                  <div 
                    className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-brand-primary/20 to-gray-900 border border-brand-primary/50 p-6"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    <h3 className="text-lg font-bold text-brand-primary mb-3">{feature.title}</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {FEATURE_DETAILS[feature.key].bullets.slice(0, 3).map((bullet, i) => (
                        <li key={i}>• {bullet}</li>
                      ))}
                    </ul>
                    <button 
                      className="mt-4 text-brand-primary font-semibold hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = '/auth';
                      }}
                    >
                      Inizia Ora! →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedFeature && (
        <FeatureModal
          open={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          title={FEATURE_DETAILS[selectedFeature].title}
          icon={features.find(f => f.key === selectedFeature)?.icon ? React.createElement(features.find(f => f.key === selectedFeature)!.icon) : '🤖'}
          bullets={FEATURE_DETAILS[selectedFeature].bullets}
        />
      )}
    </>
  );
};

export default FeaturesSection;
