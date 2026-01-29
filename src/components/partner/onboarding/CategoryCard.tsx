import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cloneElement, isValidElement } from 'react';

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}

export function CategoryCard({ icon, label, value, selected, onClick }: CategoryCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex flex-col items-center justify-center
        p-3 sm:p-5
        min-h-[85px] sm:min-h-[110px]
        rounded-xl border-2
        transition-all duration-200
        ${selected
          ? 'border-[var(--partner-accent)] bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* Icona */}
      <div className={`
        w-9 h-9 sm:w-11 sm:h-11
        rounded-lg 
        flex items-center justify-center
        mb-1.5 sm:mb-2
        shrink-0
        ${selected ? 'bg-[var(--partner-accent)]' : 'bg-gray-100'}
      `}>
        {isValidElement(icon) 
          ? cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: `w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${selected ? 'text-white' : 'text-gray-500'}`,
            })
          : <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${selected ? 'text-white' : 'text-gray-500'}`}>
              {icon}
            </span>
        }
      </div>
      
      {/* Label */}
      <span className={`
        text-xs sm:text-sm font-medium text-center leading-tight
        ${selected ? 'text-[var(--partner-accent)]' : 'text-gray-700'}
      `}>
        {label}
      </span>
      
      {/* Check icon quando selezionato */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--partner-accent)] flex items-center justify-center"
        >
          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

