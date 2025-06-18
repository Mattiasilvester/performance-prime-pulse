
import { Heart, Dumbbell, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  {
    id: 'cardio',
    name: 'Cardio',
    description: 'Brucia calorie e migliora la resistenza',
    duration: '20-45 min',
    icon: Heart,
    iconBgColor: 'bg-[#004AAD]',
    workouts: 12,
  },
  {
    id: 'strength',
    name: 'Forza',
    description: 'Costruisci massa muscolare',
    duration: '30-60 min',
    icon: Dumbbell,
    iconBgColor: 'bg-[#EF4136]',
    workouts: 18,
  },
  {
    id: 'hiit',
    name: 'HIIT',
    description: 'Allenamento ad alta intensità',
    duration: '15-30 min',
    icon: Zap,
    iconBgColor: 'bg-[#FF5757]',
    workouts: 8,
  },
  {
    id: 'mobility',
    name: 'Mobilità',
    description: 'Stretching e flessibilità',
    duration: '10-20 min',
    icon: Activity,
    iconBgColor: 'bg-[#8C52FF]',
    workouts: 15,
  },
];

interface WorkoutCategoriesProps {
  onStartWorkout: (workoutId: string) => void;
}

export const WorkoutCategories = ({ onStartWorkout }: WorkoutCategoriesProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="bg-gradient-to-br from-black to-[#C89116] rounded-2xl shadow-lg border border-pp-gold/20 overflow-hidden hover:shadow-xl hover:shadow-pp-gold/20 transition-all duration-300 hover:scale-105"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${category.iconBgColor} rounded-xl p-3 flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-sm text-white/80">{category.workouts} workout</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-pp-gold mb-2">{category.name}</h3>
                  <p className="text-white text-sm mb-3">{category.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">{category.duration}</span>
                  <Button 
                    onClick={() => onStartWorkout(category.id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Inizia
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Recommended */}
      <div className="bg-gradient-to-br from-black to-[#C89116] rounded-2xl p-6 border border-pp-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 text-pp-gold">Consigliato per Oggi</h3>
            <p className="text-white mb-4">HIIT Total Body - Perfetto per il tuo livello</p>
            <Button 
              onClick={() => onStartWorkout('recommended')}
              className="bg-black text-white hover:bg-gray-900"
            >
              Inizia Workout
            </Button>
          </div>
          <div className="hidden md:block">
            <Zap className="h-16 w-16 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
