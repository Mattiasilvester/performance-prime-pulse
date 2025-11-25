import { useState, useRef, useEffect } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bot,
  Send,
  ArrowLeft,
  Save,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import type { WorkoutPlan } from '@/types/plan';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTION_CHIPS = [
  "Sostituisci un esercizio",
  "Aggiungi esercizio per braccia",
  "Riduci il numero di serie",
  "Rendi l'allenamento più breve",
  "Aggiungi più cardio",
];

interface PlanModificationChatProps {
  onSave: () => void;
  isSaving: boolean;
}

export function PlanModificationChat({ onSave, isSaving }: PlanModificationChatProps) {
  const { generatedPlan, setGeneratedPlan, prevStep } = usePlanCreationStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const plan = generatedPlan as WorkoutPlan;

  // Messaggio iniziale di PrimeBot
  useEffect(() => {
    if (messages.length === 0 && plan) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Ciao! 👋 Sono qui per aiutarti a perfezionare il tuo piano "${plan?.name || 'personalizzato'}".

Puoi chiedermi di:
- Sostituire un esercizio specifico
- Aggiungere esercizi per un gruppo muscolare
- Ridurre o aumentare serie/ripetizioni
- Rendere l'allenamento più breve o più lungo

Cosa vorresti modificare?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [plan]);

  // Auto-scroll ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing || !plan) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simula elaborazione e parsing
    setTimeout(() => {
      const response = processModificationRequest(inputValue.trim(), plan);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Se la modifica è stata applicata, aggiorna il piano
      if (response.modifiedPlan) {
        setGeneratedPlan(response.modifiedPlan);
      }

      setIsProcessing(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackToPreview = () => {
    prevStep();
  };

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nessun piano disponibile</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="
        flex items-center justify-between
        p-4 
        bg-gradient-to-r from-purple-900/30 to-blue-900/30 
        border-b border-purple-500/30
      "
      >
        <div className="flex items-center gap-3">
          <div
            className="
            w-10 h-10 
            bg-gradient-to-br from-purple-500 to-blue-500 
            rounded-full 
            flex items-center justify-center
          "
          >
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">PrimeBot</h3>
            <p className="text-xs text-gray-400">Modifica il tuo piano</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleBackToPreview}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Salva Piano
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="
        flex-1 
        overflow-y-auto 
        p-4 
        space-y-4
        bg-black/20
      "
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3">
            <div
              className="
              w-8 h-8 
              bg-gradient-to-br from-purple-500 to-blue-500 
              rounded-full 
              flex items-center justify-center
              animate-pulse
            "
            >
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-black/20 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Suggerimenti:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(chip)}
                className="
                  px-3 py-1.5
                  text-xs
                  bg-purple-500/20
                  border border-purple-500/30
                  rounded-full
                  text-purple-300
                  hover:bg-purple-500/30
                  transition-colors
                "
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        className="
        p-4 
        bg-black/20
        border-t border-white/10
      "
      >
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi la tua richiesta..."
            disabled={isProcessing}
            className="
              flex-1
              bg-black/30
              border-white/20
              text-white
              placeholder:text-gray-500
              focus:border-purple-500
            "
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Bolla messaggio singola
 */
interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
        flex items-start gap-3 max-w-[80%]
        ${isUser ? 'flex-row-reverse' : ''}
      `}
      >
        {/* Avatar */}
        {!isUser && (
          <div
            className="
            w-8 h-8 
            bg-gradient-to-br from-purple-500 to-blue-500 
            rounded-full 
            flex items-center justify-center
            flex-shrink-0
          "
          >
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}

        {/* Bubble */}
        <div
          className={`
          px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-black/40 border border-white/10 text-gray-200 rounded-bl-md'
          }
        `}
        >
          <p className="text-sm whitespace-pre-line">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Sistema di parsing MVP per richieste di modifica
 * Riconosce intent comuni con regex e keyword matching
 */
interface ModificationResponse {
  message: string;
  modifiedPlan: WorkoutPlan | null;
}

function processModificationRequest(
  request: string,
  plan: WorkoutPlan
): ModificationResponse {
  const lowerRequest = request.toLowerCase();

  // INTENT: Sostituire esercizio
  if (
    lowerRequest.includes('sostituisci') ||
    lowerRequest.includes('cambia esercizio') ||
    lowerRequest.includes('rimpiazza')
  ) {
    return handleReplaceExercise(request, plan);
  }

  // INTENT: Aggiungere esercizio
  if (
    lowerRequest.includes('aggiungi') ||
    lowerRequest.includes('inserisci') ||
    lowerRequest.includes('metti')
  ) {
    return handleAddExercise(request, plan);
  }

  // INTENT: Rimuovere esercizio
  if (
    lowerRequest.includes('rimuovi') ||
    lowerRequest.includes('elimina') ||
    lowerRequest.includes('togli')
  ) {
    return handleRemoveExercise(request, plan);
  }

  // INTENT: Ridurre serie/ripetizioni/durata
  if (
    lowerRequest.includes('riduci') ||
    lowerRequest.includes('diminuisci') ||
    lowerRequest.includes('meno') ||
    lowerRequest.includes('più breve') ||
    lowerRequest.includes('più corto')
  ) {
    return handleReduceIntensity(request, plan);
  }

  // INTENT: Aumentare serie/ripetizioni/durata
  if (
    lowerRequest.includes('aumenta') ||
    lowerRequest.includes('più serie') ||
    lowerRequest.includes('più ripetizioni') ||
    lowerRequest.includes('più intenso') ||
    lowerRequest.includes('più lungo')
  ) {
    return handleIncreaseIntensity(request, plan);
  }

  // INTENT: Più cardio
  if (lowerRequest.includes('cardio') || lowerRequest.includes('aerobico')) {
    return handleAddCardio(request, plan);
  }

  // INTENT: Domande informative sul piano
  if (
    lowerRequest.includes('quali esercizi') ||
    lowerRequest.includes('cosa devo fare') ||
    lowerRequest.includes('mostrami') ||
    lowerRequest.includes('fammi vedere') ||
    lowerRequest.includes('che allenamento') ||
    // Giorni con accento
    lowerRequest.includes('lunedì') ||
    lowerRequest.includes('martedì') ||
    lowerRequest.includes('mercoledì') ||
    lowerRequest.includes('giovedì') ||
    lowerRequest.includes('venerdì') ||
    lowerRequest.includes('sabato') ||
    lowerRequest.includes('domenica') ||
    // Giorni senza accento
    lowerRequest.includes('lunedi') ||
    lowerRequest.includes('martedi') ||
    lowerRequest.includes('mercoledi') ||
    lowerRequest.includes('giovedi') ||
    lowerRequest.includes('venerdi') ||
    // Abbreviazioni
    (lowerRequest.includes('lun') && !lowerRequest.includes('lunatic')) ||
    (lowerRequest.includes('mar') && !lowerRequest.includes('march')) ||
    (lowerRequest.includes('mer') && !lowerRequest.includes('mercury')) ||
    (lowerRequest.includes('gio') && !lowerRequest.includes('gioco')) ||
    (lowerRequest.includes('ven') && !lowerRequest.includes('vent')) ||
    lowerRequest.includes('sab') ||
    lowerRequest.includes('dom') ||
    lowerRequest.includes('oggi') ||
    lowerRequest.includes('quanti esercizi')
  ) {
    return handleShowPlanInfo(request, plan);
  }

  // INTENT non riconosciuto
  return {
    message: `Non ho capito esattamente cosa vuoi modificare. 🤔

Prova a essere più specifico, ad esempio:
- "Sostituisci le flessioni con i push-up diamond"
- "Aggiungi un esercizio per i bicipiti"
- "Riduci le serie a 3"
- "Rendi l'allenamento più breve"

Come posso aiutarti?`,
    modifiedPlan: null,
  };
}

/**
 * Handler: Sostituisci esercizio
 */
function handleReplaceExercise(request: string, plan: WorkoutPlan): ModificationResponse {
  // Per MVP, sostituiamo il primo esercizio con uno alternativo
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  if (modifiedPlan.workouts?.[0]?.exercises?.length > 0) {
    const exercises = modifiedPlan.workouts[0].exercises;
    const oldExercise = exercises[0].nome || exercises[0].name;

    // Sostituisci con alternativa generica
    exercises[0] = {
      ...exercises[0],
      nome: 'Esercizio Alternativo',
      name: 'Esercizio Alternativo',
    };

    return {
      message: `✅ Ho sostituito "${oldExercise}" con "Esercizio Alternativo".

Se vuoi un esercizio specifico, dimmi quale vorresti al suo posto!`,
      modifiedPlan,
    };
  }

  return {
    message: `Non ho trovato esercizi da sostituire nel piano. 🤔`,
    modifiedPlan: null,
  };
}

/**
 * Handler: Aggiungi esercizio
 */
function handleAddExercise(request: string, plan: WorkoutPlan): ModificationResponse {
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  // Determina gruppo muscolare dalla richiesta
  let muscleGroup = 'Generale';
  let exerciseName = 'Nuovo Esercizio';

  if (request.toLowerCase().includes('braccia') || request.toLowerCase().includes('bicipiti')) {
    muscleGroup = 'Braccia';
    exerciseName = 'Curl con Manubri';
  } else if (request.toLowerCase().includes('petto')) {
    muscleGroup = 'Petto';
    exerciseName = 'Croci ai Cavi';
  } else if (request.toLowerCase().includes('schiena')) {
    muscleGroup = 'Schiena';
    exerciseName = 'Lat Machine';
  } else if (request.toLowerCase().includes('gambe')) {
    muscleGroup = 'Gambe';
    exerciseName = 'Leg Press';
  } else if (request.toLowerCase().includes('spalle')) {
    muscleGroup = 'Spalle';
    exerciseName = 'Alzate Laterali';
  } else if (request.toLowerCase().includes('core') || request.toLowerCase().includes('addominali')) {
    muscleGroup = 'Core';
    exerciseName = 'Plank';
  }

  const newExercise = {
    nome: exerciseName,
    name: exerciseName,
    serie: 3,
    sets: 3,
    ripetizioni: 12,
    reps: 12,
    recupero: '60s',
    rest: '60s',
  };

  if (modifiedPlan.workouts?.[0]?.exercises) {
    modifiedPlan.workouts[0].exercises.push(newExercise);
  }

  return {
    message: `✅ Ho aggiunto "${exerciseName}" per ${muscleGroup} al tuo piano!

L'esercizio è stato inserito con 3 serie da 12 ripetizioni. Vuoi modificare qualcos'altro?`,
    modifiedPlan,
  };
}

/**
 * Handler: Rimuovi esercizio
 */
function handleRemoveExercise(request: string, plan: WorkoutPlan): ModificationResponse {
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  if (modifiedPlan.workouts?.[0]?.exercises?.length > 1) {
    const exercises = modifiedPlan.workouts[0].exercises;
    const removedExercise = exercises.pop();
    const removedName = removedExercise?.nome || removedExercise?.name || 'ultimo esercizio';

    return {
      message: `✅ Ho rimosso "${removedName}" dal tuo piano.

Ora hai ${exercises.length} esercizi. Vuoi modificare qualcos'altro?`,
      modifiedPlan,
    };
  }

  return {
    message: `Non posso rimuovere esercizi: il piano deve avere almeno 1 esercizio! 💪`,
    modifiedPlan: null,
  };
}

/**
 * Handler: Riduci intensità/durata
 */
function handleReduceIntensity(request: string, plan: WorkoutPlan): ModificationResponse {
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  if (modifiedPlan.workouts?.[0]?.exercises) {
    modifiedPlan.workouts[0].exercises.forEach((ex: any) => {
      // Riduci serie da X a X-1 (minimo 2)
      const currentSets = ex.serie || ex.sets || 3;
      const newSets = Math.max(2, currentSets - 1);
      ex.serie = newSets;
      ex.sets = newSets;
    });

    return {
      message: `✅ Ho ridotto le serie di tutti gli esercizi!

L'allenamento sarà più breve ma comunque efficace. Vuoi altre modifiche?`,
      modifiedPlan,
    };
  }

  return {
    message: `Non sono riuscito a modificare l'intensità. 🤔`,
    modifiedPlan: null,
  };
}

/**
 * Handler: Aumenta intensità/durata
 */
function handleIncreaseIntensity(request: string, plan: WorkoutPlan): ModificationResponse {
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  if (modifiedPlan.workouts?.[0]?.exercises) {
    modifiedPlan.workouts[0].exercises.forEach((ex: any) => {
      // Aumenta serie da X a X+1 (massimo 5)
      const currentSets = ex.serie || ex.sets || 3;
      const newSets = Math.min(5, currentSets + 1);
      ex.serie = newSets;
      ex.sets = newSets;
    });

    return {
      message: `✅ Ho aumentato le serie di tutti gli esercizi!

L'allenamento sarà più intenso. Preparati a sudare! 💪 Vuoi altre modifiche?`,
      modifiedPlan,
    };
  }

  return {
    message: `Non sono riuscito a modificare l'intensità. 🤔`,
    modifiedPlan: null,
  };
}

/**
 * Handler: Aggiungi cardio
 */
function handleAddCardio(request: string, plan: WorkoutPlan): ModificationResponse {
  const modifiedPlan = JSON.parse(JSON.stringify(plan)) as WorkoutPlan;

  const cardioExercises = [
    {
      nome: 'Jumping Jacks',
      name: 'Jumping Jacks',
      serie: 3,
      sets: 3,
      ripetizioni: 30,
      reps: 30,
      recupero: '30s',
      rest: '30s',
    },
    {
      nome: 'Burpees',
      name: 'Burpees',
      serie: 3,
      sets: 3,
      ripetizioni: 10,
      reps: 10,
      recupero: '45s',
      rest: '45s',
    },
    {
      nome: 'Mountain Climbers',
      name: 'Mountain Climbers',
      serie: 3,
      sets: 3,
      ripetizioni: 20,
      reps: 20,
      recupero: '30s',
      rest: '30s',
    },
  ];

  // Aggiungi un esercizio cardio random
  const randomCardio =
    cardioExercises[Math.floor(Math.random() * cardioExercises.length)];

  if (modifiedPlan.workouts?.[0]?.exercises) {
    modifiedPlan.workouts[0].exercises.push(randomCardio);
  }

  return {
    message: `✅ Ho aggiunto "${randomCardio.nome}" al tuo piano per aumentare la componente cardio!

${randomCardio.serie} serie da ${randomCardio.ripetizioni} ripetizioni con ${randomCardio.recupero} di recupero. Vuoi altre modifiche?`,
    modifiedPlan,
  };
}

/**
 * Handler: Mostra informazioni sul piano (domande informative)
 */
function handleShowPlanInfo(request: string, plan: WorkoutPlan): ModificationResponse {
  const lowerRequest = request.toLowerCase();

  // Mappa giorni italiani a indici
  const dayMap: Record<string, number> = {
    // Con accento
    'lunedì': 0,
    'martedì': 1,
    'mercoledì': 2,
    'giovedì': 3,
    'venerdì': 4,
    'sabato': 5,
    'domenica': 6,
    // Senza accento
    'lunedi': 0,
    'martedi': 1,
    'mercoledi': 2,
    'giovedi': 3,
    'venerdi': 4,
    // Abbreviazioni comuni
    'lun': 0,
    'mar': 1,
    'mer': 2,
    'gio': 3,
    'ven': 4,
    'sab': 5,
    'dom': 6,
  };

  // Pattern distribuzione (stesso di WeeklyPlanWorkouts)
  const getDistributionPattern = (frequency: number): number[] => {
    const patterns: Record<number, number[]> = {
      2: [0, 3],
      3: [0, 2, 4],
      4: [0, 1, 3, 4],
      5: [0, 1, 2, 3, 4],
      6: [0, 1, 2, 3, 4, 5],
      7: [0, 1, 2, 3, 4, 5, 6],
    };
    return patterns[frequency] || patterns[3];
  };

  // Cerca giorno specifico nella richiesta
  let targetDayIndex: number | null = null;
  let targetDayName: string = '';

  for (const [dayName, dayIndex] of Object.entries(dayMap)) {
    if (lowerRequest.includes(dayName)) {
      targetDayIndex = dayIndex;
      targetDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      break;
    }
  }

  const workouts = plan.workouts || [];
  const frequency = plan.frequency_per_week || workouts.length || 3;
  const pattern = getDistributionPattern(frequency);
  const isDaily = plan.plan_type === 'daily';

  // Se è piano giornaliero, mostra gli esercizi direttamente
  if (isDaily) {
    const workout = workouts[0];
    const exercises = workout?.exercises || [];

    if (exercises.length === 0) {
      return {
        message: `Il tuo piano giornaliero non ha ancora esercizi. Vuoi che ne aggiunga qualcuno?`,
        modifiedPlan: null,
      };
    }

    let exerciseList = exercises
      .map((ex: any, i: number) => {
        const name = ex.nome || ex.name || 'Esercizio';
        const sets = ex.serie || ex.sets || 3;
        const reps = ex.ripetizioni || ex.reps || 12;
        return `${i + 1}. ${name} - ${sets}x${reps}`;
      })
      .join('\n');

    return {
      message: `📋 **Il tuo workout di oggi include ${exercises.length} esercizi:**

${exerciseList}

Vuoi modificare qualcosa? Posso sostituire, aggiungere o rimuovere esercizi!`,
      modifiedPlan: null,
    };
  }

  // Se è piano settimanale e ha chiesto un giorno specifico
  if (targetDayIndex !== null) {
    // Verifica se quel giorno ha un workout
    const workoutIndex = pattern.indexOf(targetDayIndex);

    if (workoutIndex === -1) {
      // Giorno di riposo
      return {
        message: `🧘 **${targetDayName}** è un giorno di riposo nel tuo piano.

I tuoi giorni di allenamento sono: ${pattern
          .map((i) => ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][i])
          .join(', ')}.

Vuoi modificare la distribuzione settimanale?`,
        modifiedPlan: null,
      };
    }

    // Ha un workout
    const workout = workouts[workoutIndex];
    const exercises = workout?.exercises || [];
    const workoutName = workout?.nome || workout?.name || `Workout ${workoutIndex + 1}`;

    if (exercises.length === 0) {
      return {
        message: `📅 **${targetDayName}** hai "${workoutName}" ma non ho i dettagli degli esercizi.

Vuoi che ti mostri la struttura generale del piano?`,
        modifiedPlan: null,
      };
    }

    let exerciseList = exercises
      .map((ex: any, i: number) => {
        const name = ex.nome || ex.name || 'Esercizio';
        const sets = ex.serie || ex.sets || 3;
        const reps = ex.ripetizioni || ex.reps || 12;
        return `${i + 1}. ${name} - ${sets}x${reps}`;
      })
      .join('\n');

    return {
      message: `📅 **${targetDayName} - ${workoutName}**

${exerciseList}

Vuoi modificare qualcosa di questo workout?`,
      modifiedPlan: null,
    };
  }

  // Domanda generica sul piano (senza giorno specifico)
  const totalExercises = workouts.reduce((sum: number, w: any) => {
    return sum + (w.exercises?.length || 0);
  }, 0);
  const dayNames = pattern.map((i) => ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i]).join(', ');

  return {
    message: `📊 **Riepilogo del tuo piano "${plan.name || 'Personalizzato'}":**

- Tipo: ${isDaily ? 'Giornaliero' : 'Settimanale'}
- Obiettivo: ${plan.goal || 'Non specificato'}
${!isDaily ? `- Durata: ${plan.duration_weeks || '?'} settimane` : ''}
${!isDaily ? `- Frequenza: ${frequency}x/settimana (${dayNames})` : ''}
- Workout totali: ${workouts.length}
- Esercizi totali: ${totalExercises}

Chiedimi di un giorno specifico per vedere gli esercizi, es: "Cosa devo fare lunedì?"

Oppure dimmi cosa vuoi modificare!`,
    modifiedPlan: null,
  };
}


