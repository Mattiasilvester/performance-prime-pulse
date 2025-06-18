
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

const stats = [
  {
    label: 'Allenamenti completati',
    value: '28',
    change: '+12%',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    label: 'Obiettivi raggiunti',
    value: '8/10',
    change: '+2',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    label: 'Tempo totale',
    value: '42h',
    change: '+5h',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    label: 'Medaglie',
    value: '15',
    change: '+3',
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

export const StatsOverview = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
