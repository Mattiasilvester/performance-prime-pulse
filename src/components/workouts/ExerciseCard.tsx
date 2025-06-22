
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
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
              <p className="text-sm text-gray-600">
                {exercise.duration} • Riposo: {exercise.rest}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => onStart(exercise.duration, exercise.rest)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            >
              Avvia
            </Button>
            <Button
              onClick={onComplete}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
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
