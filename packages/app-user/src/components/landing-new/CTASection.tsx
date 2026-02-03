import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Gift, Shield } from 'lucide-react';
import { safeLocalStorage } from '@pp/shared/utils/domHelpers';
import { analytics } from '@/services/analytics';

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const navigate = useNavigate();

  const handleStartOnboarding = () => {
    safeLocalStorage.setItem('isOnboarding', 'true');

    analytics.track('CTA Clicked', {
      location: 'final_cta',
      action: 'start_onboarding'
    });

    navigate('/onboarding');
  };

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden" ref={ref}>
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD700]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 relative z-10"
      >
        <div className="bg-black rounded-3xl p-8 md:p-12 border-2 border-[#FFD700] shadow-2xl">
          <div className="text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-block text-5xl mb-4"
            >
              ⚡
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Inizia la tua{' '}
              <span className="text-[#FFD700]">trasformazione</span> oggi
            </h2>
            
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Bastano 60 secondi per scoprire il piano perfetto per te. 
              Nessuna carta di credito richiesta.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 text-white"
              >
                <Zap className="w-5 h-5 text-[#FFD700]" />
                <span>Setup in 60 secondi</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 text-white"
              >
                <Gift className="w-5 h-5 text-[#FFD700]" />
                <span>7 giorni Premium gratis</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-white"
              >
                <Shield className="w-5 h-5 text-[#FFD700]" />
                <span>Cancella quando vuoi</span>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              <Button
                onClick={handleStartOnboarding}
                size="lg"
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold text-lg px-8 py-6 rounded-full group shadow-xl hover:shadow-[#FFD700]/30 hover:scale-105 active:scale-95 transition-transform duration-200"
              >
                Inizia ora gratuitamente
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="text-sm text-gray-300 mt-4"
            >
              Unisciti a oltre 12.000 persone che stanno già trasformando il loro corpo
            </motion.p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

