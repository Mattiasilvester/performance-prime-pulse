
import { WorkoutTimer } from '@/components/workouts/WorkoutTimer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const Timer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-4xl">
            <div className="w-full">
              <WorkoutTimer />
            </div>
            <div className="mt-8 text-center">
              <p className="text-[#EEBA2B] text-lg font-medium italic">
                "{t('timer.motivationalQuote')}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
