
import { useState } from 'react';
import { CheckCircle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
};

interface ActiveWorkoutProps {
  workoutId: string;
  onClose: () => void;
}

export const ActiveWorkout = ({ workoutId, onClose }: ActiveWorkoutProps) => {
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
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
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
        
        {/* Progress Bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedExercises.length / workout.exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {workout.exercises.map((exercise, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              index === currentExercise
                ? 'border-blue-500 bg-blue-50'
                : isCompleted(index)
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted(index)
                      ? 'bg-green-500 text-white'
                      : index === currentExercise
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {isCompleted(index) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{exercise.name}</h4>
                  <p className="text-sm text-slate-600">
                    {exercise.duration} • Riposo: {exercise.rest}
                  </p>
                </div>
              </div>
              
              {index === currentExercise && !isCompleted(index) && (
                <Button
                  onClick={() => completeExercise(index)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Completa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
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
