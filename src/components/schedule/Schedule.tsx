
import { AppointmentCalendar } from './AppointmentCalendar';
import { UpcomingAppointments } from './UpcomingAppointments';
import { ProfessionalsList } from './ProfessionalsList';

export const Schedule = () => {
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
          <AppointmentCalendar />
          <ProfessionalsList />
        </div>
        <div>
          <UpcomingAppointments />
        </div>
      </div>
    </div>
  );
};
