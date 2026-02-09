import { useEffect, useState } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, TrendingUp, Award } from 'lucide-react';
import { safeLocalStorage } from '@/utils/domHelpers';
import { analytics } from '@/services/analytics';

export function HeroSection() {
  const navigate = useNavigate();
  const controls = useAnimation();

  // Counter animation states
  const [sessioni, setSessioni] = useState(0);
  const [costanza, setCostanza] = useState(0);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    // Start animations when component mounts
    controls.start('visible');

    // Animate counters
    const duration = 2000; // 2 seconds
    const interval = 50; // Update every 50ms
    const steps = duration / interval;

    const sessioniTarget = 12000;
    const costanzaTarget = 97;
    const ratingTarget = 4.8;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;

      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setSessioni(Math.floor(sessioniTarget * easeOutQuart));
      setCostanza(Math.floor(costanzaTarget * easeOutQuart));
      setRating(Number((ratingTarget * easeOutQuart).toFixed(1)));

      if (currentStep >= steps) {
        clearInterval(timer);
        setSessioni(sessioniTarget);
        setCostanza(costanzaTarget);
        setRating(ratingTarget);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [controls]);

  const handleStartOnboarding = () => {
    safeLocalStorage.setItem('isOnboarding', 'true');

    // Track CTA click
    analytics.track('CTA Clicked', {
      location: 'hero',
      action: 'start_onboarding'
    });

    navigate('/onboarding');
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  const badgeVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        delay: 0.2
      }
    }
  };

  const metricVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 150
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Header CTA professionisti — alto a destra, stesso stile di "Diventa partner", solo testo */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-end items-center px-4 py-3 sm:px-6 sm:py-4 bg-black/20 backdrop-blur-sm">
        <Link
          to="/partner"
          className="border-2 border-white/40 hover:border-[#FFD700] text-white hover:text-[#FFD700] font-semibold text-sm px-4 py-2 rounded-full backdrop-blur-sm bg-black/40 hover:bg-black/60 transition-all duration-300"
        >
          <span className="hidden sm:inline">Sei un professionista? Clicca qui!</span>
          <span className="sm:hidden">Per Professionisti</span>
        </Link>
      </div>

      {/* Background Image con Overlay ottimizzato */}
      <div className="absolute inset-0 z-0">
        {/* Immagine di sfondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')` 
          }}
        />
        
        {/* Overlay gradient multiplo per leggibilità perfetta */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        
        {/* Vignette effect */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
          }}
        />
        
        {/* Particelle animate esistenti - aumenta opacità */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#FFD700]/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [-20, 20],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          variants={badgeVariants}
          className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-[#FFD700]/40 rounded-full px-4 py-2 mb-6"
        >
          <Star className="w-4 h-4 text-[#FFD700] animate-pulse" />
          <span className="text-sm text-[#FFD700] font-medium">
            #1 App Fitness in Italia
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          style={{
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)'
          }}
        >
          L'app che trasforma la{' '}
          <span className="text-[#FFD700] inline-block">
            <motion.span
              animate={{
                textShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              motivazione
            </motion.span>
          </span>{' '}
          in{' '}
          <span className="text-[#FFD700] inline-block">
            <motion.span
              animate={{
                textShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              metodo
            </motion.span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Scopri la prima community in Italia che connette atleti e i migliori professionisti del fitness. 
          Entra oggi e crea il percorso più adatto a te!
        </motion.p>

        {/* Metrics Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto"
        >
          <motion.div
            variants={metricVariants}
            whileHover={{ scale: 1.05 }}
            className="bg-black/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-[#FFD700]/40 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#FFD700]" />
              <motion.div
                className="text-2xl sm:text-3xl font-bold text-[#FFD700]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                +{sessioni.toLocaleString('it-IT')}
              </motion.div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              sessioni personalizzate create
            </div>
          </motion.div>

          <motion.div
            variants={metricVariants}
            whileHover={{ scale: 1.05 }}
            className="bg-black/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-[#FFD700]/40 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#FFD700]" />
              <motion.div
                className="text-2xl sm:text-3xl font-bold text-[#FFD700]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {costanza}%
              </motion.div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              ha ritrovato la costanza
            </div>
          </motion.div>

          <motion.div
            variants={metricVariants}
            whileHover={{ scale: 1.05 }}
            className="bg-black/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-[#FFD700]/40 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#FFD700]" />
              <motion.div
                className="text-2xl sm:text-3xl font-bold text-[#FFD700]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {rating}★
              </motion.div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              su App Store
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleStartOnboarding}
              size="lg"
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full group shadow-2xl hover:shadow-[#FFD700]/40 transition-all duration-300 backdrop-blur-sm"
            >
              <motion.span
                className="inline-flex items-center"
                whileHover={{ x: -2 }}
              >
                Scopri il tuo piano in 60 secondi ⚡
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
            </Button>
          </motion.div>

          <motion.p
            className="text-xs sm:text-sm text-gray-400 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Nessuna carta richiesta • 7 giorni Premium inclusi
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-2 bg-[#FFD700] rounded-full mt-2"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

