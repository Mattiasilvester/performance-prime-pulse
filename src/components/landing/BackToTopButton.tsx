import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const buttonVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.8
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95
  }
};

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Mostra/nascondi in base allo scroll
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Controlla posizione iniziale
    toggleVisibility();

    // Aggiungi listener per scroll
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Scroll to top smooth
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          whileHover="hover"
          whileTap="tap"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 
                     w-12 h-12 md:w-14 md:h-14
                     bg-[#FFD700] hover:bg-[#FFD700]/90
                     rounded-full 
                     flex items-center justify-center
                     shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]
                     transition-shadow duration-300
                     cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Torna in cima"
        >
          <ArrowUp className="w-6 h-6 text-black" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

