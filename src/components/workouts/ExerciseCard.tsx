
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseExplanation } from './ExerciseExplanation';

interface ExerciseCardProps {
  exercise: {
    name: string;
    duration: string;
    rest: string;
    completed?: boolean;
  };
  onStart: () => void;
  onToggleComplete: (index: number) => void;
  isCompleted: boolean;
  index: number;
}

export const ExerciseCard = ({ exercise, onStart, onToggleComplete, isCompleted, index }: ExerciseCardProps) => {
  return (
    <Card className="bg-black border-2 border-[#EEBA2B]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 h-20">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-bold text-white text-lg leading-tight truncate mb-1">
                {exercise.name}
              </h4>
              <p className="text-sm text-white/70 truncate mb-2">
                {exercise.duration}
              </p>
              <p className="text-sm text-white/70 truncate">
                Riposo: {exercise.rest}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-2 flex-shrink-0">
            <Button
              onClick={onStart}
              size="sm"
              className="animate-scale-in hover-scale"
            >
              AVVIA
            </Button>
            <Button
              onClick={() => onToggleComplete(index)}
              size="sm"
              className={`animate-scale-in hover-scale ${
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                  : ''
              }`}
            >
              {isCompleted ? '✓ FATTO' : 'COMPLETA →'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
