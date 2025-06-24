
import { WorkoutTimer } from '@/components/workouts/WorkoutTimer';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
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
      <Header />
      
      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <Navigation />
            <main className="flex-1">
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
                <div className="w-full max-w-2xl">
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
            </main>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="p-4">
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
            <div className="w-full">
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
        
        {/* Mobile bottom navigation */}
        <Navigation />
      </div>
    </div>
  );
};

export default Timer;
