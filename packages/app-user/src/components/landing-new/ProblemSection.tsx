import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';
import { 
  Target, 
  TrendingDown, 
  XCircle, 
  Brain,
  AlertCircle
} from 'lucide-react';

const problems = [
  {
    icon: Target,
    title: 'Ti alleni a caso',
    description: 'Senza un metodo strutturato, ogni sessione è improvvisata e inefficace',
    color: 'text-red-600',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500'
  },
  {
    icon: TrendingDown,
    title: 'Perdi motivazione',
    description: 'Dopo 2 settimane molli tutto perché non vedi progressi concreti',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500'
  },
  {
    icon: XCircle,
    title: 'Zero risultati',
    description: 'Mesi di allenamento senza miglioramenti visibili o misurabili',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500'
  },
  {
    icon: Brain,
    title: 'App complesse',
    description: 'Troppe funzioni e informazioni ti confondono invece di aiutarti',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500'
  }
];

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <section className="py-20 md:py-32 bg-gray-100" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Ti riconosci in questi{' '}
            <span className="text-[#FFD700]">problemi</span>?
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            Il 90% delle persone abbandona l'allenamento per questi motivi. 
            Ma c'è una soluzione.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
        >
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className={`
                  p-6 rounded-2xl border-2 transition-all duration-300 bg-white
                  ${problem.borderColor}
                  shadow-lg hover:shadow-xl h-full flex flex-col
                `}>
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`
                        p-3 rounded-xl ${problem.bgColor}
                        transition-colors
                      `}
                    >
                      <Icon className={`w-6 h-6 ${problem.color}`} />
                    </motion.div>
                    
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-gray-700 flex-1">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Problem indicator */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-700">
            Se almeno uno di questi problemi ti suona familiare...
          </p>
          <p className="text-xl font-bold text-[#FFD700] mt-2">
            È ora di cambiare approccio ↓
          </p>
        </motion.div>
      </div>
    </section>
  );
}

