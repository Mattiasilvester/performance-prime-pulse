
import { Clock, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const appointments = [
  {
    id: 1,
    professional: 'Dr. Marco Rossi',
    type: 'Personal Training',
    date: 'Oggi',
    time: '15:00',
    location: 'Studio Fitness',
    avatar: '👨‍⚕️',
  },
  {
    id: 2,
    professional: 'Dott.ssa Laura Bianchi',
    type: 'Consulenza Nutrizionale',
    date: 'Domani',
    time: '10:30',
    location: 'Online',
    avatar: '👩‍⚕️',
  },
  {
    id: 3,
    professional: 'Fisio Giuseppe Verdi',
    type: 'Fisioterapia',
    date: '20 Giu',
    time: '14:00',
    location: 'Centro Medico',
    avatar: '🧑‍⚕️',
  },
];

export const UpcomingAppointments = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Prossimi Appuntamenti</h3>
        <Button variant="ghost" size="sm" className="text-blue-600">
          Vedi tutti
        </Button>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{appointment.avatar}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {appointment.professional}
                </h4>
                <p className="text-sm text-slate-600 mb-2">{appointment.type}</p>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{appointment.date} alle {appointment.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Dettagli
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
