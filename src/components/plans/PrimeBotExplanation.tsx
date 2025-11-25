import {
  Bot,
  Sparkles,
  Check,
  ChevronRight,
  Target,
  Calendar,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import type { WorkoutPlan } from '@/types/plan';

interface ExplanationData {
  title: string;
  intro: string;
  benefits: string[];
  structure: string;
  results: string[];
  cta: string;
}

export function PrimeBotExplanation() {
  const { generatedPlan, nextStep } = usePlanCreationStore();

  if (!generatedPlan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nessun piano generato</p>
      </div>
    );
  }

  const explanation = generateExplanation(generatedPlan as WorkoutPlan);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Avatar PrimeBot */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className="
            w-20 h-20 
            bg-gradient-to-br from-purple-500 to-blue-500 
            rounded-full 
            flex items-center justify-center
            animate-pulse
          "
          >
            <Bot className="h-10 w-10 text-white" />
          </div>

          {/* Cerchi animati */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
          <div className="absolute inset-[-8px] rounded-full border-2 border-blue-500/20 animate-pulse" />
        </div>
      </div>

      {/* Box messaggio */}
      <div
        className="
        bg-gradient-to-br from-purple-900/30 to-blue-900/30 
        border-2 border-purple-500/30 
        rounded-2xl p-8
      "
      >
        {/* Header con nome PrimeBot */}
        <div className="flex items-center gap-3 mb-6">
          <Bot className="h-6 w-6 text-purple-400" />
          <div>
            <span className="text-lg font-semibold text-white">PrimeBot</span>
            <span className="text-sm text-gray-400 ml-2">Il tuo AI Coach</span>
          </div>
        </div>

        {/* Contenuto spiegazione */}
        <div className="space-y-6">
          {/* Titolo */}
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-white">{explanation.title}</h3>
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>

          {/* Intro */}
          <p className="text-gray-300 text-lg leading-relaxed">{explanation.intro}</p>

          {/* Benefici */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Check className="h-5 w-5 text-green-400" />
              Perché questo piano è perfetto per te:
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {explanation.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Struttura/Cosa allena */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              {generatedPlan.plan_type === 'daily' ? (
                <>
                  <Target className="h-5 w-5 text-purple-400" />
                  Il workout di oggi include:
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5 text-purple-400" />
                  Struttura del piano:
                </>
              )}
            </h4>
            <div
              className="
              bg-black/20 
              border border-white/10 
              rounded-lg p-4
              text-gray-300
              whitespace-pre-line
            "
            >
              {explanation.structure}
            </div>
          </div>

          {/* Risultati attesi */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Seguendo questo piano con costanza:
            </h4>
            <div className="space-y-2">
              {explanation.results.map((result, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              {explanation.cta}
            </p>
          </div>
        </div>
      </div>

      {/* Bottone Preview */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={nextStep}
          size="lg"
          className="
            bg-gradient-to-r from-purple-600 to-blue-600 
            hover:from-purple-500 hover:to-blue-500
            text-white font-bold
            px-8
          "
        >
          Vedi Preview del Piano
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Genera spiegazione personalizzata in base al piano
 */
function generateExplanation(plan: WorkoutPlan): ExplanationData {
  const isPlanDaily = plan.plan_type === 'daily';

  // PIANO GIORNALIERO
  if (isPlanDaily) {
    return generateDailyExplanation(plan);
  }

  // PIANO SETTIMANALE
  return generateWeeklyExplanation(plan);
}

/**
 * Genera spiegazione per piano giornaliero
 */
function generateDailyExplanation(plan: WorkoutPlan): ExplanationData {
  const goal = (plan.goal as string) || 'Full Body';
  const workout = plan.workouts?.[0];
  const workoutCount = workout?.exercises?.length || 0;

  return {
    title: `${plan.name} 🏋️`,

    intro: `Ho creato per te un allenamento ${goal} perfetto per oggi! Con ${workoutCount} esercizi mirati, questo workout ti darà risultati concreti in poco tempo.`,

    benefits: [
      'Allenamento completo ed efficace',
      'Ottimizzato per il tempo a disposizione',
      'Esercizi adatti al tuo equipaggiamento',
      'Intensità bilanciata per massimi risultati',
    ],

    structure: generateDailyStructure(plan),

    results: [
      'Tonificazione muscolare visibile',
      'Aumento energia e resistenza',
      'Miglioramento forma fisica generale',
      'Brucia calorie efficacemente',
    ],

    cta: 'Pronto a dare il massimo? 🚀',
  };
}

/**
 * Genera struttura per piano giornaliero
 */
function generateDailyStructure(plan: WorkoutPlan): string {
  const workout = plan.workouts?.[0];
  if (!workout || !workout.exercises) {
    return 'Workout personalizzato pronto per te!';
  }

  const exercises = workout.exercises;
  const totalExercises = exercises.length;

  // Raggruppa per gruppo muscolare (stima basata su nome esercizio)
  const groups: Record<string, number> = {};

  exercises.forEach((ex: any) => {
    const name = (ex.nome || ex.name || '').toLowerCase();

    if (name.includes('petto') || name.includes('push') || name.includes('panca')) {
      groups['Petto'] = (groups['Petto'] || 0) + 1;
    } else if (name.includes('schiena') || name.includes('pull') || name.includes('remata')) {
      groups['Schiena'] = (groups['Schiena'] || 0) + 1;
    } else if (
      name.includes('gambe') ||
      name.includes('squat') ||
      name.includes('affondi') ||
      name.includes('stacchi')
    ) {
      groups['Gambe'] = (groups['Gambe'] || 0) + 1;
    } else if (
      name.includes('core') ||
      name.includes('addominali') ||
      name.includes('plank') ||
      name.includes('crunch')
    ) {
      groups['Core'] = (groups['Core'] || 0) + 1;
    } else if (
      name.includes('cardio') ||
      name.includes('burpee') ||
      name.includes('jumping') ||
      name.includes('sprint')
    ) {
      groups['Cardio'] = (groups['Cardio'] || 0) + 1;
    } else {
      groups['Generale'] = (groups['Generale'] || 0) + 1;
    }
  });

  // Genera stringa
  let structure = `${totalExercises} esercizi totali:\n\n`;

  Object.entries(groups).forEach(([group, count]) => {
    structure += `• ${count} esercizi ${group}\n`;
  });

  return structure.trim();
}

/**
 * Genera spiegazione per piano settimanale
 */
function generateWeeklyExplanation(plan: WorkoutPlan): ExplanationData {
  const goal = (plan.goal as string) || 'Fitness generale';
  const duration = plan.duration_weeks || 4;
  const frequency = plan.frequency_per_week || 3;
  const level = plan.level || 'intermediate';

  // Benefici in base al goal
  const benefitsByGoal: Record<string, string[]> = {
    'Aumentare massa muscolare': [
      'Crescita muscolare progressiva e bilanciata',
      'Sovraccarico progressivo programmato',
      'Recupero ottimale tra gruppi muscolari',
      'Varietà esercizi per massima stimolazione',
    ],
    'Perdere peso': [
      'Alta intensità per massimo consumo calorico',
      'Mix cardio + forza per metabolismo attivo',
      'Progressione graduale per evitare plateau',
      'Brucia calorie anche a riposo',
    ],
    'Migliorare resistenza': [
      'Capacità cardiovascolare potenziata',
      'Più energia nella vita quotidiana',
      'Resistenza mentale e fisica',
      'Sistema cardiorespiratorio più efficiente',
    ],
    'Tonificare': [
      'Definizione muscolare senza volume eccessivo',
      'Riduzione massa grassa',
      'Forme più armoniche',
      'Forza funzionale migliorata',
    ],
    'Mantenersi attivo': [
      'Salute generale migliorata',
      'Abitudini sane consolidate',
      'Benessere fisico e mentale',
      'Mobilità e flessibilità preservate',
    ],
  };

  // Risultati attesi in base a durata
  const resultsByDuration: Record<number, string[]> = {
    4: [
      'Prime modifiche corporee visibili',
      'Miglioramento forza e resistenza',
      'Abitudine all\'allenamento consolidata',
    ],
    8: [
      '+2-4 kg massa muscolare magra (se massa)',
      '+15-25% forza su esercizi principali',
      'Definizione muscolare visibile',
      'Energia e resistenza significativamente migliorate',
    ],
    12: [
      'Trasformazione corporea completa',
      '+4-6 kg massa muscolare (se massa)',
      '+30-40% forza su esercizi principali',
      'Cambiamento lifestyle permanente',
    ],
  };

  return {
    title: `${plan.name} 📅`,

    intro: `Ho creato il tuo piano personalizzato per ${goal.toLowerCase()}! Un programma di ${duration} settimane con ${frequency} allenamenti settimanali, studiato appositamente per il tuo livello ${getLevelLabel(level)}.`,

    benefits: benefitsByGoal[goal] || benefitsByGoal['Mantenersi attivo'],

    structure: generateWeeklyStructure(plan),

    results: resultsByDuration[duration] || resultsByDuration[8],

    cta: 'Pronto a iniziare il tuo percorso di trasformazione? 🚀',
  };
}

/**
 * Genera struttura per piano settimanale
 */
function generateWeeklyStructure(plan: WorkoutPlan): string {
  const duration = plan.duration_weeks || 4;
  const frequency = plan.frequency_per_week || 3;
  const workouts = plan.workouts || [];

  let structure = `PIANO ${duration} SETTIMANE\n`;
  structure += `${frequency} allenamenti a settimana\n\n`;

  if (plan.metadata?.weekly_structure) {
    structure += 'SPLIT SETTIMANALE:\n';
    const weeklyStructure = plan.metadata.weekly_structure as string[];
    weeklyStructure.forEach((day: string) => {
      structure += `• ${day}\n`;
    });
  } else {
    structure += 'WORKOUT INCLUSI:\n';
    workouts.slice(0, 7).forEach((workout: any, i: number) => {
      const name = workout.nome || workout.name || `Workout ${i + 1}`;
      structure += `• ${name}\n`;
    });
  }

  return structure.trim();
}

/**
 * Converte livello in label italiano
 */
function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: 'principiante',
    intermediate: 'intermedio',
    advanced: 'avanzato',
  };
  return labels[level] || 'intermedio';
}


