
import { Award, Target, Calendar, Zap, Heart, Dumbbell } from 'lucide-react';

const achievements = [
  {
    title: 'Settimana Perfetta',
    description: '7 giorni consecutivi di allenamento',
    icon: Calendar,
    color: 'bg-blue-600',
    earned: true,
    date: '15 Giu 2024',
  },
  {
    title: 'Brucia Grassi',
    description: '1000 calorie bruciate in un giorno',
    icon: Zap,
    color: 'bg-orange-600',
    earned: true,
    date: '10 Giu 2024',
  },
  {
    title: 'Resistenza Pro',
    description: '60 minuti di cardio continuo',
    icon: Heart,
    color: 'bg-red-600',
    earned: true,
    date: '5 Giu 2024',
  },
  {
    title: 'Forza Massima',
    description: 'Nuovo record personale',
    icon: Dumbbell,
    color: 'bg-purple-600',
    earned: false,
    progress: 85,
  },
  {
    title: 'Costanza Mensile',
    description: '30 giorni di attività',
    icon: Target,
    color: 'bg-green-600',
    earned: false,
    progress: 67,
  },
  {
    title: 'Campione Performance',
    description: '100 allenamenti completati',
    icon: Award,
    color: 'bg-yellow-600',
    earned: false,
    progress: 89,
  },
];

export const AchievementsBoard = () => {
  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#EEBA2B]">Albo delle Medaglie</h3>
        <span className="text-sm text-white">
          {achievements.filter(a => a.earned).length} di {achievements.length} conquistate
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                achievement.earned
                  ? 'border-yellow-300 bg-yellow-50 hover:shadow-lg'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                    achievement.earned ? achievement.color : 'bg-slate-300'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${achievement.earned ? 'text-white' : 'text-slate-500'}`} />
                </div>
                
                <h4 className={`font-semibold text-sm mb-1 text-white`}>
                  {achievement.title}
                </h4>
                
                <p className="text-xs text-slate-500 mb-2">
                  {achievement.description}
                </p>
                
                {achievement.earned ? (
                  <span className="text-xs font-medium text-yellow-700">
                    {achievement.date}
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${achievement.color}`}
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {achievement.progress}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
