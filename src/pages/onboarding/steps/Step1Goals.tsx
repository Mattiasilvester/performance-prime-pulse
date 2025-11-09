import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { 
  Dumbbell, 
  Flame, 
  Zap, 
  Target,
  CheckCircle
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

interface Goal {
  id: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare';
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}

const goals: Goal[] = [
  {
    id: 'massa',
    icon: Dumbbell,
    title: 'Aumentare massa muscolare',
    description: 'Costruisci muscoli definiti e aumenta la tua forza',
    benefits: ['Muscoli più grandi', 'Forza incrementata', 'Metabolismo accelerato'],
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'dimagrire',
    icon: Flame,
    title: 'Dimagrire e definirmi',
    description: 'Perdi peso in modo sano e scolpisci il tuo fisico',
    benefits: ['Perdita di grasso', 'Definizione muscolare', 'Energia aumentata'],
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    id: 'resistenza',
    icon: Zap,
    title: 'Migliorare resistenza',
    description: 'Aumenta energia e performance cardiovascolare',
    benefits: ['Più fiato', 'Recupero veloce', 'Cuore più sano'],
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'tonificare',
    icon: Target,
    title: 'Tonificare il corpo',
    description: 'Rassoda e definisci la tua silhouette',
    benefits: ['Corpo tonico', 'Postura migliorata', 'Agilità aumentata'],
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    gradient: 'from-green-500 to-teal-500'
  }
];

export function Step1Goals() {
  const { data, updateData } = useOnboardingStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(data.obiettivo || null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { saveAndContinue, trackStepStarted } = useOnboardingNavigation();

  useEffect(() => {
    trackStepStarted(1);
  }, [trackStepStarted]);

  const handleSelectGoal = (goalId: Goal['id']) => {
    if (isTransitioning) return;
    
    setSelectedGoal(goalId);
    setIsTransitioning(true);

    // Haptic feedback se disponibile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Track selection
    trackOnboarding.stepCompleted(1, { obiettivo: goalId });

    // Update store and advance after animation
    setTimeout(() => {
      updateData({ obiettivo: goalId });
    saveAndContinue(1, { obiettivo: goalId });
    }, 500);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-5xl mb-4"
        >
          🎯
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Ciao! Sono PrimeBot 🤖
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-400"
        >
          Qual è il tuo obiettivo principale?
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 mt-2"
        >
          Non preoccuparti, potrai sempre modificarlo in seguito
        </motion.p>
      </div>

      {/* Goals Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;
          
          return (
            <motion.button
              key={goal.id}
              variants={cardVariants}
              whileHover={!isSelected ? { scale: 1.02 } : {}}
              whileTap={!isSelected ? { scale: 0.98 } : {}}
              onClick={() => handleSelectGoal(goal.id)}
              disabled={isTransitioning && !isSelected}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                text-left group cursor-pointer
                ${isSelected 
                  ? `${goal.bgColor} ${goal.borderColor} border-2 shadow-lg`
                  : 'bg-white/5 border-white/10 hover:border-white/20 backdrop-blur-sm'}
                ${isTransitioning && !isSelected ? 'opacity-50' : ''}
              `}
            >
              {/* Icon */}
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  animate={isSelected ? { rotate: 360 } : {}}
                  transition={{ duration: 0.5 }}
                  className={`
                    p-3 rounded-xl transition-colors
                    ${isSelected 
                      ? `bg-gradient-to-br ${goal.gradient}` 
                      : goal.bgColor}
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : goal.color}`} />
                </motion.div>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-black" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {goal.description}
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2">
                  {goal.benefits.map((benefit, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: isSelected ? 0.1 * index : 0 }}
                      className={`
                        text-xs px-2 py-1 rounded-full transition-all
                        ${isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/5 text-gray-500'}
                      `}
                    >
                      {benefit}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Hover effect gradient */}
              {!isSelected && (
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none
                  bg-gradient-to-r ${goal.gradient}
                `} />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-8"
      >
        <p className="text-sm text-gray-500">
          Seleziona un obiettivo per continuare →
        </p>
      </motion.div>
    </motion.div>
  );
}



