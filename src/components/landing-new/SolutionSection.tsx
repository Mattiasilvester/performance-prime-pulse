import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    iconBg: 'bg-[#FFD700]',
    title: 'PrimeBot AI Coach',
    description: 'Analizza il tuo profilo e crea piani dinamici che si adattano ai tuoi progressi',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop', // Placeholder - sostituire con screenshot chat
    alt: 'PrimeBot Chat Interface'
  },
  {
    icon: Calendar,
    iconBg: 'bg-[#FFD700]',
    title: 'Piani Personalizzati',
    description: 'Allenamenti su misura per casa, palestra o outdoor',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop', // Placeholder - sostituire con screenshot calendario
    alt: 'Piano di allenamento personalizzato'
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-[#FFD700]',
    title: 'Tracking Progressi',
    description: 'Monitora miglioramenti con grafici chiari e obiettivi raggiungibili',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', // Placeholder - sostituire con screenshot grafici
    alt: 'Grafici dei progressi'
  }
];

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <section className="py-20 md:py-32 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Performance Prime ti dà il{' '}
            <span className="text-[#FFD700]">metodo</span> che cercavi
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Un approccio scientifico e personalizzato che si adatta al tuo stile di vita
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="bg-gray-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Image Container */}
                  <div className="relative h-48 md:h-56 bg-gray-200 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Icon Badge */}
                    <div className="absolute top-4 right-4 p-3 bg-[#FFD700] rounded-xl shadow-lg">
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-600">
            Tutto in un'unica app.{' '}
            <span className="text-black font-bold">Semplice, efficace, motivante.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
