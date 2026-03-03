import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface IPhoneMockupProps {
  children: ReactNode;
  delay?: number;
  index: number;
  className?: string;
}

export function IPhoneMockup({ children, delay = 0, index, className = '' }: IPhoneMockupProps) {
  // Varianti per animazione scroll reveal
  const containerVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateY: -10
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateY: 0,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Calcolo offset per layout sfalsato (solo desktop)
  const getOffset = () => {
    // Su mobile/tablet non c'è offset
    if (index === 0) return { x: 0, y: 0 }; // Primo: sinistra, alto
    if (index === 1) return { x: 20, y: 40 }; // Secondo: centro, medio
    return { x: 40, y: 80 }; // Terzo: destra, basso
  };

  const offset = getOffset();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{
        scale: 1.02,
        rotateY: 2,
        transition: { duration: 0.3 }
      }}
      className={`relative ${className} iphone-mockup-container`}
      style={{
        // Offset applicato solo su desktop (>= 1024px)
        // Su mobile/tablet viene sovrascritto da CSS inline
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {/* iPhone Frame */}
      <div className="relative mx-auto w-full max-w-[280px] md:max-w-[300px] lg:max-w-[320px]">
        {/* Ombra sotto il telefono */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-6 md:h-8 bg-black/30 blur-2xl rounded-full" />
        
        {/* Cornice iPhone */}
        <div className="relative bg-[#1a1a1a] rounded-[2.5rem] md:rounded-[3rem] p-1.5 md:p-2 shadow-2xl">
          {/* Notch / Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-5 md:h-6 bg-[#1a1a1a] rounded-b-xl md:rounded-b-2xl z-10" />
          
          {/* Schermo interno */}
          <div className="relative bg-black rounded-[2rem] md:rounded-[2.5rem] overflow-hidden aspect-[9/19.5]">
            {/* Status bar placeholder */}
            <div className="absolute top-0 left-0 right-0 h-6 md:h-8 bg-black/50 z-10 flex items-center justify-between px-4 md:px-6 text-white text-[10px] md:text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 md:w-4 md:h-2 border border-white rounded-sm" />
                <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-white rounded-full" />
              </div>
            </div>
            
            {/* Contenuto schermo - aspect ratio mantenuto */}
            <div className="absolute inset-0 pt-6 md:pt-8 overflow-hidden">
              <div className="h-full w-full overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

