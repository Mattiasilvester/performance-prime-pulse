import { Heart, Dumbbell, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StartTodayButton } from './StartTodayButton';
import { useState } from 'react';
import { generateFilteredStrengthWorkout, generateFilteredHIITWorkout, generateWorkout } from '@/services/workoutGenerator';

const categories = [
  {
    id: 'cardio',
    name: 'Cardio',
    description: 'Brucia calorie e migliora la resistenza',
    duration: '60 min',
    icon: Heart,
    iconBgColor: 'bg-[#004AAD]',
    iconColor: '#38B6FF',
    workouts: 12,
  },
  {
    id: 'strength',
    name: 'Forza',
    description: 'Costruisci massa muscolare',
    duration: '60 min',
    icon: Dumbbell,
    iconBgColor: 'bg-[#EF4136]',
    iconColor: '#BC1823',
    workouts: 18,
  },
  {
    id: 'hiit',
    name: 'HIIT',
    description: 'Allenamento ad alta intensità',
    duration: '60 min',
    icon: Zap,
    iconBgColor: 'bg-[#FF5757]',
    iconColor: '#FFD400',
    workouts: 8,
  },
  {
    id: 'mobility',
    name: 'Mobilità',
    description: 'Stretching e flessibilità',
    duration: '10-20 min',
    icon: Activity,
    iconBgColor: 'bg-[#8C52FF]',
    iconColor: '#FF66C4',
    workouts: 15,
  },
];

interface WorkoutCategoriesProps {
  onStartWorkout: (workoutId: string, duration?: number, generatedWorkout?: any) => void;
}

export const WorkoutCategories = ({ onStartWorkout }: WorkoutCategoriesProps) => {
  // Stati per i filtri
  const [showFilters, setShowFilters] = useState<{ [key: string]: boolean }>({});
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('Tutti');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('Tutte');
  const [durationFilter, setDurationFilter] = useState<string>('Tutte');
  const [levelFilter, setLevelFilter] = useState<string>('Tutti');
  
  // AGGIUNGI questi stati se non esistono già
  const [userLevel, setUserLevel] = useState('INTERMEDIO');
  const [quickMode, setQuickMode] = useState(false);

  const handleCategoryClick = (category: typeof categories[0]) => {
    // Se è Forza, HIIT, CARDIO o MOBILITÀ, mostra i filtri
    if (category.id === 'strength' || category.id === 'hiit' || category.id === 'cardio' || category.id === 'mobility') {
      setShowFilters(prev => ({
        ...prev,
        [category.id]: !prev[category.id]
      }));
      
      // Resetta stati quando apri i filtri per mobility
      if (category.id === 'mobility') {
        setUserLevel('INTERMEDIO');
        setQuickMode(false);
      }
    } else {
      // Per altre categorie, usa il comportamento normale
      onStartWorkout(category.id);
    }
  };

  // Funzione per avviare allenamento FORZA con filtri
  const handleStartFilteredStrengthWorkout = () => {
    const workout = generateFilteredStrengthWorkout(muscleGroupFilter, equipmentFilter, 60, userLevel as 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO');
    onStartWorkout('strength', 60, workout);
    // Reset filtri dopo l'avvio
    setShowFilters(prev => ({ ...prev, strength: false }));
  };

  // Funzione per avviare allenamento HIIT con filtri
  const handleStartFilteredHIITWorkout = () => {
    const workout = generateFilteredHIITWorkout(durationFilter, levelFilter, 60, userLevel as 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO');
    onStartWorkout('hiit', 60, workout);
    // Reset filtri dopo l'avvio
    setShowFilters(prev => ({ ...prev, hiit: false }));
  };

  // Funzione per avviare allenamento CARDIO con filtri
  const handleStartCardioWorkout = (level: string, quick: boolean) => {
    const duration = quick ? 10 : 60;
    const workout = generateWorkout('cardio', duration, {}, level as 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO', quick);
    onStartWorkout('cardio', duration, workout);
    setShowFilters({});
  };

  // Funzione per avviare allenamento MOBILITÀ con filtri
  const handleStartMobilityWorkout = (level: string, quick: boolean) => {
    // Usa valori di default se undefined
    const selectedLevel = level || 'INTERMEDIO';
    const isQuickMode = quick !== undefined ? quick : false;
    const duration = isQuickMode ? 10 : 15;
    
    const workout = generateWorkout('mobility', duration, {}, selectedLevel as 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO', isQuickMode);
    onStartWorkout('mobility', duration, workout);
    setShowFilters({});
  };
  return (
    <div className="space-y-6">
      {/* Pulsante Inizia allenamento di oggi */}
      <StartTodayButton />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="bg-gradient-to-r from-black to-[#C89116] rounded-2xl shadow-lg border-2 border-black overflow-hidden hover:shadow-xl hover:shadow-pp-gold/20 transition-all duration-300 hover:scale-105"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`${category.iconBgColor} rounded-xl p-2 sm:p-3 flex items-center justify-center`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: category.iconColor }} />
                  </div>
                  <span className="text-sm text-white/80">{category.workouts} workout</span>
                </div>
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-pp-gold mb-1 sm:mb-2">{category.name}</h3>
                  <p className="text-white text-xs sm:text-sm mb-2 sm:mb-3">{category.description}</p>
                  
                  {/* Filtri per FORZA */}
                  {category.id === 'strength' && showFilters[category.id] && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Gruppo Muscolare</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutti', 'Petto', 'Schiena', 'Spalle', 'Braccia', 'Gambe', 'Core'].map((group) => (
                              <button
                                key={group}
                                onClick={() => setMuscleGroupFilter(group)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  muscleGroupFilter === group
                                    ? 'bg-[#EEBA2B] text-black'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                              >
                                {group}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Attrezzatura</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutte', 'Corpo libero', 'Manubri', 'Bilanciere', 'Elastici', 'Kettlebell'].map((equipment) => (
                              <button
                                key={equipment}
                                onClick={() => setEquipmentFilter(equipment)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  equipmentFilter === equipment
                                    ? 'bg-[#EEBA2B] text-black'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                              >
                                {equipment}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-600">
                          <Button 
                            onClick={handleStartFilteredStrengthWorkout}
                            className="w-full bg-[#EEBA2B] hover:bg-[#D4A017] text-black font-semibold"
                          >
                            AVVIA ALLENAMENTO FORZA
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Filtri per HIIT */}
                  {category.id === 'hiit' && showFilters[category.id] && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Durata</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutte', '5-10 min', '15-20 min', '25-30 min'].map((duration) => (
                              <button
                                key={duration}
                                onClick={() => setDurationFilter(duration)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  durationFilter === duration
                                    ? 'bg-[#EEBA2B] text-black'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                              >
                                {duration}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Livello</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutti', 'Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                              <button
                                key={level}
                                onClick={() => setLevelFilter(level)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  levelFilter === level
                                    ? 'bg-[#EEBA2B] text-black'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-600">
                          <Button 
                            onClick={handleStartFilteredHIITWorkout}
                            className="w-full bg-[#EEBA2B] hover:bg-[#D4A017] text-black font-semibold"
                          >
                            AVVIA ALLENAMENTO HIIT
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">{category.duration}</span>
                  <Button 
                    onClick={() => handleCategoryClick(category)}
                    className="bg-black hover:bg-gray-900 text-white border border-white/20"
                  >
                    Inizia
                  </Button>
                </div>
              </div>

              {/* Filtri per CARDIO - stesso stile di FORZA */}
              {category.id === 'cardio' && showFilters[category.id] && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Livello</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setUserLevel(level.toUpperCase())}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              userLevel === level.toUpperCase()
                                ? 'bg-[#EEBA2B] text-black'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Modalità</h4>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setQuickMode(false)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            !quickMode
                              ? 'bg-[#EEBA2B] text-black'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          ⏱️ Standard
                        </button>
                        <button
                          onClick={() => setQuickMode(true)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            quickMode
                              ? 'bg-[#EEBA2B] text-black'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          ⚡ Quick 10min
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-600">
                      <Button 
                        onClick={() => handleStartCardioWorkout(userLevel, quickMode)}
                        className="w-full bg-[#EEBA2B] hover:bg-[#D4A017] text-black font-semibold"
                      >
                        AVVIA ALLENAMENTO CARDIO
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtri per MOBILITÀ - stesso stile di FORZA/CARDIO */}
              {category.id === 'mobility' && showFilters[category.id] && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Livello</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setUserLevel(level.toUpperCase())}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              userLevel === level.toUpperCase()
                                ? 'bg-[#EEBA2B] text-black'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Modalità</h4>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setQuickMode(false)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            !quickMode
                              ? 'bg-[#EEBA2B] text-black'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          ⏱️ Standard
                        </button>
                        <button
                          onClick={() => setQuickMode(true)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            quickMode
                              ? 'bg-[#EEBA2B] text-black'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          ⚡ Quick 10min
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-600">
                      <Button 
                        onClick={() => {
                          handleStartMobilityWorkout(userLevel, quickMode);
                        }}
                        className="w-full bg-[#EEBA2B] hover:bg-[#D4A017] text-black font-semibold"
                      >
                        AVVIA ALLENAMENTO MOBILITÀ
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's Recommended */}
      <div className="bg-gradient-to-r from-black to-[#C89116] rounded-2xl p-4 sm:p-6 border-2 border-black">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-pp-gold">Consigliato per Oggi</h3>
            <p className="text-white mb-3 sm:mb-4 text-sm sm:text-base">HIIT Total Body - Perfetto per il tuo livello</p>
            <Button 
              onClick={() => onStartWorkout('recommended')}
              className="bg-black text-white hover:bg-gray-900 border border-white/20"
            >
              Inizia Workout
            </Button>
          </div>
          <div className="hidden md:block">
            <Zap className="h-16 w-16 text-white" />
          </div>
        </div>
      </div>

    </div>
  );
};
