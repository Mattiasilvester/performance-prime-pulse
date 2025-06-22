
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
    <Card className="cardio-fatburn-card bg-black border-[#EEBA2B] p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#38B6FF] flex items-center justify-center text-white font-bold text-sm cardio-fatburn-card__bullet">
              1
            </div>
            <div>
              <h4 className="cardio-fatburn-card__title font-semibold">{exercise.name}</h4>
              <p className="cardio-fatburn-card__subtitle text-sm">
                {exercise.duration} • Riposo: {exercise.rest}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => onStart(exercise.duration, exercise.rest)}
              size="sm"
              className="bg-[#38B6FF] hover:bg-[#2563EB] text-white px-4 py-2"
            >
              Avvia
            </Button>
            <Button
              onClick={onComplete}
              size="sm"
              className="bg-[#EEBA2B] hover:bg-[#D4A017] text-black px-4 py-2"
              disabled={!exercise.completed}
            >
              Completa →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
