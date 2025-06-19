
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppointmentCalendar } from './AppointmentCalendar';
import { UpcomingAppointments } from './UpcomingAppointments';
import { ProfessionalsList } from './ProfessionalsList';
import { WorkoutCreationModal } from './WorkoutCreationModal';
import { WorkoutViewModal } from './WorkoutViewModal';

export const Schedule = () => {
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isWorkoutViewModalOpen, setIsWorkoutViewModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [refreshCalendar, setRefreshCalendar] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Apri il popup se arrivato dalla home con il flag
    if (location.state?.openWorkoutModal) {
      setIsWorkoutModalOpen(true);
      setSelectedDate(new Date()); // Oggi
    }
  }, [location.state]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsWorkoutModalOpen(true);
  };

  const handleWorkoutSelect = (workout: any) => {
    setSelectedWorkout(workout);
    setIsWorkoutViewModalOpen(true);
  };

  const handleWorkoutDeleted = () => {
    setRefreshCalendar(prev => prev + 1);
  };

  const handleWorkoutCreated = () => {
    setRefreshCalendar(prev => prev + 1);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Agenda</h2>
          <p className="text-white">Gestisci i tuoi appuntamenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AppointmentCalendar 
            onDateSelect={handleDateSelect}
            onWorkoutSelect={handleWorkoutSelect}
            refreshTrigger={refreshCalendar}
          />
          <ProfessionalsList />
        </div>
        <div>
          <UpcomingAppointments />
        </div>
      </div>

      <WorkoutCreationModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        selectedDate={selectedDate}
        onWorkoutCreated={handleWorkoutCreated}
      />

      <WorkoutViewModal
        isOpen={isWorkoutViewModalOpen}
        onClose={() => setIsWorkoutViewModalOpen(false)}
        workout={selectedWorkout}
        onWorkoutDeleted={handleWorkoutDeleted}
      />
    </div>
  );
};
