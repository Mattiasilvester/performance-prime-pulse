import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell,
  Clock,
  Target,
  ChevronDown,
  Play,
  Home,
  TreePine,
  MapPin
} from 'lucide-react';
import { safeLocalStorage } from '@/utils/domHelpers';
import { calculateWorkoutParameters, mapExperienceLevel } from '@/utils/workoutParameters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Mappatura obiettivi tradotti
const OBIETTIVI_TRADOTTI: Record<string, string> = {
  massa: 'Forza e Ipertrofia',
  dimagrire: 'Cardio e Resistenza',
  resistenza: 'Endurance Cardiovascolare',
  tonificare: 'Tonificazione Muscolare'
};

// Interfaccia per esercizio
interface Exercise {
  nome: string;
  serie: number;
  rip: string;
  tempo: string;
  note?: string;
}

// Interfaccia per piano allenamento
interface WorkoutPlan {
  giorno: string;
  tipo: 'Forza' | 'Cardio' | 'HIIT' | 'Recupero';
  luogo: string;
  durata: number;
  esercizi: Exercise[];
  obiettivoTradotto: string;
}

// Props per componente card
interface WorkoutPlanCardProps {
  piano: WorkoutPlan;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onIniziaPiano: (piano: WorkoutPlan) => void;
  onIniziaDopo: (piano: WorkoutPlan) => void;
}

// Helper function per icone luoghi
function getLuogoIcon(luogo: string) {
  const luogoLower = luogo.toLowerCase();
  
  if (luogoLower.includes('casa')) {
    return <Home className="w-6 h-6 text-[#FFD700]" />;
  } else if (luogoLower.includes('palestra')) {
    return <Dumbbell className="w-6 h-6 text-[#FFD700]" />;
  } else if (luogoLower.includes('outdoor') || luogoLower.includes('aperto')) {
    return <TreePine className="w-6 h-6 text-[#FFD700]" />;
  } else {
    return <MapPin className="w-6 h-6 text-[#FFD700]" />;
  }
}

// Componente card singola
function WorkoutPlanCard({ piano, index, isExpanded, onToggle, onIniziaPiano, onIniziaDopo }: WorkoutPlanCardProps) {

  useEffect(() => {
    console.log(`Card ${piano.luogo} - isExpanded changed to:`, isExpanded);
  }, [isExpanded, piano.luogo]);

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== TOGGLE DEBUG ===');
    console.log('Card:', piano.luogo);
    console.log('Index:', index);
    console.log('Current isExpanded:', isExpanded);
    console.log('Target element:', e.currentTarget);
    console.log('Screen width:', window.innerWidth);
    console.log('Is desktop:', window.innerWidth >= 768);
    onToggle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 0 30px rgba(238, 186, 43, 0.3)"
      }}
      transition={{ 
        delay: 0.2 + index * 0.1,
        duration: 0.2
      }}
      className="bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-2xl overflow-hidden hover:border-[#FFD700]/60 transition-all duration-300 cursor-pointer relative"
    >
      {/* Header Card - Cliccabile per espandere */}
      <button
        onClick={handleToggle}
        onMouseDown={(e) => {
          console.log('MouseDown on card:', piano.luogo, 'screen width:', window.innerWidth);
        }}
        className="w-full p-6 text-left transition-all cursor-pointer relative group
        bg-white/5 border-2 border-white/20 rounded-xl mb-4
        hover:border-[#FFD700] hover:bg-white/10
        hover:shadow-lg hover:shadow-[#FFD700]/20 active:scale-[0.99]"
      >
        {/* Indicatore visivo "espandi" */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-400 group-hover:text-[#FFD700] transition-colors z-10">
          <span className="hidden md:inline">
            {isExpanded ? 'Nascondi dettagli' : 'Vedi dettagli'}
          </span>
          <motion.div
            animate={{ 
              rotate: isExpanded ? 180 : 0,
              scale: isExpanded ? 1 : [1, 1.1, 1] // Pulse quando chiusa
            }}
            transition={{ 
              duration: 0.3,
              scale: {
                repeat: isExpanded ? 0 : Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            className="w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center group-hover:bg-[#FFD700]/30 transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-[#FFD700]" />
          </motion.div>
        </div>

        <div className="flex items-start justify-between mb-4 pr-20">
          <div className="flex items-center gap-3">
            {/* Icona luogo */}
            <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
              {getLuogoIcon(piano.luogo)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{piano.luogo}</h3>
              <p className="text-sm text-gray-400">{piano.giorno}</p>
            </div>
          </div>
        </div>

        {/* Info obiettivo e durata */}
        <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
          <div className="flex items-center gap-2 bg-[#FFD700]/10 px-3 py-1 rounded-full">
            <Target className="w-4 h-4 text-[#FFD700]" />
            <span className="text-gray-300">{piano.obiettivoTradotto}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4 text-[#FFD700]" />
            <span className="text-gray-300">{piano.durata} min</span>
          </div>
        </div>

        {/* Preview esercizi - SOLO NUMERO */}
        <p className="text-sm text-gray-400">
          {piano.esercizi.length} esercizi
        </p>
      </button>

      {/* Lista esercizi espandibile */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-6 space-y-3 bg-black/20">
              {piano.esercizi.map((esercizio, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center text-black font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {esercizio.nome}
                      </h4>
                      {esercizio.note && (
                        <p className="text-xs text-gray-400 mb-2">
                          💡 {esercizio.note}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <span className="bg-white/5 px-2 py-1 rounded">
                          <strong className="text-[#FFD700]">Serie:</strong> {esercizio.serie}
                        </span>
                        <span className="bg-white/5 px-2 py-1 rounded">
                          <strong className="text-[#FFD700]">Rip:</strong> {esercizio.rip}
                        </span>
                        <span className="bg-white/5 px-2 py-1 rounded">
                          <strong className="text-[#FFD700]">Riposo:</strong> {esercizio.tempo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottoni azione (sempre visibili) */}
      <div className="p-6 pt-0 space-y-3">
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Previene toggle accordion
            onIniziaPiano(piano);
          }}
          className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold h-12 rounded-xl flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Inizia Piano Personalizzato
        </Button>
        
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Previene toggle accordion
            onIniziaDopo(piano);
          }}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-xl flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Inizia Dopo
        </Button>
      </div>
    </motion.div>
  );
}

export function CompletionScreen() {
  const navigate = useNavigate();
  const { data, completeOnboarding, resetOnboarding } = useOnboardingStore();
  const [piani, setPiani] = useState<WorkoutPlan[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Debug: Verifica store direttamente
  useEffect(() => {
    const storeState = useOnboardingStore.getState();
    console.log('=== STORE STATE DEBUG ===');
    console.log('Store completo:', storeState);
    console.log('Store data:', storeState.data);
    console.log('Store luoghiAllenamento:', storeState.data.luoghiAllenamento);
    console.log('Store tempoSessione:', storeState.data.tempoSessione);
    console.log('=== FINE STORE DEBUG ===');
  }, []);

  // Funzione per generare l'allenamento giornaliero (MANTENUTA DAL CODICE ESISTENTE)
  const generateDailyWorkout = (
    obiettivo: string,
    livelloEsperienza: string,
    luoghi: string[],
    tempoSessione: number
  ) => {
    // Determina il giorno corrente
    const oggi = new Date().getDay();
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const oggiNome = giorni[oggi];
    
    // Luogo per oggi (usa il primo luogo se multipli)
    const luogo = luoghi?.[0] || 'casa';
    
    // Database esercizi con serie/rip basati su livello
    const reps = {
      principiante: { serie: 3, rip: '8-10' },
      intermedio: { serie: 4, rip: '10-12' },
      avanzato: { serie: 5, rip: '12-15' }
    };
    
    const r = reps[livelloEsperienza as keyof typeof reps] || reps.intermedio;
    
    // Esercizi per obiettivo/luogo
    const workouts = {
      dimagrire: {
        casa: [
          { nome: 'Burpees', serie: r.serie, rip: '10-15', tempo: '30s riposo' },
          { nome: 'Mountain climbers', serie: r.serie, rip: '20 (10 per lato)', tempo: '30s riposo' },
          { nome: 'Jump squats', serie: r.serie, rip: r.rip, tempo: '45s riposo' },
          { nome: 'High knees', serie: r.serie, rip: '30 secondi', tempo: '30s riposo' },
          { nome: 'Plank', serie: 3, rip: '30-60 secondi', tempo: '30s riposo' }
        ],
        palestra: [
          { nome: 'Tapis roulant HIIT', serie: 5, rip: '1min veloce/1min lento', tempo: '' },
          { nome: 'Rowing machine', serie: 4, rip: '500m', tempo: '1min riposo' },
          { nome: 'Box jumps', serie: r.serie, rip: '10-12', tempo: '45s riposo' },
          { nome: 'Battle ropes', serie: 4, rip: '30 secondi', tempo: '45s riposo' },
          { nome: 'Kettlebell swings', serie: r.serie, rip: '15-20', tempo: '45s riposo' }
        ],
        outdoor: [
          { nome: 'Sprint intervals', serie: 8, rip: '30s sprint/30s camminata', tempo: '' },
          { nome: 'Scale running', serie: 5, rip: '2 rampe su/giù', tempo: '1min riposo' },
          { nome: 'Jumping jacks', serie: r.serie, rip: '30', tempo: '30s riposo' },
          { nome: 'Affondi camminati', serie: 3, rip: '20 passi', tempo: '45s riposo' },
          { nome: 'Burpees all\'aperto', serie: r.serie, rip: '10', tempo: '45s riposo' }
        ]
      },
      massa: {
        casa: [
          { nome: 'Push-up diamante', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Dip tra sedie', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Pike push-up', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Plank to push-up', serie: 3, rip: '10-12', tempo: '45s riposo' },
          { nome: 'Hindu push-up', serie: r.serie, rip: r.rip, tempo: '60s riposo' }
        ],
        palestra: [
          { nome: 'Panca piana', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Squat', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Stacchi', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Military press', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Remata con bilanciere', serie: r.serie, rip: r.rip, tempo: '90s riposo' }
        ],
        outdoor: [
          { nome: 'Trazioni alla sbarra', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Dip alle parallele', serie: r.serie, rip: r.rip, tempo: '90s riposo' },
          { nome: 'Muscle-up progression', serie: 3, rip: '5-8', tempo: '2min riposo' },
          { nome: 'Pistol squat', serie: 3, rip: '5-8 per lato', tempo: '90s riposo' },
          { nome: 'Wall handstand push-up', serie: 3, rip: '5-10', tempo: '90s riposo' }
        ]
      },
      resistenza: {
        casa: [
          { nome: 'Jumping jacks', serie: 4, rip: '30 secondi', tempo: '30s riposo' },
          { nome: 'Plank hold', serie: 3, rip: '45-60 secondi', tempo: '30s riposo' },
          { nome: 'Wall sit', serie: 3, rip: '30-45 secondi', tempo: '45s riposo' },
          { nome: 'Step-up su sedia', serie: 4, rip: '20 per lato', tempo: '30s riposo' },
          { nome: 'Mountain climbers', serie: 4, rip: '30 secondi', tempo: '30s riposo' }
        ],
        palestra: [
          { nome: 'Cyclette', serie: 1, rip: '20 minuti', tempo: '' },
          { nome: 'Ellittica', serie: 1, rip: '15 minuti', tempo: '' },
          { nome: 'Circuit cardio', serie: 3, rip: '5 esercizi x 1min', tempo: '1min riposo tra giri' },
          { nome: 'Corda', serie: 5, rip: '2 minuti', tempo: '1min riposo' },
          { nome: 'Rowing', serie: 4, rip: '500m', tempo: '1min riposo' }
        ],
        outdoor: [
          { nome: 'Corsa continua', serie: 1, rip: '20-30 minuti', tempo: '' },
          { nome: 'Bike', serie: 1, rip: '30-45 minuti', tempo: '' },
          { nome: 'Nuoto', serie: 4, rip: '200m', tempo: '1min riposo' },
          { nome: 'Trail running', serie: 1, rip: '30-40 minuti', tempo: '' },
          { nome: 'Interval running', serie: 8, rip: '2min corsa/1min camminata', tempo: '' }
        ]
      },
      tonificare: {
        casa: [
          { nome: 'Squat', serie: r.serie, rip: r.rip, tempo: '45s riposo' },
          { nome: 'Affondi', serie: r.serie, rip: r.rip + ' per lato', tempo: '45s riposo' },
          { nome: 'Plank', serie: 3, rip: '45-60 secondi', tempo: '30s riposo' },
          { nome: 'Glute bridge', serie: r.serie, rip: r.rip, tempo: '45s riposo' },
          { nome: 'Side plank', serie: 3, rip: '30-45 secondi per lato', tempo: '30s riposo' }
        ],
        palestra: [
          { nome: 'Leg press', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Cable machine', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'TRX', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Kettlebell', serie: r.serie, rip: r.rip, tempo: '60s riposo' },
          { nome: 'Pulley', serie: r.serie, rip: r.rip, tempo: '60s riposo' }
        ],
        outdoor: [
          { nome: 'Yoga flow', serie: 1, rip: '30-45 minuti', tempo: '' },
          { nome: 'Calisthenics', serie: 4, rip: '10-15 reps', tempo: '45s riposo' },
          { nome: 'Pilates all\'aperto', serie: 1, rip: '30-40 minuti', tempo: '' },
          { nome: 'Bodyweight circuit', serie: 3, rip: '6 esercizi x 45s', tempo: '1min riposo tra giri' },
          { nome: 'Barre workout', serie: 4, rip: '12-15 reps', tempo: '30s riposo' }
        ]
      }
    };
    
    const esercizi = workouts[obiettivo as keyof typeof workouts]?.[luogo as keyof typeof workouts.dimagrire] || workouts.dimagrire.casa;
    
    const tipoWorkout: 'Forza' | 'Cardio' | 'HIIT' | 'Recupero' = oggi % 2 === 0 ? 'Forza' : 'Cardio';
    
    return {
      giorno: oggiNome,
      tipo: tipoWorkout,
      luogo: luogo.charAt(0).toUpperCase() + luogo.slice(1),
      durata: tempoSessione,
      esercizi: esercizi
    };
  };

  // Genera piani multipli basati sui luoghi
  useEffect(() => {
    completeOnboarding();
    
    const generaPiani = () => {
      console.log('=== GENERAZIONE PIANI DEBUG ===');
      console.log('1. Data completa:', data);
      console.log('2. Luoghi allenamento:', data.luoghiAllenamento);
      console.log('3. Tipo luoghi:', Array.isArray(data.luoghiAllenamento) ? 'Array' : typeof data.luoghiAllenamento);
      console.log('4. Numero luoghi:', data.luoghiAllenamento?.length || 0);
      console.log('5. Tempo sessione:', data.tempoSessione);
      console.log('6. Tipo tempo sessione:', typeof data.tempoSessione);
      
      const oggi = new Date();
      const giornoFormattato = oggi.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
      
      // Capitalizza prima lettera
      const giornoCapitalizzato = giornoFormattato.charAt(0).toUpperCase() + giornoFormattato.slice(1);
      
      // FIX BUG 1: Verifica che luoghiAllenamento sia un array valido
      const luoghi = Array.isArray(data.luoghiAllenamento) && data.luoghiAllenamento.length > 0 
        ? data.luoghiAllenamento 
        : ['casa']; // Fallback solo se non c'è array o è vuoto
      
      console.log('7. Luoghi da processare:', luoghi);
      console.log('8. Inizio mapping luoghi...');
      
      const pianiGenerati = luoghi.map((luogo, index) => {
        console.log(`9.${index + 1}. Generazione piano per luogo:`, luogo);
        
        // FIX BUG 2: Usa il tempo sessione corretto (senza fallback a 45)
        const tempoSessione = data.tempoSessione || 45;
        console.log(`10.${index + 1}. Tempo sessione per questo piano:`, tempoSessione);
        
        const piano = generateDailyWorkout(
          data.obiettivo || 'dimagrire',
          data.livelloEsperienza || 'intermedio',
          [luogo], // Solo questo luogo specifico
          tempoSessione
        );
        
        console.log(`11.${index + 1}. Piano generato:`, piano);
        
        const pianoCompleto = {
          ...piano,
          luogo: luogo.charAt(0).toUpperCase() + luogo.slice(1),
          giorno: giornoCapitalizzato,
          obiettivoTradotto: OBIETTIVI_TRADOTTI[data.obiettivo || 'dimagrire'] || data.obiettivo || 'Cardio e Resistenza',
          durata: tempoSessione // FIX BUG 2: Usa il valore corretto
        };
        
        console.log(`12.${index + 1}. Piano completo con durata:`, pianoCompleto.durata);
        
        return pianoCompleto;
      });
      
      console.log('13. Piani generati totali:', pianiGenerati.length);
      console.log('14. Dettaglio piani:', pianiGenerati);
      console.log('15. Durate piani:', pianiGenerati.map(p => p.durata));
      
      setPiani(pianiGenerati);
      console.log('16. State piani aggiornato');
      console.log('=== FINE GENERAZIONE PIANI ===');
    };

    // Simula generazione del piano
    setTimeout(() => {
      generaPiani();
    }, 1000);
  }, [data, completeOnboarding]);

  const normalizeTimeValue = (value?: string | null, fallback: string = '45s') => {
    if (!value) return fallback;
    let cleaned = value.toLowerCase();
    cleaned = cleaned.replace(/riposo/g, '').replace(/resto?/g, '');
    cleaned = cleaned.replace(/secondi?/g, 's');
    cleaned = cleaned.replace(/sec/g, 's');
    cleaned = cleaned.replace(/minuti?/g, 'min');
    cleaned = cleaned.replace(/minutes?/g, 'min');
    cleaned = cleaned.replace(/\s+/g, '');
    if (!cleaned.match(/\d/)) {
      return fallback;
    }
    return cleaned;
  };

  const convertToActiveWorkoutFormat = (piano: WorkoutPlan) => {
    console.log('=== CONVERSIONE ESERCIZI CON PARAMETRI DINAMICI ===');
    console.log('Livello utente:', data.livelloEsperienza);
    console.log('Obiettivo utente:', data.obiettivo);
    console.log('Luogo allenamento:', piano.luogo);

    const level = mapExperienceLevel(data.livelloEsperienza);

    return piano.esercizi.map((esercizio, index) => {
      const params = calculateWorkoutParameters(
        esercizio.nome,
        data.livelloEsperienza,
        data.obiettivo
      );

      console.log(`\nEsercizio ${index + 1}: ${esercizio.nome}`);
      console.log('- Serie:', params.sets);
      console.log('- Ripetizioni:', params.reps);
      console.log('- Riposo:', params.rest);

      return {
        name: esercizio.nome,
        duration: normalizeTimeValue(params.reps, '45s'),
        rest: normalizeTimeValue(params.rest, '30s'),
        sets: params.sets,
        instructions: esercizio.note || undefined,
        muscleGroup: piano.obiettivoTradotto,
        level
      };
    });
  };

  const handleIniziaPiano = async (piano: WorkoutPlan) => {
    console.log('=== AVVIO PIANO PERSONALIZZATO ===');
    console.log('Piano:', piano);

    try {
      const exercisesFormatted = convertToActiveWorkoutFormat(piano);
      console.log('Esercizi convertiti:', exercisesFormatted);

      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        const { error } = await supabase
          .from('workout_plans')
          .upsert({
            user_id: userData.user.id,
            nome: `Piano ${piano.luogo}`,
            tipo: piano.tipo,
            luogo: piano.luogo,
            obiettivo: data.obiettivo,
            durata: piano.durata,
            esercizi: piano.esercizi,
            created_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id,luogo'
          });

        if (error) {
          console.error('Errore salvataggio piano:', error);
        } else {
          console.log('Piano salvato su Supabase');
        }
      }

      navigate('/workouts', {
        state: {
          startCustomWorkout: 'personalized',
          customExercises: exercisesFormatted,
          workoutTitle: `Piano Personalizzato - ${piano.luogo}`,
          workoutType: piano.tipo,
          duration: piano.durata
        },
        replace: true
      });
    } catch (error) {
      console.error('Errore avvio piano:', error);
      toast({
        title: 'Errore durante l’avvio',
        description: 'Si è verificato un problema nell’avvio del piano. Riprova.',
        duration: 4000,
        className: 'bg-gradient-to-r from-black to-[#1a1a1a] border-2 border-red-500 text-white'
      });
    }
  };

  const handleIniziaDopo = async (clickedPiano: WorkoutPlan) => {
    console.log('=== SALVA TUTTI I PIANI PER DOPO ===');
    console.log('Piano cliccato:', clickedPiano.luogo);
    console.log('Piani totali da salvare:', piani.length);
    console.log('Piani:', piani.map(p => p.luogo));

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        toast({
          title: 'Accesso richiesto',
          description: 'Devi essere loggato per salvare i piani.',
          duration: 4000,
          className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 text-white fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md p-6 rounded-xl shadow-2xl'
        });
        return;
      }

      const timestamp = new Date().toISOString();

      const pianiDaSalvare = piani.map(piano => ({
        user_id: userData.user.id,
        nome: `Piano ${piano.luogo}`,
        tipo: piano.tipo,
        luogo: piano.luogo,
        obiettivo: data.obiettivo,
        durata: piano.durata,
        esercizi: piano.esercizi,
        created_at: timestamp,
        updated_at: timestamp,
        is_active: true,
        saved_for_later: true
      }));

      console.log('Salvataggio di', pianiDaSalvare.length, 'piani...');

      const { data: upsertedPlans, error } = await supabase
        .from('workout_plans')
        .upsert(pianiDaSalvare, {
          onConflict: 'user_id,luogo'
        })
        .select()
        .order('luogo', { ascending: true });

      if (error) {
        console.error('Errore salvataggio piani:', error);
        console.error('Error details:', {
          code: (error as any)?.code,
          message: error.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        });
        toast({
          title: 'Errore durante il salvataggio',
          description: `${error.message}. Riprova o contatta l’assistenza.`,
          duration: 5000,
          className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 text-white whitespace-pre-line fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md p-6 rounded-xl shadow-2xl'
        });
        return;
      }

      const pianiSalvati = upsertedPlans?.length || pianiDaSalvare.length;
      const luoghi = piani.map(p => p.luogo).join(', ');

      let titoloToast = '';
      if (pianiSalvati === 1) {
        titoloToast = '1 piano salvato!';
      } else {
        titoloToast = `${pianiSalvati} piani salvati!`;
      }

      console.log('✅ Tutti i piani salvati:', upsertedPlans);
      console.log('✅ Salvati', pianiSalvati, 'piani su Supabase');

      toast({
        title: titoloToast,
        description: `${luoghi}\n\nLi troverai nella dashboard.`,
        duration: 3500,
        className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD700] text-white whitespace-pre-line fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md p-6 rounded-xl shadow-2xl'
      });

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Errore salvataggio piani:', error);
      toast({
        title: 'Errore durante il salvataggio',
        description: 'Si è verificato un problema nel salvataggio dei piani. Riprova.',
        duration: 4000,
        className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 text-white fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md p-6 rounded-xl shadow-2xl'
      });
    }
  };

  const toggleCard = (luogo: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(luogo)) {
        newSet.delete(luogo);
      } else {
        newSet.add(luogo);
      }
      console.log('Expanded cards set:', Array.from(newSet));
      return newSet;
    });
  };

  const handleContinue = () => {
    safeLocalStorage.removeItem('isOnboarding');
    
    // Reset onboarding dopo completamento
    resetOnboarding();
    
    navigate('/auth/register', { 
      state: { 
        fromOnboarding: true,
        prefilledData: {
          nome: data.nome,
          eta: data.eta
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header con titolo e descrizione */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 bg-[#FFD700] rounded-full flex items-center justify-center"
          >
            <Dumbbell className="w-10 h-10 text-black" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {piani.length === 1 ? 'Il Tuo Piano Personalizzato' : 'I Tuoi Piani Personalizzati'}
          </h1>
          
          <p className="text-gray-400 text-lg">
            Abbiamo creato {piani.length} {piani.length === 1 ? 'piano' : 'piani'} su misura per te
          </p>
        </div>

        {/* Grid di card (1, 2 o 3 colonne) */}
        {piani.length > 0 ? (
          <div className={`grid gap-6 mb-8 ${
            piani.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
            piani.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {piani.map((piano, index) => (
              <WorkoutPlanCard 
                key={piano.luogo}
                piano={piano}
                index={index}
                isExpanded={expandedCards.has(piano.luogo)}
                onToggle={() => toggleCard(piano.luogo)}
                onIniziaPiano={handleIniziaPiano}
                onIniziaDopo={handleIniziaDopo}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <Dumbbell className="w-8 h-8 text-[#FFD700]" />
            </motion.div>
            <p className="text-white font-medium">Generazione piani in corso...</p>
          </div>
        )}

        {/* Bottone Continua (opzionale, se necessario) */}
        <div className="text-center mt-8">
          <Button
            onClick={handleContinue}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Continua
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
