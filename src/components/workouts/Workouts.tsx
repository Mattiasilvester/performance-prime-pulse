
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutTimer } from './WorkoutTimer';
import { CustomWorkoutDisplay } from './CustomWorkoutDisplay';
import { WorkoutAttachments } from './WorkoutAttachments';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateWorkout, generateRecommendedWorkout } from '@/services/workoutGenerator';
import { Upload, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState<any>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [timerAutoStart, setTimerAutoStart] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [timerAutoRest, setTimerAutoRest] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.startCustomWorkout) {
      loadCustomWorkout(location.state.startCustomWorkout);
    }
  }, [location.state]);

  const loadCustomWorkout = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (data && !error) {
        setCustomWorkout(data);
        setActiveWorkout('custom');
      }
    } catch (error) {
      console.error('Error loading custom workout:', error);
    }
  };

  const parseTimeString = (timeStr: string) => {
    let seconds = 0;
    if (timeStr.includes('min')) {
      seconds = parseInt(timeStr) * 60;
    } else if (timeStr.includes('s')) {
      seconds = parseInt(timeStr);
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return { hours, minutes, seconds: remainingSeconds };
  };

  const handleStartExercise = (duration: string, restTime: string) => {
    const exerciseTime = parseTimeString(duration);
    const restTimeObj = parseTimeString(restTime);
    
    setTimerAutoStart(exerciseTime);
    setTimerAutoRest(restTimeObj);
  };

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
    setCustomWorkout(null);
    setGeneratedWorkout(null);
    setTimerAutoStart(null);
    setTimerAutoRest(null);
    setShowAttachments(false);
    setSelectedWorkoutId(null);
  };

  const handleStartWorkout = (workoutId: string, duration?: number) => {
    if (workoutId === 'recommended') {
      const workout = generateRecommendedWorkout();
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else if (duration && ['cardio', 'strength', 'hiit', 'mobility'].includes(workoutId)) {
      const workout = generateWorkout(workoutId as any, duration);
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else {
      setActiveWorkout(workoutId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Allenamenti</h2>
          <p className="text-white">Scegli il tuo workout perfetto</p>
        </div>
        <Button
          onClick={() => {
            setShowAttachments(!showAttachments);
            setSelectedWorkoutId(null);
          }}
          className="bg-[#EEBA2B] text-black hover:bg-[#EEBA2B]/80 flex items-center gap-2"
        >
          <Paperclip className="h-4 w-4" />
          Allegati
        </Button>
      </div>

      {activeWorkout === 'custom' && customWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType={customWorkout.workout_type} 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <CustomWorkoutDisplay 
            workout={customWorkout} 
            onClose={handleCloseWorkout} 
          />
          
          {/* Allegati per allenamento attivo */}
          {showAttachments && (
            <WorkoutAttachments 
              workoutId={customWorkout.id}
              onAttachmentsChange={() => {
                // Callback per aggiornamenti degli allegati
              }}
            />
          )}
        </div>
      ) : activeWorkout === 'generated' && generatedWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType="generated" 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <ActiveWorkout 
            workoutId="generated"
            generatedWorkout={generatedWorkout}
            onClose={handleCloseWorkout}
            onStartExercise={handleStartExercise}
          />
          
          {/* Allegati per allenamento generato */}
          {showAttachments && (
            <Card className="bg-black border-2 border-[#EEBA2B]">
              <CardHeader>
                <CardTitle className="text-[#EEBA2B] flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Allegati Allenamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Allenamento Generato</p>
                  <p className="text-sm mb-4">
                    Gli allegati sono disponibili solo per allenamenti personalizzati salvati
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : activeWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType={activeWorkout} 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <ActiveWorkout 
            workoutId={activeWorkout} 
            onClose={() => setActiveWorkout(null)}
            onStartExercise={handleStartExercise}
          />
          
          {/* Allegati per altri tipi di allenamento */}
          {showAttachments && (
            <Card className="bg-black border-2 border-[#EEBA2B]">
              <CardHeader>
                <CardTitle className="text-[#EEBA2B] flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Allegati Allenamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Allenamento Predefinito</p>
                  <p className="text-sm mb-4">
                    Gli allegati sono disponibili solo per allenamenti personalizzati salvati
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          <WorkoutCategories onStartWorkout={handleStartWorkout} />
          
          {/* Sezione Allegati */}
          {showAttachments && (
            <Card className="bg-black border-2 border-[#EEBA2B]">
              <CardHeader>
                <CardTitle className="text-[#EEBA2B] flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Gestione Allegati Allenamenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Seleziona un Allenamento</p>
                  <p className="text-sm mb-4">
                    Per caricare allegati, prima avvia un allenamento personalizzato
                  </p>
                  <Button
                    onClick={() => setShowAttachments(false)}
                    className="bg-[#EEBA2B] text-black hover:bg-[#EEBA2B]/80"
                  >
                    Chiudi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
