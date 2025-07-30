
import { Award, Target, Calendar, Zap, Heart, Dumbbell, Lock } from 'lucide-react';

export const AchievementsBoard = () => {
  return (
    <div className="bg-black rounded-2xl shadow-sm border border-gray-600 p-6 relative achievement-board">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[#EEBA2B]">Albo delle Medaglie</h3>
          <span className="text-sm text-white">0 di 6 conquistate</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Medaglie di esempio */}
          {[
            { title: 'Settimana Perfetta', icon: Calendar, color: 'bg-blue-600' },
            { title: 'Brucia Grassi', icon: Zap, color: 'bg-orange-600' },
            { title: 'Resistenza Pro', icon: Heart, color: 'bg-red-600' },
            { title: 'Forza Massima', icon: Dumbbell, color: 'bg-purple-600' },
            { title: 'Costanza Mensile', icon: Target, color: 'bg-green-600' },
            { title: 'Campione Performance', icon: Award, color: 'bg-yellow-600' },
          ].map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 bg-slate-300">
                    <Icon className="h-6 w-6 text-slate-500" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 text-black">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Descrizione obiettivo
                  </p>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-slate-300 w-0" />
                    </div>
                    <span className="text-xs text-slate-500">0%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
