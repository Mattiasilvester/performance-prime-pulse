/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps -- snapshot/metadata dinamici; dipendenze intenzionali (setStep, buildResponsesSnapshot, initializePlans) */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, MouseEvent, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Button } from '@/components/ui/button';
import {
  Star,
  Dumbbell,
  Clock,
  Target,
  ChevronDown,
  Play,
  Home,
  TreePine,
  MapPin,
} from 'lucide-react';
import { safeLocalStorage } from '@/utils/domHelpers';
import { onboardingService } from '@/services/onboardingService';
import { calculateWorkoutParameters, mapExperienceLevel } from '@/utils/workoutParameters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { OnboardingPreferencesCard } from '@/components/onboarding/OnboardingPreferencesCard';
import { useConfetti } from '@/hooks/useConfetti';

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

interface OnboardingResponsesSnapshot {
  obiettivo?: string | null;
  livello?: string | null;
  giorni?: number | null;
  luoghi?: string[] | null;
  tempo?: number | null;
}

interface WorkoutPlanMetadata {
  obiettivo?: string | null;
  livello?: string | null;
  giorni_settimana?: number | null;
  luoghi?: string[] | null;
  tempo_sessione?: number | null;
  generated_at?: string;
  responses_hash?: string;
}

const DEFAULT_SESSION_DURATION = 45;

const normalizeTempoSessione = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const normalizeLuoghi = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    const valid = value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    return valid.length > 0 ? valid : null;
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return null;
};

const capitalizeFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const formatGeneratedDay = (iso?: string | null) => {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) {
    return 'Piano personalizzato';
  }
  const formatted = date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Props per componente card
interface WorkoutPlanCardProps {
  piano: WorkoutPlan;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onIniziaPiano: (piano: WorkoutPlan) => void;
  onIniziaDopo: (piano: WorkoutPlan) => void;
}

// Helper function per icone luoghi (22px, #EEBA2B)
function getLuogoIcon(luogo: string) {
  const luogoLower = luogo.toLowerCase();
  const iconClass = 'w-[22px] h-[22px] text-[#EEBA2B]';
  if (luogoLower.includes('casa')) return <Home className={iconClass} />;
  if (luogoLower.includes('palestra')) return <Dumbbell className={iconClass} />;
  if (luogoLower.includes('outdoor') || luogoLower.includes('aperto')) return <TreePine className={iconClass} />;
  return <MapPin className={iconClass} />;
}

// Componente card singola
function WorkoutPlanCard({ piano, index, isExpanded, onToggle, onIniziaPiano, onIniziaDopo }: WorkoutPlanCardProps) {
  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.2 }}
      className="bg-[#16161A] border-[1.5px] border-white/[0.07] rounded-[14px] overflow-hidden hover:border-[rgba(238,186,43,0.3)] transition-all relative"
    >
      {/* Header Card - Cliccabile per espandere */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-5 text-left transition-all cursor-pointer relative group"
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-[#F0EDE8]/50 group-hover:text-[#EEBA2B] transition-colors z-10">
          <span className="hidden md:inline">
            {isExpanded ? 'Nascondi dettagli' : 'Vedi dettagli'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-full bg-[rgba(238,186,43,0.12)] flex items-center justify-center group-hover:bg-[rgba(238,186,43,0.2)] transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-[#EEBA2B]" />
          </motion.div>
        </div>

        <div className="flex items-center gap-4 pr-16">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center flex-shrink-0">
            {getLuogoIcon(piano.luogo)}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-[#F0EDE8]">{piano.luogo}</h3>
            <p className="text-[13px] text-[#F0EDE8]/50 mt-0.5">{piano.giorno}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[#10B981] text-[12px] px-[10px] py-[4px] rounded-full">
            <Target className="w-3.5 h-3.5" />
            {piano.obiettivoTradotto}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[#3B82F6] text-[12px] px-[10px] py-[4px] rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {piano.durata} min
          </span>
        </div>

        <p className="text-[13px] text-[#F0EDE8]/50 mt-2">
          {piano.esercizi.length} esercizi
        </p>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/[0.07] px-5 pb-5 pt-4"
          >
            <div className="space-y-3">
              {piano.esercizi.map((esercizio, idx) => (
                <div
                  key={idx}
                  className="bg-[#1E1E24] border border-white/[0.07] rounded-[10px] p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EEBA2B] flex items-center justify-center text-black font-bold flex-shrink-0 text-[13px]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#F0EDE8] text-[14px] mb-1">
                        {esercizio.nome}
                      </h4>
                      {esercizio.note && (
                        <p className="text-[12px] text-[#F0EDE8]/50 mb-2">💡 {esercizio.note}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[12px] text-[#F0EDE8]/70">
                        <span className="bg-white/[0.06] px-2 py-1 rounded"><strong className="text-[#EEBA2B]">Serie:</strong> {esercizio.serie}</span>
                        <span className="bg-white/[0.06] px-2 py-1 rounded"><strong className="text-[#EEBA2B]">Rip:</strong> {esercizio.rip}</span>
                        <span className="bg-white/[0.06] px-2 py-1 rounded"><strong className="text-[#EEBA2B]">Riposo:</strong> {esercizio.tempo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5 pt-0">
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIniziaPiano(piano);
          }}
          className="w-full bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-bold rounded-[10px] py-[13px] mt-4 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Inizia Piano Personalizzato
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onIniziaDopo(piano);
          }}
          className="w-full bg-transparent border border-white/[0.14] text-[#F0EDE8]/70 rounded-[10px] py-[13px] mt-2 hover:border-white/[0.3] flex items-center justify-center gap-2"
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
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const { data, completeOnboarding, resetOnboarding, setStep, currentStep } = useOnboardingStore();
  
  // ✅ FIX URGENTE: Ref per prevenire loop infinito
  const step5SetRef = useRef(false);
  
  // ✅ FIX FINALE: In edit mode, forza currentStep a 6 SOLO al mount (una volta)
  useEffect(() => {
    // Esegui SOLO quando isEditMode diventa true e non abbiamo ancora impostato step 6
    if (isEditMode && !step5SetRef.current) {
      const currentStepValue = useOnboardingStore.getState().currentStep;
      if (currentStepValue !== 6) {
        step5SetRef.current = true;
        setStep(6);
      } else {
        step5SetRef.current = true; // Già a 6, marca come fatto
      }
    }
  }, [isEditMode]); // ✅ SOLO isEditMode nelle dependencies, NO currentStep, NO setStep!
  const [piani, setPiani] = useState<WorkoutPlan[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponses, setCurrentResponses] = useState<OnboardingResponsesSnapshot | null>(null);
  const [latestMetadata, setLatestMetadata] = useState<WorkoutPlanMetadata | null>(null);
  const { toast } = useToast();
  
  // ✅ CONFETTI: Celebrazione al mount del componente (solo se non in edit mode)
  // Si attiva automaticamente quando il componente viene montato per la prima volta
  useConfetti(!isEditMode);
  
  // ✅ FIX: Ref per prevenire loop infinito
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data: authData, error }) => {
      if (error) {
        console.error('Errore recupero utente:', error);
        return;
      }

      if (isMounted) {
        setUser(authData?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const buildResponsesSnapshot = (
    obiettivoData?: Record<string, any> | null,
    esperienzaData?: Record<string, any> | null,
    preferencesData?: Record<string, any> | null
  ): OnboardingResponsesSnapshot => {
    const luoghiFromDb = normalizeLuoghi(preferencesData?.luoghi_allenamento);
    const luoghiFromStore = normalizeLuoghi(data.luoghiAllenamento);
    const tempoFromDb = normalizeTempoSessione(preferencesData?.tempo_sessione);
    const tempoFromStore = normalizeTempoSessione(data.tempoSessione);

    return {
      obiettivo: obiettivoData?.obiettivo ?? data.obiettivo ?? null,
      livello: esperienzaData?.livello_esperienza ?? data.livelloEsperienza ?? null,
      giorni: esperienzaData?.giorni_settimana ?? null,
      luoghi: luoghiFromDb ?? luoghiFromStore ?? ['casa'],
      tempo: tempoFromDb ?? tempoFromStore ?? DEFAULT_SESSION_DURATION
    };
  };

  const buildResponsesHash = (snapshot: OnboardingResponsesSnapshot) =>
    JSON.stringify({
      obiettivo: snapshot.obiettivo ?? null,
      livello: snapshot.livello ?? null,
      giorni: snapshot.giorni ?? null,
      luoghi: snapshot.luoghi ?? null,
      tempo: snapshot.tempo ?? null
    });

  const buildPlanMetadata = (snapshot: OnboardingResponsesSnapshot): WorkoutPlanMetadata => ({
    obiettivo: snapshot.obiettivo ?? null,
    livello: snapshot.livello ?? null,
    giorni_settimana: snapshot.giorni ?? null,
    luoghi: snapshot.luoghi ?? null,
    tempo_sessione: snapshot.tempo ?? null,
    generated_at: new Date().toISOString(),
    responses_hash: buildResponsesHash(snapshot)
  });

  const mapSupabasePlanToWorkoutPlan = useCallback((plan: any): WorkoutPlan => {
    const rawTipo = typeof plan?.tipo === 'string' ? plan.tipo : undefined;
    const tipoValue: WorkoutPlan['tipo'] =
      rawTipo === 'Forza' || rawTipo === 'Cardio' || rawTipo === 'HIIT' || rawTipo === 'Recupero'
        ? rawTipo
        : 'Forza';

    const obiettivoValue = (plan?.obiettivo as string | undefined) ?? data.obiettivo ?? 'dimagrire';
    const durataValue =
      typeof plan?.durata === 'number'
        ? plan.durata
        : normalizeTempoSessione(data.tempoSessione) ?? DEFAULT_SESSION_DURATION;
    const eserciziValue: Exercise[] = Array.isArray(plan?.esercizi) ? (plan.esercizi as Exercise[]) : [];

    const luogoValue =
      typeof plan?.luogo === 'string' && plan.luogo.length > 0 ? capitalizeFirst(plan.luogo) : 'Personalizzato';

    const metadata = (plan?.metadata ?? null) as Record<string, any> | null;

    return {
      giorno: formatGeneratedDay(metadata?.generated_at),
      tipo: tipoValue,
      luogo: luogoValue,
      durata: durataValue,
      esercizi: eserciziValue,
      obiettivoTradotto: OBIETTIVI_TRADOTTI[obiettivoValue] || obiettivoValue
    };
  }, [data]);

  const fetchOnboardingSections = useCallback(async () => {
    if (!user?.id) {
      return null;
    }

    const { data: obiettivoData, error: obiettivoError } = await supabase
      .from('onboarding_obiettivo_principale')
      .select('obiettivo')
      .eq('user_id', user.id)
      .maybeSingle();

    if (obiettivoError) {
      throw obiettivoError;
    }

    const { data: esperienzaData, error: esperienzaError } = await supabase
      .from('onboarding_esperienza')
      .select('livello_esperienza, giorni_settimana')
      .eq('user_id', user.id)
      .maybeSingle();

    if (esperienzaError) {
      throw esperienzaError;
    }

    const { data: preferencesData, error: preferencesError } = await supabase
      .from('onboarding_preferenze')
      .select('luoghi_allenamento, tempo_sessione')
      .eq('user_id', user.id)
      .maybeSingle();

    if (preferencesError) {
      throw preferencesError;
    }

    return {
      obiettivoData,
      esperienzaData,
      preferencesData
    };
  }, [user?.id]);

  const checkAndRegeneratePlan = useCallback(async () => {
    if (!user?.id) {
      return false;
    }

    try {
      const onboardingData = await fetchOnboardingSections();

      if (!onboardingData) {
        return false;
      }

      const snapshot = buildResponsesSnapshot(
        onboardingData.obiettivoData,
        onboardingData.esperienzaData,
        onboardingData.preferencesData
      );
      setCurrentResponses(snapshot);

      const { data: existingPlans, error: existingPlansError } = await supabase
        .from('workout_plans')
        .select('id, metadata')
        .eq('user_id', user.id)
        .eq('source', 'onboarding');

      if (existingPlansError) {
        throw existingPlansError;
      }

      if (!existingPlans || existingPlans.length === 0) {
        return false;
      }

      const planMetadata = (existingPlans[0]?.metadata ?? null) as WorkoutPlanMetadata | null;

      if (planMetadata) {
        setLatestMetadata(planMetadata);
      }

      const currentHash = buildResponsesHash(snapshot);

      if (planMetadata?.responses_hash === currentHash) {
        return false;
      }

      await supabase
        .from('workout_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('source', 'onboarding');

      return true;
    } catch (error) {
      console.error('Errore controllo rigenerazione:', error);
      return false;
    }
  }, [data, fetchOnboardingSections, user?.id]);

  const generateWorkoutPlans = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      let snapshot = currentResponses;

      if (!snapshot) {
        const onboardingData = await fetchOnboardingSections();
        if (!onboardingData) {
          return;
        }
        snapshot = buildResponsesSnapshot(
          onboardingData.obiettivoData,
          onboardingData.esperienzaData,
          onboardingData.preferencesData
        );
        setCurrentResponses(snapshot);
      }

      const luoghi = snapshot.luoghi && snapshot.luoghi.length > 0 ? snapshot.luoghi : ['casa'];
      const tempoSessione = normalizeTempoSessione(snapshot.tempo) ?? DEFAULT_SESSION_DURATION;
      const obiettivoSelezionato = snapshot.obiettivo ?? data.obiettivo ?? 'dimagrire';
      const livelloSelezionato = snapshot.livello ?? data.livelloEsperienza ?? 'intermedio';

      const oggi = new Date();
      const giornoFormattato = oggi.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const giornoCapitalizzato = giornoFormattato.charAt(0).toUpperCase() + giornoFormattato.slice(1);

      const pianiGenerati = luoghi.map((luogo) => {
        const piano = generateDailyWorkout(
          obiettivoSelezionato,
          livelloSelezionato,
          [luogo],
          tempoSessione
        );

        return {
          ...piano,
          luogo: capitalizeFirst(luogo),
          giorno: giornoCapitalizzato,
          obiettivoTradotto: OBIETTIVI_TRADOTTI[obiettivoSelezionato] || obiettivoSelezionato,
          durata: tempoSessione
        };
      });

      const metadata = buildPlanMetadata({
        obiettivo: obiettivoSelezionato,
        livello: livelloSelezionato,
        giorni: snapshot.giorni ?? null,
        luoghi,
        tempo: tempoSessione
      });
      setLatestMetadata(metadata);

      const timestamp = new Date().toISOString();
      const payload = pianiGenerati.map((piano) => ({
        user_id: user.id,
        nome: `Piano ${piano.luogo}`,
        tipo: piano.tipo,
        luogo: piano.luogo,
        obiettivo: obiettivoSelezionato,
        durata: piano.durata,
        esercizi: piano.esercizi,
        created_at: timestamp,
        updated_at: timestamp,
        is_active: true,
        saved_for_later: false,
        source: 'onboarding',
        metadata
      }));

      const { error } = await supabase
        .from('workout_plans')
        .upsert(payload, {
          onConflict: 'user_id,luogo'
        });

      if (error) {
        throw error;
      }

      setPiani(pianiGenerati);
    } catch (error) {
      console.error('Errore generazione piani onboarding:', error);
      toast({
        title: 'Errore generazione piano',
        description: 'Non è stato possibile generare il piano personalizzato. Riprova più tardi.',
        duration: 4000,
        className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 text-white'
      });
    }
  }, [currentResponses, data, fetchOnboardingSections, toast, user?.id]);

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

  useEffect(() => {
    // ✅ FIX: Prevenire loop infinito con ref
    if (hasInitialized.current || !user?.id) {
      return;
    }

    // ✅ FIX PERFORMANCE: Mostra la pagina immediatamente, completa onboarding subito
    hasInitialized.current = true;
    completeOnboarding();

    const initializePlans = async () => {
      try {
        setIsGenerating(true);

        // ✅ FIX PERFORMANCE: Carica PRIMA i piani esistenti (veloce, non bloccante)
        const { data: existingPlans, error } = await supabase
          .from('workout_plans')
          .select('id, nome, tipo, luogo, durata, esercizi, metadata, obiettivo, saved_for_later, user_id, source, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('source', 'onboarding');

        if (error) {
          throw error;
        }

        // ✅ FIX: Se ci sono piani esistenti, mostrali SUBITO (non aspettare checkAndRegeneratePlan)
        if (existingPlans && existingPlans.length > 0) {
          setPiani(existingPlans.map(mapSupabasePlanToWorkoutPlan));

          const firstMetadata = (existingPlans[0]?.metadata ?? null) as WorkoutPlanMetadata | null;
          if (firstMetadata) {
            setLatestMetadata(firstMetadata);
          }
          
          setIsGenerating(false); // ✅ Mostra la pagina immediatamente

          // ✅ Verifica se serve rigenerare in background (non bloccante)
          const needsRegeneration = await checkAndRegeneratePlan();
          
          if (needsRegeneration) {
            toast({
              title: 'Aggiornamento piano',
              description: '🔄 Rilevate modifiche alle risposte, aggiornamento piano in corso...',
              duration: 3500,
              className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD700] text-white'
            });
            // Rigenera in background
            await generateWorkoutPlans();
          }
          
          // ✅ FASE 3: Toast per edit mode anche quando ci sono piani esistenti
          if (isEditMode) {
            toast({
              title: 'Preferenze aggiornate',
              description: '✅ Le tue preferenze sono state aggiornate con successo!',
              duration: 4000,
              className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD700] text-white'
            });
          }
          return; // ✅ Esci subito, pagina già mostrata
        }

        // ✅ Nessun piano esistente, genera nuovi (questo è lento ma necessario)
        const needsRegeneration = await checkAndRegeneratePlan();

        if (needsRegeneration) {
          toast({
            title: 'Aggiornamento piano',
            description: '🔄 Rilevate modifiche alle risposte, aggiornamento piano in corso...',
            duration: 3500,
            className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD700] text-white'
          });
        }

        await generateWorkoutPlans();

        if (needsRegeneration || isEditMode) {
          toast({
            title: isEditMode ? 'Preferenze aggiornate' : 'Piano aggiornato',
            description: isEditMode 
              ? '✅ Le tue preferenze sono state aggiornate con successo!'
              : '✅ Piano aggiornato con le tue nuove risposte!',
            duration: 4000,
            className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD700] text-white'
          });
        }
      } catch (error) {
        console.error('Errore inizializzazione piani:', error);
        toast({
          title: 'Errore durante la generazione',
          description: 'Si è verificato un problema durante il recupero del piano. Riprova.',
          duration: 4000,
          className: 'bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 text-white'
        });
      } finally {
        setIsGenerating(false);
      }
    };

    initializePlans();
    // ✅ FIX: Solo user?.id nelle dipendenze, altre funzioni sono memoizzate o stabili
  }, [user?.id]);

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
    const level = mapExperienceLevel(data.livelloEsperienza);

    return piano.esercizi.map((esercizio) => {
      const params = calculateWorkoutParameters(
        esercizio.nome,
        data.livelloEsperienza,
        data.obiettivo
      );

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
    try {
      const exercisesFormatted = convertToActiveWorkoutFormat(piano);

      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        const metadataPayload =
          latestMetadata ??
          buildPlanMetadata({
            obiettivo: data.obiettivo ?? null,
            livello: data.livelloEsperienza ?? null,
            giorni: currentResponses?.giorni ?? null,
            luoghi: currentResponses?.luoghi ?? [piano.luogo.toLowerCase()],
            tempo:
              currentResponses?.tempo ??
              normalizeTempoSessione(data.tempoSessione) ??
              DEFAULT_SESSION_DURATION
          });

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
            updated_at: new Date().toISOString(),
            is_active: true,
            source: 'onboarding',
            metadata: metadataPayload
          }, {
            onConflict: 'user_id,luogo'
          });

        if (error) {
          console.error('Errore salvataggio piano:', error);
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
      const metadataPayload =
        latestMetadata ??
        buildPlanMetadata({
          obiettivo: data.obiettivo ?? null,
          livello: data.livelloEsperienza ?? null,
          giorni: currentResponses?.giorni ?? null,
          luoghi:
            currentResponses?.luoghi ??
            (piani.length > 0 ? piani.map((plan) => plan.luogo.toLowerCase()) : null),
            tempo:
              currentResponses?.tempo ??
              normalizeTempoSessione(data.tempoSessione) ??
              DEFAULT_SESSION_DURATION
        });

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
        saved_for_later: true,
        source: 'onboarding',
        metadata: metadataPayload
      }));

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
      if (newSet.has(luogo)) newSet.delete(luogo);
      else newSet.add(luogo);
      return newSet;
    });
  };

  const handleContinue = async () => {
    safeLocalStorage.removeItem('isOnboarding');
    resetOnboarding();
    if (user?.id) {
      await onboardingService.markOnboardingComplete(user.id);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header — box icona gold + titolo + sottotitolo (pattern step 1–5) */}
        <div className="text-center mb-10">
          <div
            className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
          >
            <Star size={32} color="#EEBA2B" />
          </div>
          <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold text-[#F0EDE8] text-center leading-[1.15] tracking-[-0.5px] mb-[10px]">
            I Tuoi Piani Personalizzati
          </h1>
          <p className="text-[15px] text-[#F0EDE8]/50 text-center">
            Abbiamo creato piani su misura per te
          </p>
        </div>

        {/* CARD PREFERENZE - AGGIUNTA NUOVA */}
        <div className="mb-8">
          <OnboardingPreferencesCard />
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
            <p className="text-white font-medium">
              {isGenerating ? 'Generazione piani in corso...' : 'Nessun piano disponibile.'}
            </p>
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
