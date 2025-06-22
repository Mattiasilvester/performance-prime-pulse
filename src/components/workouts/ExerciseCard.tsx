
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
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">{exercise.name}</h4>
              <p className="text-xs text-white/70">
                {exercise.duration} • Riposo: {exercise.rest}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            <Button
              onClick={() => onStart(exercise.duration, exercise.rest)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs h-7"
            >
              Avvia
            </Button>
            <Button
              onClick={onComplete}
              size="sm"
              className="bg-[#EEBA2B] hover:bg-[#d4a61a] text-black px-1.5 py-1 text-xs font-medium h-7"
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
