
import { Clock, CheckCircle, Star } from 'lucide-react';

const activities = [
  {
    type: 'workout',
    title: 'HIIT Cardio Completo',
    time: '45 min',
    ago: '2 ore fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-[#c89116]',
  },
  {
    type: 'appointment',
    title: 'Sessione con Dr. Rossi',
    time: '60 min',
    ago: '1 giorno fa',
    status: 'completed',
    icon: Star,
    color: 'text-[#c89116]',
  },
  {
    type: 'workout',
    title: 'Forza Gambe',
    time: '30 min',
    ago: '2 giorni fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-[#c89116]',
  },
  {
    type: 'workout',
    title: 'Stretching Mattutino',
    time: '15 min',
    ago: '3 giorni fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-[#c89116]',
  },
];

export const RecentActivity = () => {
  return (
    <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg border-2 border-[#c89116]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Attività Recenti</h3>
        <button className="text-sm text-[#c89116] hover:text-pp-gold font-medium transition-colors">
          Vedi tutte
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-[#c89116]/10 rounded-xl transition-colors">
              <div className={`p-2 rounded-xl bg-[#c89116]/20 border border-[#c89116]`}>
                <Icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-pp-gold truncate">{activity.title}</p>
                <div className="flex items-center space-x-2 text-sm text-pp-gold/70">
                  <Clock className="h-3 w-3" />
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span>{activity.ago}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
