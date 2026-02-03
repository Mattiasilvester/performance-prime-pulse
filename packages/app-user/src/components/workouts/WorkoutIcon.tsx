import { Heart, Dumbbell, Zap, Activity, LucideIcon } from 'lucide-react';

/**
 * Configurazione icone workout - sincronizzata con WorkoutCategories
 * Ogni tipo ha: icona Lucide React, colore sfondo, colore icona
 */
interface WorkoutIconConfig {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

const WORKOUT_ICONS: Record<string, WorkoutIconConfig> = {
  // Cardio - Icona blu con cuore azzurro
  cardio: {
    icon: Heart,
    iconBgColor: 'bg-[#004AAD]',
    iconColor: '#38B6FF',
  },
  
  // Forza - Icona rossa con manubrio rosso scuro
  strength: {
    icon: Dumbbell,
    iconBgColor: 'bg-[#EF4136]',
    iconColor: '#BC1823',
  },
  forza: {
    icon: Dumbbell,
    iconBgColor: 'bg-[#EF4136]',
    iconColor: '#BC1823',
  },
  
  // HIIT - Icona rossa/arancione con fulmine giallo
  hiit: {
    icon: Zap,
    iconBgColor: 'bg-[#FF5757]',
    iconColor: '#FFD400',
  },
  
  // Mobilità - Icona viola con activity rosa
  mobility: {
    icon: Activity,
    iconBgColor: 'bg-[#8C52FF]',
    iconColor: '#FF66C4',
  },
  mobilità: {
    icon: Activity,
    iconBgColor: 'bg-[#8C52FF]',
    iconColor: '#FF66C4',
  },
  mobilita: {
    icon: Activity,
    iconBgColor: 'bg-[#8C52FF]',
    iconColor: '#FF66C4',
  },
  
  // Default (usa Forza come fallback)
  default: {
    icon: Dumbbell,
    iconBgColor: 'bg-[#EF4136]',
    iconColor: '#BC1823',
  },
};

/**
 * Dimensioni disponibili per le icone
 */
const SIZE_CLASSES = {
  sm: {
    container: 'h-10 w-10 p-2',
    icon: 'h-5 w-5',
  },
  md: {
    container: 'h-12 w-12 p-2.5',
    icon: 'h-6 w-6',
  },
  lg: {
    container: 'h-16 w-16 p-3',
    icon: 'h-8 w-8',
  },
};

interface WorkoutIconProps {
  /**
   * Tipo di workout (es: 'cardio', 'forza', 'strength', 'hiit', 'mobility')
   * Se non riconosciuto, prova a indovinare dal nome
   */
  type?: string | null;
  
  /**
   * Nome del workout per fallback se il tipo non è disponibile
   */
  workoutName?: string;
  
  /**
   * Dimensione dell'icona
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Classi CSS aggiuntive per il container
   */
  className?: string;
}

/**
 * Componente WorkoutIcon - Icona completa con container colorato
 * Replica esattamente il design di WorkoutCategories
 * 
 * @example
 * <WorkoutIcon type="cardio" size="md" />
 * <WorkoutIcon type={workout.workout_type} workoutName={workout.workout_name} />
 */
export const WorkoutIcon: React.FC<WorkoutIconProps> = ({ 
  type,
  workoutName,
  size = 'md',
  className = '' 
}) => {
  // Normalizza il tipo
  const normalizedType = type?.toLowerCase().trim() || '';
  
  // 1. Prova prima con workoutType se disponibile
  let iconConfig: WorkoutIconConfig | undefined = WORKOUT_ICONS[normalizedType];
  
  // 2. Fallback: prova a indovinare dal nome del workout
  if (!iconConfig && workoutName) {
    const nameLower = workoutName.toLowerCase();
    
    if (nameLower.includes('cardio')) {
      iconConfig = WORKOUT_ICONS.cardio;
    } else if (nameLower.includes('forza') || nameLower.includes('strength') || nameLower.includes('upper body') || nameLower.includes('lower body')) {
      iconConfig = WORKOUT_ICONS.strength;
    } else if (nameLower.includes('hiit') || nameLower.includes('high intensity')) {
      iconConfig = WORKOUT_ICONS.hiit;
    } else if (nameLower.includes('mobilità') || nameLower.includes('mobility') || nameLower.includes('mobilita')) {
      iconConfig = WORKOUT_ICONS.mobility;
    }
  }
  
  // 3. Default se non trovato
  if (!iconConfig) {
    iconConfig = WORKOUT_ICONS.default;
  }
  
  const Icon = iconConfig.icon;
  const sizeClasses = SIZE_CLASSES[size];
  
  return (
    <div 
      className={`
        ${iconConfig.iconBgColor} 
        ${sizeClasses.container}
        rounded-xl 
        flex items-center justify-center
        flex-shrink-0
        ${className}
      `}
    >
      <Icon 
        className={sizeClasses.icon} 
        style={{ color: iconConfig.iconColor }} 
      />
    </div>
  );
};


