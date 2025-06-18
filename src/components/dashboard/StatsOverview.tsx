
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

const stats = [
  {
    label: 'Allenamenti completati',
    value: '28',
    change: '+12%',
    icon: TrendingUp,
    color: 'text-pp-gold',
    bgColor: 'bg-black',
  },
  {
    label: 'Obiettivi raggiunti',
    value: '8/10',
    change: '+2',
    icon: Target,
    color: 'text-pp-gold',
    bgColor: 'bg-black',
  },
  {
    label: 'Tempo totale',
    value: '42h',
    change: '+5h',
    icon: Clock,
    color: 'text-pp-gold',
    bgColor: 'bg-black',
  },
  {
    label: 'Medaglie',
    value: '15',
    change: '+3',
    icon: Award,
    color: 'text-pp-gold',
    bgColor: 'bg-black',
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
            className="bg-gradient-to-br from-black to-[#c89116]/20 rounded-2xl p-4 shadow-lg border-2 border-[#c89116] hover:shadow-xl hover:shadow-[#c89116]/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl bg-[#c89116]/20 border border-[#c89116]`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-white">{stat.change}</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-pp-gold">{stat.value}</p>
              <p className="text-sm text-white">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
