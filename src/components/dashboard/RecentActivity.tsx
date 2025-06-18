
import { Clock, CheckCircle, Star } from 'lucide-react';

const activities = [
  {
    type: 'workout',
    title: 'HIIT Cardio Completo',
    time: '45 min',
    ago: '2 ore fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    type: 'appointment',
    title: 'Sessione con Dr. Rossi',
    time: '60 min',
    ago: '1 giorno fa',
    status: 'completed',
    icon: Star,
    color: 'text-orange-600',
  },
  {
    type: 'workout',
    title: 'Forza Gambe',
    time: '30 min',
    ago: '2 giorni fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    type: 'workout',
    title: 'Stretching Mattutino',
    time: '15 min',
    ago: '3 giorni fa',
    status: 'completed',
    icon: CheckCircle,
    color: 'text-green-600',
  },
];

export const RecentActivity = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Attività Recenti</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Vedi tutte
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className={`p-2 rounded-xl bg-slate-100`}>
                <Icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{activity.title}</p>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
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
