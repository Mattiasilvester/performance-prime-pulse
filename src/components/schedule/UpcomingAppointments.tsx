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
    <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl shadow-lg border-2 border-[#c89116] p-6 prossimi-appuntamenti">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-pp-gold">Prossimi Appuntamenti</h3>
        <Button variant="ghost" size="sm" className="text-white hover:text-pp-gold">
          Vedi tutti
        </Button>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="p-4 border border-[#c89116]/30 bg-black/50 rounded-xl hover:shadow-md hover:shadow-[#c89116]/20 transition-all"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{appointment.avatar}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">
                  {appointment.professional}
                </h4>
                <p className="text-sm text-white/70 mb-2">{appointment.type}</p>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-white/70">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{appointment.date} alle {appointment.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-white/70">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 border-[#c89116] text-white hover:bg-[#c89116] hover:text-black">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" className="flex-1 bg-[#c89116] text-black hover:bg-[#c89116]/80">
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
