import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActiveWorkout } from '@/components/workouts/ActiveWorkout';
import type { ComponentProps } from 'react';

export interface ActiveWorkoutLocationState {
  workoutId: string;
  generatedWorkout?: ComponentProps<typeof ActiveWorkout>['generatedWorkout'];
  customWorkout?: ComponentProps<typeof ActiveWorkout>['customWorkout'];
}

export default function ActiveWorkoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ActiveWorkoutLocationState | null | undefined;

  useEffect(() => {
    if (!state?.workoutId) {
      navigate('/workouts', { replace: true });
    }
  }, [state?.workoutId, navigate]);

  if (!state?.workoutId) {
    return null;
  }

  return (
    <ActiveWorkout
      workoutId={state.workoutId}
      generatedWorkout={state.generatedWorkout ?? null}
      customWorkout={state.customWorkout ?? null}
      onClose={() => navigate('/workouts')}
    />
  );
}
