
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ExerciseCardProps {
  exercise: {
    name: string;
    duration: string;
    rest: string;
    completed?: boolean;
  };
  onStart: (duration: string, rest: string) => void;
  onComplete: () => void;
}

export const ExerciseCard = ({ exercise, onStart, onComplete }: ExerciseCardProps) => {
  return (
    <Card className="bg-black border-2 border-[#EEBA2B]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-lg mb-2 leading-tight">
                {exercise.name}
              </h4>
              <p className="text-sm text-white/70 leading-relaxed">
                <span className="block sm:inline">{exercise.duration}</span>
                <span className="hidden sm:inline"> • </span>
                <span className="block sm:inline">Riposo: {exercise.rest}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button
              onClick={() => onStart(exercise.duration, exercise.rest)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm h-10 min-w-[70px]"
            >
              Avvia
            </Button>
            <Button
              onClick={onComplete}
              size="sm"
              className="bg-[#EEBA2B] hover:bg-[#d4a61a] text-black px-3 py-2 text-xs font-medium h-10 whitespace-nowrap min-w-[85px]"
              disabled={exercise.completed}
            >
              Completa →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
