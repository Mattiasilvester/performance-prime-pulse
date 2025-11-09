import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { 
  Home,
  Dumbbell,
  Trees,
  Clock,
  Info,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

export interface Step3PreferencesHandle {
  handleContinue: () => void;
}

interface Step3PreferencesProps {
  onComplete: () => void;
}

interface TrainingLocation {
  id: string;
  icon: any;
  title: string;
  description: string;
  equipment: string[];
  pros: string[];
  gradient: string;
}

interface TimeOption {
  value: 15 | 30 | 45 | 60;
  label: string;
  description: string;
  ideal: string;
  icon: string;
}

const locations: TrainingLocation[] = [
  {
    id: 'casa',
    icon: Home,
    title: 'Casa',
    description: 'Allenamenti a corpo libero o con attrezzatura minima',
    equipment: ['Corpo libero', 'Elastici', 'Manubri leggeri'],
    pros: ['Zero spostamenti', 'Massima flessibilità', 'Privacy totale'],
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'palestra',
    icon: Dumbbell,
    title: 'Palestra',
    description: 'Accesso completo a pesi e macchinari professionali',
    equipment: ['Bilancieri', 'Macchinari', 'Pesi completi'],
    pros: ['Attrezzatura pro', 'Ambiente motivante', 'Supporto staff'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'outdoor',
    icon: Trees,
    title: 'Outdoor',
    description: 'Allenamenti all\'aperto, parchi o percorsi urbani',
    equipment: ['Corpo libero', 'Panchine', 'Percorsi running'],
    pros: ['Aria fresca', 'Vitamina D', 'Varietà scenari'],
    gradient: 'from-green-500 to-teal-500'
  }
];

const timeOptions: TimeOption[] = [
  {
    value: 15,
    label: '15 min',
    description: 'Express',
    ideal: 'Perfetto per routine mattutine o pause pranzo',
    icon: '⚡'
  },
  {
    value: 30,
    label: '30 min',
    description: 'Standard',
    ideal: 'Bilanciato tra efficacia e praticità',
    icon: '🎯'
  },
  {
    value: 45,
    label: '45 min',
    description: 'Completo',
    ideal: 'Allenamento completo con warm-up e cool-down',
    icon: '💪'
  },
  {
    value: 60,
    label: '60+ min',
    description: 'Intensivo',
    ideal: 'Sessioni complete per risultati massimi',
    icon: '🔥'
  }
];

const Step3Preferences = forwardRef<Step3PreferencesHandle, Step3PreferencesProps>(
  ({ onComplete }, ref) => {
    const { data, updateData } = useOnboardingStore();
    const [selectedLocations, setSelectedLocations] = useState<string[]>(
      data.luoghiAllenamento || []
    );
    const [selectedTime, setSelectedTime] = useState<15 | 30 | 45 | 60>(
      data.tempoSessione || 30
    );
    const [canProceed, setCanProceed] = useState(false);
    const { saveAndContinue, trackStepStarted } = useOnboardingNavigation();

    useEffect(() => {
      trackStepStarted(3);
    }, [trackStepStarted]);

    useEffect(() => {
      setCanProceed(selectedLocations.length > 0);
    }, [selectedLocations]);

    const toggleLocation = (locationId: string) => {
      setSelectedLocations(prev => {
        const newLocations = prev.includes(locationId)
          ? prev.filter(id => id !== locationId)
          : [...prev, locationId];

        console.log('Luoghi aggiornati:', newLocations);

        updateData({
          luoghiAllenamento: newLocations
        });

        return newLocations;
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    const handleTimeSelect = (time: 15 | 30 | 45 | 60) => {
      setSelectedTime(time);
      console.log('Tempo aggiornato:', time);
      updateData({ tempoSessione: time });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    };

    useImperativeHandle(ref, () => ({
      handleContinue: () => {
        if (!canProceed) {
          console.log('⚠️ Step 3: validazione non passata');
          return;
        }

        console.log('✅ Step 3: validazione OK, procedo');

        const payload = {
          luoghiAllenamento: selectedLocations,
          tempoSessione: selectedTime
        };

        updateData(payload);

        saveAndContinue(3, payload);

        trackOnboarding.stepCompleted(3, payload);

        onComplete();
      }
    }));

    const getComboMessage = () => {
      if (selectedLocations.length === 3) {
        return {
          text: "Massima varietà! I tuoi allenamenti non saranno mai noiosi 🌟",
          color: "text-[#FFD700]"
        };
      } else if (selectedLocations.length === 2) {
        return {
          text: "Ottima flessibilità! Potrai adattarti a ogni situazione 💪",
          color: "text-blue-500"
        };
      } else if (selectedLocations.includes('palestra')) {
        return {
          text: "Focus sui risultati! Accesso a tutta l'attrezzatura professionale 🎯",
          color: "text-purple-500"
        };
      } else if (selectedLocations.includes('casa')) {
        return {
          text: "Comodità massima! Allenati quando vuoi senza vincoli 🏠",
          color: "text-cyan-500"
        };
      } else if (selectedLocations.includes('outdoor')) {
        return {
          text: "Natura e fitness! L'aria aperta aumenta energia e motivazione 🌳",
          color: "text-green-500"
        };
      }
      return null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl mx-auto w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-5xl mb-4"
          >
            📍
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white mb-3"
          >
            Dove preferisci allenarti?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-400"
          >
            Puoi selezionare più opzioni per massima flessibilità
          </motion.p>
        </div>

        {/* Location Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {locations.map((location, index) => {
            const Icon = location.icon;
            const isSelected = selectedLocations.includes(location.id);
            
            return (
              <motion.button
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLocation(location.id)}
                className={`
                  relative p-5 rounded-2xl border-2 transition-all duration-300
                  text-left group
                  ${isSelected 
                    ? 'bg-white/10 border-[#FFD700]/50 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2.5 rounded-xl transition-all
                      ${isSelected 
                        ? `bg-gradient-to-br ${location.gradient}` 
                        : 'bg-white/10'}
                    `}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="font-bold text-white text-lg">
                      {location.title}
                    </h3>
                  </div>
                  
                  {/* Checkbox */}
                  <div className={`
                    w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                    ${isSelected 
                      ? 'bg-[#FFD700] border-[#FFD700]' 
                      : 'border-white/30'}
                  `}>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-black" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3">
                  {location.description}
                </p>

                {/* Equipment */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {location.equipment.map((item, i) => (
                    <span
                      key={i}
                      className={`
                        text-xs px-2 py-1 rounded-full transition-all
                        ${isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/5 text-gray-500'}
                      `}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Pros (shown when selected) */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    {location.pros.map((pro, i) => (
                      <div key={i} className="text-xs text-[#FFD700] flex items-center gap-1">
                        <span>✓</span> {pro}
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Combo Message */}
        {selectedLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              <p className={`text-sm font-medium ${getComboMessage()?.color}`}>
                {getComboMessage()?.text}
              </p>
            </div>
          </motion.div>
        )}

        {/* Time Selection */}
        {selectedLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-white">
                Quanto tempo hai per ogni sessione?
              </h3>
            </div>

            {/* Time Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {timeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTimeSelect(option.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${selectedTime === option.value
                      ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/20'}
                  `}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className={`font-bold ${selectedTime === option.value ? 'text-[#FFD700]' : 'text-white'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Time Description */}
            <motion.div
              key={selectedTime}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-xs text-gray-300">
                  {timeOptions.find(t => t.value === selectedTime)?.ideal}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

      </motion.div>
    );
  }
);

Step3Preferences.displayName = 'Step3Preferences';

export default Step3Preferences;


