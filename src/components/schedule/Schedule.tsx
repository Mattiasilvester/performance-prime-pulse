
import { useState } from 'react';
import { AppointmentCalendar } from './AppointmentCalendar';
import { UpcomingAppointments } from './UpcomingAppointments';
import { ProfessionalsList } from './ProfessionalsList';
import { WorkoutCreationModal } from './WorkoutCreationModal';
import { WorkoutViewModal } from './WorkoutViewModal';
import { Lock } from 'lucide-react';

export const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedWorkout(null);
  };

  const handleWorkoutSelect = (workout: any) => {
    setSelectedWorkout(workout);
    setSelectedDate(null);
  };

  const handleWorkoutSaved = () => {
    setSelectedDate(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseModals = () => {
    setSelectedDate(null);
    setSelectedWorkout(null);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Calendario</h2>
          <p className="text-white">Gestisci i tuoi appuntamenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentCalendar 
          onDateSelect={handleDateSelect}
          onWorkoutSelect={handleWorkoutSelect}
          refreshTrigger={refreshTrigger}
        />
        
        <div className="space-y-6">
          <div className="relative">
            <div className="lock-overlay">
              <Lock className="lock-icon" />
              <h3>Funzionalità in arrivo</h3>
              <p>I prossimi appuntamenti saranno disponibili presto!</p>
            </div>
            <UpcomingAppointments />
          </div>
          
          <div className="relative">
            <div className="lock-overlay">
              <Lock className="lock-icon" />
              <h3>Funzionalità in arrivo</h3>
              <p>I professionisti saranno disponibili presto!</p>
            </div>
            <ProfessionalsList />
          </div>
        </div>
      </div>

      {selectedDate && (
        <WorkoutCreationModal
          isOpen={!!selectedDate}
          selectedDate={selectedDate}
          onClose={handleCloseModals}
          onWorkoutCreated={handleWorkoutSaved}
        />
      )}

      {selectedWorkout && (
        <WorkoutViewModal
          isOpen={!!selectedWorkout}
          workout={selectedWorkout}
          onClose={handleCloseModals}
          onWorkoutDeleted={handleWorkoutSaved}
        />
      )}
    </div>
  );
};
