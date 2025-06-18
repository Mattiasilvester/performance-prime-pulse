
import { Heart, Dumbbell, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  {
    id: 'cardio',
    name: 'Cardio',
    description: 'Brucia calorie e migliora la resistenza',
    duration: '20-45 min',
    icon: Heart,
    color: 'bg-red-500',
    bgGradient: 'from-red-500 to-pink-500',
    workouts: 12,
  },
  {
    id: 'strength',
    name: 'Forza',
    description: 'Costruisci massa muscolare',
    duration: '30-60 min',
    icon: Dumbbell,
    color: 'bg-blue-500',
    bgGradient: 'from-blue-500 to-blue-600',
    workouts: 18,
  },
  {
    id: 'hiit',
    name: 'HIIT',
    description: 'Allenamento ad alta intensità',
    duration: '15-30 min',
    icon: Zap,
    color: 'bg-orange-500',
    bgGradient: 'from-orange-500 to-red-500',
    workouts: 8,
  },
  {
    id: 'mobility',
    name: 'Mobilità',
    description: 'Stretching e flessibilità',
    duration: '10-20 min',
    icon: Activity,
    color: 'bg-green-500',
    bgGradient: 'from-green-500 to-emerald-500',
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
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className={`h-24 bg-gradient-to-r ${category.bgGradient} flex items-center justify-center`}>
                <Icon className="h-12 w-12 text-white" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                  <span className="text-sm text-slate-500">{category.workouts} workout</span>
                </div>
                <p className="text-slate-600 mb-3">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">{category.duration}</span>
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Consigliato per Oggi</h3>
            <p className="text-blue-100 mb-4">HIIT Total Body - Perfetto per il tuo livello</p>
            <Button 
              onClick={() => onStartWorkout('recommended')}
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Inizia Workout
            </Button>
          </div>
          <div className="hidden md:block">
            <Zap className="h-16 w-16 text-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
