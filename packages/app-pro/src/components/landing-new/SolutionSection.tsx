import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { IPhoneMockup } from './IPhoneMockup';
import { PlanScreen } from './PlanScreen';
import { ProgressScreen } from './ProgressScreen';

// Import screenshot PrimeBot - il file placeholder esiste, sostituiscilo con lo screenshot reale
// Path: src/assets/images/primebot-screenshot.png
let primebotScreenshot: string;
try {
  primebotScreenshot = new URL('../../assets/images/primebot-screenshot.png', import.meta.url).href;
} catch {
  primebotScreenshot = '';
}

const features = [
  {
    title: 'PrimeBot AI Coach',
    description: 'Analizza il tuo profilo e crea piani dinamici che si adattano ai tuoi progressi',
    screen: 'primebot'
  },
  {
    title: 'Piani Personalizzati',
    description: 'Allenamenti su misura per casa, palestra o outdoor',
    screen: 'plan'
  },
  {
    title: 'Tracking Progressi',
    description: 'Monitora miglioramenti con grafici chiari e obiettivi raggiungibili',
    screen: 'progress'
  }
];

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const renderScreen = (screenType: string) => {
    switch (screenType) {
      case 'primebot':
        return (
          <div className="bg-[#0a0a0a] min-h-[600px] md:min-h-[700px] relative overflow-hidden">
            {/* Screenshot PrimeBot */}
            {primebotScreenshot && (
              <img
                src={primebotScreenshot}
                alt="PrimeBot AI Coach Interface"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Se l'immagine non carica, mostra placeholder
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.parentElement?.querySelector('.primebot-placeholder') as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            )}
            {/* Placeholder se screenshot non disponibile */}
            <div className={`primebot-placeholder ${!primebotScreenshot ? 'flex' : 'hidden'} absolute inset-0 w-full h-full bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] items-center justify-center`}>
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold text-[#EEBA2B] mb-2">PrimeBot</h3>
                <p className="text-gray-400">Il tuo coach AI personalizzato</p>
                <p className="text-xs text-gray-500 mt-4">Screenshot da inserire in src/assets/images/primebot-screenshot.png</p>
              </div>
            </div>
          </div>
        );
      case 'plan':
        return <PlanScreen />;
      case 'progress':
        return <ProgressScreen />;
      default:
        return null;
    }
  };

  return (
    <section className="py-12 md:py-20 lg:py-32 bg-white overflow-hidden" ref={ref}>
      <style>{`
        /* Disabilita offset su mobile e tablet */
        @media (max-width: 1023px) {
          .iphone-mockup-container {
            transform: none !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
            Performance Prime ti dà il{' '}
            <span className="text-[#EEBA2B]">metodo</span> che cercavi
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Un approccio scientifico e personalizzato che si adatta al tuo stile di vita
          </p>
        </motion.div>

        {/* iPhone Mockups Container */}
        <div className="relative">
          {/* Desktop Layout: 3 iPhone sfalsati diagonalmente */}
          <div className="hidden lg:flex items-start justify-center gap-8 lg:gap-12 xl:gap-16 px-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-shrink-0"
                style={{
                  width: 'min(100%, 320px)',
                  maxWidth: '320px'
                }}
              >
                <div className="w-full">
                  <IPhoneMockup
                    delay={index * 0.2}
                    index={index}
                    className="w-full"
                  >
                    {renderScreen(feature.screen)}
                  </IPhoneMockup>
                </div>
                
                {/* Testo sotto iPhone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.2, duration: 0.6 }}
                  className="mt-8 text-center w-full"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-black mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Tablet Layout: 3 iPhone in fila orizzontale (meno sfalsati) */}
          <div className="hidden md:flex lg:hidden items-start justify-center gap-4 md:gap-6 px-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-shrink-0"
                style={{
                  width: 'min(100%, 240px)',
                  maxWidth: '240px'
                }}
              >
                <div className="w-full">
                  <IPhoneMockup
                    delay={index * 0.2}
                    index={index}
                    className="w-full"
                  >
                    {renderScreen(feature.screen)}
                  </IPhoneMockup>
                </div>
                
                {/* Testo sotto iPhone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.2, duration: 0.6 }}
                  className="mt-6 text-center w-full"
                >
                  <h3 className="text-base md:text-lg font-bold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Mobile Layout: 3 iPhone in colonna verticale (centrati) */}
          <div className="flex md:hidden flex-col items-center gap-10 sm:gap-12 px-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center w-full"
                style={{
                  maxWidth: 'min(100%, 280px)'
                }}
              >
                <div className="w-full">
                  <IPhoneMockup
                    delay={index * 0.2}
                    index={0} // Su mobile non c'è offset
                    className="w-full"
                  >
                    {renderScreen(feature.screen)}
                  </IPhoneMockup>
                </div>
                
                {/* Testo sotto iPhone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.2, duration: 0.6 }}
                  className="mt-6 text-center w-full"
                >
                  <h3 className="text-lg font-bold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="text-center mt-12 md:mt-16"
        >
          <p className="text-base md:text-lg text-gray-600">
            Tutto in un'unica app.{' '}
            <span className="text-black font-bold">Semplice, efficace, motivante.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
