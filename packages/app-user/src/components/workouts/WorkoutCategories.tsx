import { Heart, Dumbbell, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StartTodayButton } from './StartTodayButton';
import { useState } from 'react';
import { generateFilteredStrengthWorkout, generateFilteredHIITWorkout, generateWorkout } from '@/services/workoutGenerator';

const categoryStyles: Record<string, { color: string; bgOpacity: string; circleBg: string }> = {
  cardio: { color: '#10B981', bgOpacity: 'rgba(16,185,129,0.1)', circleBg: 'rgba(16,185,129,0.03)' },
  strength: { color: '#EEBA2B', bgOpacity: 'rgba(238,186,43,0.08)', circleBg: 'rgba(238,186,43,0.03)' },
  hiit: { color: '#EF4444', bgOpacity: 'rgba(239,68,68,0.1)', circleBg: 'rgba(239,68,68,0.03)' },
  mobility: { color: '#A855F7', bgOpacity: 'rgba(168,85,247,0.1)', circleBg: 'rgba(168,85,247,0.03)' },
};

const categories = [
  {
    id: 'cardio',
    name: 'Cardio',
    description: 'Brucia calorie e migliora la resistenza',
    duration: '60 min',
    icon: Heart,
    iconColor: '#10B981',
    workouts: 12,
  },
  {
    id: 'strength',
    name: 'Forza',
    description: 'Costruisci massa muscolare',
    duration: '60 min',
    icon: Dumbbell,
    iconColor: '#EEBA2B',
    workouts: 18,
  },
  {
    id: 'hiit',
    name: 'HIIT',
    description: 'Allenamento ad alta intensità',
    duration: '60 min',
    icon: Zap,
    iconColor: '#EF4444',
    workouts: 8,
  },
  {
    id: 'mobility',
    name: 'Mobilità',
    description: 'Stretching e flessibilità',
    duration: '10-20 min',
    icon: Activity,
    iconColor: '#A855F7',
    workouts: 15,
  },
];

/** Workout generato (es. da workoutGenerator) con esercizi e meta */
interface GeneratedWorkoutShape {
  name?: string;
  title?: string;
  exercises?: { name: string; duration?: string | number; rest?: string | number }[];
  meta?: { workoutTitle?: string; workoutType?: string; duration?: number | string };
}

interface WorkoutCategoriesProps {
  onStartWorkout: (workoutId: string, duration?: number, generatedWorkout?: GeneratedWorkoutShape) => void;
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
      <StartTodayButton />

      <div className="grid grid-cols-2 gap-3 items-stretch">
        {categories.map((category) => {
          const Icon = category.icon;
          const style = categoryStyles[category.id] ?? categoryStyles.strength;
          return (
            <div
              key={category.id}
              className="relative flex flex-col h-full bg-[#16161A] rounded-[14px] p-5 border border-[rgba(255,255,255,0.06)] overflow-hidden"
            >
              <div
                className="absolute -top-2.5 -right-2.5 w-[60px] h-[60px] rounded-full"
                style={{ background: style.circleBg }}
                aria-hidden
              />
              <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="mb-3 flex items-center justify-center w-10 h-10 rounded-[10px] shrink-0" style={{ background: style.bgOpacity }}>
                  <Icon className="h-6 w-6" style={{ color: category.iconColor }} />
                </div>
                <h3 className="text-base font-bold text-[#F0EDE8]">{category.name}</h3>
                <p className="text-xs text-[#8A8A96] mb-3 line-clamp-2 min-h-[32px]">{category.description}</p>
                <span
                  className="inline-block text-[11px] font-semibold rounded-full py-0.5 px-2.5"
                  style={{ color: style.color, background: style.bgOpacity }}
                >
                  {category.workouts} workout
                </span>
                <div className="mt-3">
                  {/* Filtri per FORZA */}
                  {category.id === 'strength' && showFilters[category.id] && (
                    <div className="mt-4 p-3 bg-[#1E1E24] rounded-[14px] border border-[rgba(255,255,255,0.06)]">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Gruppo Muscolare</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutti', 'Petto', 'Schiena', 'Spalle', 'Braccia', 'Gambe', 'Core'].map((group) => (
                              <button
                                key={group}
                                onClick={() => setMuscleGroupFilter(group)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  muscleGroupFilter === group
                                    ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                    : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                                }`}
                              >
                                {group}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Attrezzatura</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutte', 'Corpo libero', 'Manubri', 'Bilanciere', 'Elastici', 'Kettlebell'].map((equipment) => (
                              <button
                                key={equipment}
                                onClick={() => setEquipmentFilter(equipment)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  equipmentFilter === equipment
                                    ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                    : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                                }`}
                              >
                                {equipment}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                          <Button
                            onClick={handleStartFilteredStrengthWorkout}
                            className="w-full font-semibold border-0"
                            style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
                          >
                            AVVIA ALLENAMENTO FORZA
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Filtri per HIIT */}
                  {category.id === 'hiit' && showFilters[category.id] && (
                    <div className="mt-4 p-3 bg-[#1E1E24] rounded-[14px] border border-[rgba(255,255,255,0.06)]">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Durata</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutte', '5-10 min', '15-20 min', '25-30 min'].map((duration) => (
                              <button
                                key={duration}
                                onClick={() => setDurationFilter(duration)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  durationFilter === duration
                                    ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                    : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                                }`}
                              >
                                {duration}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Livello</h4>
                          <div className="flex flex-wrap gap-1">
                            {['Tutti', 'Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                              <button
                                key={level}
                                onClick={() => setLevelFilter(level)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  levelFilter === level
                                    ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                    : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                          <Button
                            onClick={handleStartFilteredHIITWorkout}
                            className="w-full font-semibold border-0"
                            style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
                          >
                            AVVIA ALLENAMENTO HIIT
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtri per CARDIO - stesso stile di FORZA */}
              {category.id === 'cardio' && showFilters[category.id] && (
                <div className="mt-4 p-3 bg-[#1E1E24] rounded-[14px] border border-[rgba(255,255,255,0.06)]">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Livello</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setUserLevel(level.toUpperCase())}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              userLevel === level.toUpperCase()
                                ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Modalità</h4>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setQuickMode(false)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            !quickMode
                              ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                              : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                          }`}
                        >
                          ⏱️ Standard
                        </button>
                        <button
                          onClick={() => setQuickMode(true)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            quickMode
                              ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                              : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                          }`}
                        >
                          ⚡ Quick 10min
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <Button
                        onClick={() => handleStartCardioWorkout(userLevel, quickMode)}
                        className="w-full font-semibold border-0"
                        style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
                      >
                        AVVIA ALLENAMENTO CARDIO
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtri per MOBILITÀ - stesso stile di FORZA/CARDIO */}
              {category.id === 'mobility' && showFilters[category.id] && (
                <div className="mt-4 p-3 bg-[#1E1E24] rounded-[14px] border border-[rgba(255,255,255,0.06)]">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Livello</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Principiante', 'Intermedio', 'Avanzato'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setUserLevel(level.toUpperCase())}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              userLevel === level.toUpperCase()
                                ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                                : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[#F0EDE8] font-semibold mb-2 text-sm">Modalità</h4>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setQuickMode(false)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            !quickMode
                              ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                              : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                          }`}
                        >
                          ⏱️ Standard
                        </button>
                        <button
                          onClick={() => setQuickMode(true)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            quickMode
                              ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                              : 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] text-[#8A8A96]'
                          }`}
                        >
                          ⚡ Quick 10min
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <Button
                        onClick={() => handleStartMobilityWorkout(userLevel, quickMode)}
                        className="w-full font-semibold border-0"
                        style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
                      >
                        AVVIA ALLENAMENTO MOBILITÀ
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="text-xs text-[#8A8A96]">{category.duration}</span>
                <Button
                  onClick={() => handleCategoryClick(category)}
                  className="bg-[#EEBA2B] hover:bg-[#D4A017] text-[#0A0A0C] font-semibold text-sm border-0"
                >
                  Inizia
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#16161A] rounded-[14px] p-5 border border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F0EDE8] mb-1">Consigliato per Oggi</h3>
            <p className="text-[13px] text-[#8A8A96] mb-3">HIIT Total Body - Perfetto per il tuo livello</p>
            <Button
              onClick={() => onStartWorkout('recommended')}
              className="font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
            >
              Inizia Workout
            </Button>
          </div>
          <div className="hidden md:block">
            <Zap className="h-12 w-12 text-[#EEBA2B]" />
          </div>
        </div>
      </div>

    </div>
  );
};
