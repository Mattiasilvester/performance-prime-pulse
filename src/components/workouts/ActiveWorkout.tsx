import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseCard } from './ExerciseCard';

const workoutData = {
  cardio: {
    name: 'Cardio Brucia Grassi',
    exercises: [
      { name: 'Jumping Jacks', duration: '30s', rest: '10s' },
      { name: 'High Knees', duration: '30s', rest: '10s' },
      { name: 'Burpees', duration: '30s', rest: '15s' },
      { name: 'Mountain Climbers', duration: '30s', rest: '10s' },
    ],
  },
  strength: {
    name: 'Forza Upper Body',
    exercises: [
      { name: 'Push-ups', duration: '45s', rest: '15s' },
      { name: 'Plank', duration: '60s', rest: '20s' },
      { name: 'Pike Push-ups', duration: '45s', rest: '15s' },
      { name: 'Tricep Dips', duration: '45s', rest: '15s' },
    ],
  },
  recommended: {
    name: 'HIIT Total Body',
    exercises: [
      { name: 'Squat Jumps', duration: '45s', rest: '15s' },
      { name: 'Push-up to T', duration: '45s', rest: '15s' },
      { name: 'Plank Jacks', duration: '45s', rest: '15s' },
      { name: 'Lunge Jumps', duration: '45s', rest: '15s' },
    ],
  },
  hiit: {
    name: 'HIIT Intenso',
    exercises: [
      { name: 'Sprint sul posto', duration: '30s', rest: '10s' },
      { name: 'Jump Squats', duration: '30s', rest: '10s' },
      { name: 'Burpees esplosivi', duration: '30s', rest: '15s' },
      { name: 'High Knees', duration: '30s', rest: '10s' },
    ],
  },
  mobility: {
    name: 'Mobilità e Stretching',
    exercises: [
      { name: 'Cat-Cow Stretch', duration: '60s', rest: '10s' },
      { name: 'Hip Circles', duration: '45s', rest: '10s' },
      { name: 'Shoulder Rolls', duration: '45s', rest: '10s' },
      { name: 'Leg Swings', duration: '60s', rest: '15s' },
    ],
  },
};

interface ActiveWorkoutProps {
  workoutId: string;
  generatedWorkout?: any;
  onClose: () => void;
  onStartExercise: (duration: string, restTime: string) => void;
}

export const ActiveWorkout = ({ workoutId, generatedWorkout, onClose, onStartExercise }: ActiveWorkoutProps) => {
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  
  // Usa l'allenamento generato se disponibile, altrimenti usa quello statico
  const currentWorkout = generatedWorkout || workoutData[workoutId as keyof typeof workoutData];
  
  if (!currentWorkout) {
    return (
      <div className="text-white text-center">
        <p>Allenamento non trovato</p>
        <Button onClick={onClose} className="mt-4">Torna indietro</Button>
      </div>
    );
  }

  const toggleExerciseComplete = (index: number) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter(i => i !== index));
    } else {
      setCompletedExercises([...completedExercises, index]);
    }
  };

  return (
    <div className="bg-black rounded-2xl shadow-sm overflow-hidden border-2 border-[#EEBA2B]">
      <div className="p-6 bg-gradient-to-r from-pp-gold to-yellow-600">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">{currentWorkout.name}</h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="text-black hover:text-pp-gold hover:bg-black/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-4 bg-black/20 rounded-full h-2">
          <div 
            className="bg-black rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedExercises.length / (currentWorkout.exercises?.length || 1)) * 100}%` }}
          />
        </div>
        <p className="text-black mt-2 font-medium">Completa tutti gli esercizi • {currentWorkout.exercises?.length || 0} esercizi</p>
      </div>

      <div className="p-6 space-y-4 bg-black">
        <div className="grid gap-4">
          {currentWorkout.exercises?.map((exercise: any, index: number) => (
            <ExerciseCard
              key={`${exercise.name}-${index}`}
              exercise={exercise}
              index={index}
              isCompleted={completedExercises.includes(index)}
              onToggleComplete={toggleExerciseComplete}
              onStart={() => onStartExercise(exercise.duration, exercise.rest)}
            />
          )) || <p className="text-white">Nessun esercizio disponibile</p>}
        </div>

        {completedExercises.length === (currentWorkout.exercises?.length || 0) && currentWorkout.exercises?.length > 0 && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-semibold">Allenamento Completato! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};