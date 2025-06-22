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
  onClose: () => void;
  onStartExercise: (duration: string, restTime: string) => void;
}

export const ActiveWorkout = ({ workoutId, onClose, onStartExercise }: ActiveWorkoutProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  
  const workout = workoutData[workoutId as keyof typeof workoutData] || workoutData.recommended;
  
  const completeExercise = (index: number) => {
    setCompletedExercises([...completedExercises, index]);
    if (index < workout.exercises.length - 1) {
      setCurrentExercise(index + 1);
    }
  };

  const isCompleted = (index: number) => completedExercises.includes(index);
  
  const getHeaderBackground = () => {
    switch (workoutId) {
      case 'cardio':
        return '#38B6FF';
      case 'strength':
        return '#BC1823';
      case 'hiit':
        return '#FF5757';
      case 'mobility':
        return '#8C52FF';
      default:
        return 'linear-gradient(to right, #2563eb, #7c3aed)';
    }
  };
  
  return (
    <div className="bg-black rounded-2xl shadow-sm overflow-hidden border-2 border-[#EEBA2B]">
      <div className="p-6 text-white" style={{ background: getHeaderBackground() }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{workout.name}</h3>
            <p className="text-blue-100">
              Esercizio {currentExercise + 1} di {workout.exercises.length}
            </p>
          </div>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedExercises.length / workout.exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6 space-y-4 bg-black">
        {workout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={{ ...exercise, completed: isCompleted(index) }}
            onStart={onStartExercise}
            onComplete={() => completeExercise(index)}
          />
        ))}
        
        {completedExercises.length === workout.exercises.length && (
          <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Workout Completato!</h3>
            <p className="text-green-600 mb-4">Ottimo lavoro! Hai completato tutti gli esercizi.</p>
            <Button 
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Torna ai Workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
