import { Calendar, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    title: 'Piano Settimanale',
    description: 'Allenamenti personalizzati per questa settimana',
    duration: '7 giorni',
    workouts: 5,
    icon: Calendar,
    color: 'bg-blue-600',
  },
  {
    title: 'Quick Workout',
    description: 'Sessione rapida da 15 minuti',
    duration: '15 min',
    workouts: 1,
    icon: Clock,
    color: 'bg-green-600',
  },
  {
    title: 'HIIT Intensivo',
    description: 'Brucia grassi ad alta intensità',
    duration: '25 min',
    workouts: 1,
    icon: Zap,
    color: 'bg-orange-600',
  },
];

export const PersonalizedPlans = () => {
  return (
    <div className="bg-black rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-[#EEBA2B] mb-4">
        Piani Personalizzati
      </h3>
      
      <div className="space-y-3">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <div key={index} className="p-4 border border-[#EEBA2B] rounded-xl hover:shadow-md transition-shadow" style={{background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)'}}>
              <div className="flex items-start space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${plan.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">
                    {plan.title}
                  </h4>
                  <p className="text-xs text-white mt-1">
                    {plan.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-white">
                    <span>{plan.duration}</span>
                    <span>•</span>
                    <span>{plan.workouts} workout</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full bg-[#EEBA2B] hover:bg-[#EEBA2B] text-black">
                Inizia Piano
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
