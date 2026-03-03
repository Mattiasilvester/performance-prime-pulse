import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Marco',
    result: '-8kg in 3 mesi',
    quote: 'Ho finalmente trovato costanza. PrimeBot mi ha guidato passo dopo passo, adattandosi al mio ritmo quando ero stanco. È la prima volta che vedo risultati veri.',
    rating: 5
  },
  {
    name: 'Sara',
    result: '+15% forza',
    quote: 'PrimeBot è come avere un PT in tasca. I consigli sono sempre precisi e motivanti. Mi ha fatto capire che non serve strafare per migliorare.',
    rating: 5
  },
  {
    name: 'Luca',
    result: '5km in 22 min',
    quote: 'Semplice ma efficace. Niente fronzoli, solo quello che serve per migliorare davvero. I risultati parlano da soli.',
    rating: 5
  },
  {
    name: 'Elena',
    result: 'Tonica e in forma',
    quote: 'Da principiante assoluta a 4 allenamenti a settimana. Il segreto? La progressione graduale che non ti fa mai sentire inadeguata.',
    rating: 5
  },
  {
    name: 'Giulia',
    result: 'Più energia quotidiana',
    quote: 'Non cercavo solo risultati fisici, ma più benessere. Performance Prime mi ha dato entrambi. Ora ho più energia per tutto il giorno.',
    rating: 5
  },
  {
    name: 'Roberto',
    result: '-12kg in 5 mesi',
    quote: 'Odiavo correre, ora lo faccio 4 volte a settimana. Il piano progressivo mi ha fatto innamorare dello sport.',
    rating: 5
  }
];

export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonials = () => {
    setCurrentIndex((prev) => 
      prev + 2 >= testimonials.length ? 0 : prev + 2
    );
  };

  const prevTestimonials = () => {
    setCurrentIndex((prev) => 
      prev - 2 < 0 ? testimonials.length - 2 : prev - 2
    );
  };

  return (
    <section className="py-20 md:py-32 bg-black" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Trasformazioni <span className="text-[#FFD700]">reali</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Oltre 12.000 persone hanno già trovato il loro metodo
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { number: '12k+', label: 'Utenti attivi' },
            { number: '97%', label: 'Soddisfazione' },
            { number: '500+', label: 'Professionisti' },
            { number: '4.8★', label: 'Valutazione' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}
              className="bg-gray-900 backdrop-blur-sm rounded-2xl p-4 text-center border border-[#FFD700]/30"
            >
              <div className="text-2xl md:text-3xl font-bold text-[#FFD700] mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Carousel con Frecce */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative flex items-center">
            {/* Freccia Sinistra */}
            <button
              onClick={prevTestimonials}
              className="absolute -left-12 md:-left-16 z-10 p-3 bg-[#FFD700] rounded-full hover:bg-[#FFD700]/90 hover:scale-110 transition-all group shadow-lg"
              aria-label="Testimonianze precedenti"
            >
              <ChevronLeft className="w-6 h-6 text-black font-bold group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Container Cards */}
            <div className="w-full overflow-hidden">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Card 1 */}
                <div className="bg-[#212121] rounded-2xl px-6 py-4 border border-[#FFD700] transition-all">
                  {/* Quote icon - più grande e giallo */}
                  <div className="text-[#FFD700] text-4xl mb-2 font-serif leading-none">"</div>
                  
                  {/* Testimonial text */}
                  <p className="text-white text-base md:text-lg mb-3 italic leading-normal">
                    {testimonials[currentIndex].quote}
                  </p>
                  
                  {/* Separator line */}
                  <div className="border-t border-[#FFD700] mb-3 w-[90%]"></div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-lg mb-0.5">{testimonials[currentIndex].name}</div>
                      <div className="text-base text-[#FFD700]">{testimonials[currentIndex].result}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                {currentIndex + 1 < testimonials.length && (
                  <div className="bg-[#212121] rounded-2xl px-6 py-4 border border-[#FFD700] transition-all">
                    {/* Quote icon - più grande e giallo */}
                    <div className="text-[#FFD700] text-4xl mb-2 font-serif leading-none">"</div>
                    
                    {/* Testimonial text */}
                    <p className="text-white text-base md:text-lg mb-3 italic leading-normal">
                      {testimonials[currentIndex + 1].quote}
                    </p>
                    
                    {/* Separator line */}
                    <div className="border-t border-[#FFD700] mb-3 w-[90%]"></div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-lg mb-0.5">{testimonials[currentIndex + 1].name}</div>
                        <div className="text-base text-[#FFD700]">{testimonials[currentIndex + 1].result}</div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(testimonials[currentIndex + 1].rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Freccia Destra */}
            <button
              onClick={nextTestimonials}
              className="absolute -right-12 md:-right-16 z-10 p-3 bg-[#FFD700] rounded-full hover:bg-[#FFD700]/90 hover:scale-110 transition-all group shadow-lg"
              aria-label="Testimonianze successive"
            >
              <ChevronRight className="w-6 h-6 text-black font-bold group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: Math.ceil(testimonials.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * 2)}
                className={`h-2.5 transition-all duration-300 ${
                  Math.floor(currentIndex / 2) === index 
                    ? 'w-10 bg-[#FFD700]' 
                    : 'w-2.5 bg-gray-600 hover:bg-gray-500'
                } rounded-full`}
                aria-label={`Vai alla pagina ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

