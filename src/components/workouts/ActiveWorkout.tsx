
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
  
  const isCardioWorkout = workoutId === 'cardio';
  
  return (
    <div className={`${isCardioWorkout ? 'cardio-fatburn-section' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`} style={{ border: isCardioWorkout ? '2px solid #EEBA2B' : '1px solid #e2e8f0' }}>
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

      <div className={`${isCardioWorkout ? 'cardio-fatburn-section__container' : ''} p-6 space-y-4`} style={{ backgroundColor: isCardioWorkout ? '#000000' : 'white', border: isCardioWorkout ? '2px solid #EEBA2B' : 'none' }}>
        {workout.exercises.map((exercise, index) => (
          <div
            key={index}
            className={`cardio-fatburn-card p-4 rounded-xl transition-all duration-300 ${
              index === currentExercise && !isCompleted(index) && !isCardioWorkout
                ? 'border-blue-500 bg-blue-50'
                : isCompleted(index) && !isCardioWorkout
                ? 'border-green-500 bg-green-50'
                : !isCardioWorkout
                ? 'border-slate-200 bg-slate-50'
                : ''
            }`}
            style={{
              backgroundColor: isCardioWorkout ? '#000000' : undefined,
              border: isCardioWorkout ? '2px solid #EEBA2B' : undefined,
              position: 'relative',
              ...(index === currentExercise && !isCompleted(index) && isCardioWorkout && {
                '::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(56, 182, 255, 0.3)',
                  borderRadius: '0.75rem',
                  pointerEvents: 'none'
                }
              })
            }}
          >
            {/* Active exercise overlay */}
            {index === currentExercise && !isCompleted(index) && isCardioWorkout && (
              <div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ backgroundColor: 'rgba(56, 182, 255, 0.3)' }}
              />
            )}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div
                  className={`cardio-fatburn-card__bullet w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted(index)
                      ? 'bg-green-500 text-white border-green-500'
                      : index === currentExercise && !isCardioWorkout
                      ? 'bg-blue-500 text-white border-blue-500'
                      : isCardioWorkout
                      ? 'bg-slate-300 text-slate-600 border-slate-300'
                      : 'bg-slate-300 text-slate-600 border-slate-300'
                  }`}
                >
                  {isCompleted(index) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className={`cardio-fatburn-card__title font-semibold ${isCardioWorkout ? 'text-white' : 'text-slate-900'}`}>
                    {exercise.name}
                  </h4>
                  <p className={`cardio-fatburn-card__subtitle text-sm ${isCardioWorkout ? 'text-gray-400' : 'text-slate-600'}`} style={{ color: isCardioWorkout ? '#9CA3AF' : undefined }}>
                    {exercise.duration} • Riposo: {exercise.rest}
                  </p>
                </div>
              </div>
              
              {index === currentExercise && !isCompleted(index) && (
                <Button
                  onClick={() => completeExercise(index)}
                  className={isCardioWorkout ? "text-black" : "bg-blue-600 hover:bg-blue-700"}
                  style={isCardioWorkout ? { backgroundColor: '#EEBA2B', color: '#000000' } : undefined}
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
