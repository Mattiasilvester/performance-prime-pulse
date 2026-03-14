import { lazy, Suspense, useState } from 'react';
import type { ScheduleWorkoutItem } from './AppointmentCalendar';

const AppointmentCalendar = lazy(() =>
  import('./AppointmentCalendar').then((module) => ({ default: module.AppointmentCalendar }))
);
const UpcomingAppointments = lazy(() =>
  import('./UpcomingAppointments').then((module) => ({ default: module.UpcomingAppointments }))
);
const ProfessionalsList = lazy(() =>
  import('./ProfessionalsList').then((module) => ({ default: module.ProfessionalsList }))
);
const WorkoutCreationModal = lazy(() =>
  import('./WorkoutCreationModal').then((module) => ({ default: module.WorkoutCreationModal }))
);
const WorkoutViewModal = lazy(() =>
  import('./WorkoutViewModal').then((module) => ({ default: module.WorkoutViewModal }))
);

export const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduleWorkoutItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedWorkout(null);
  };

  const handleWorkoutSelect = (workout: ScheduleWorkoutItem) => {
    setSelectedWorkout(workout);
    setSelectedDate(null);
  };

  const handleWorkoutSaved = () => {
    setSelectedDate(null);
    // Rate limiting per evitare aggiornamenti troppo frequenti
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseModals = () => {
    setSelectedDate(null);
    setSelectedWorkout(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#16161A] rounded-[18px] p-5 border border-[rgba(255,255,255,0.06)]">
          <Suspense fallback={<div className="text-[#8A8A96]">Caricamento calendario...</div>}>
            <AppointmentCalendar 
              onDateSelect={handleDateSelect}
              onWorkoutSelect={handleWorkoutSelect}
              refreshTrigger={refreshTrigger}
            />
          </Suspense>
        </div>

        <div className="flex flex-col gap-6">
          <Suspense fallback={<div className="text-[#8A8A96]">Caricamento appuntamenti...</div>}>
            <UpcomingAppointments />
          </Suspense>
          <Suspense fallback={<div className="text-[#8A8A96]">Caricamento professionisti...</div>}>
            <ProfessionalsList />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        {selectedDate && (
          <WorkoutCreationModal
            isOpen={!!selectedDate}
            selectedDate={selectedDate}
            onClose={handleCloseModals}
            onWorkoutCreated={handleWorkoutSaved}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {selectedWorkout && (
          <WorkoutViewModal
            isOpen={!!selectedWorkout}
            workout={selectedWorkout}
            onClose={handleCloseModals}
            onWorkoutDeleted={handleWorkoutSaved}
          />
        )}
      </Suspense>
    </div>
  );
};
