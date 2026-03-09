import { ArrowLeft, Mail, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '@/contexts/TourContext';

const Help = () => {
  const navigate = useNavigate();
  const { startTour } = useTour();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-6">
      <div className="max-w-md mx-auto w-full pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-[#8A8A96] hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[#F0EDE8]">Centro assistenza</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96]">Contattaci per supporto</p>
      </div>

      <div className="max-w-md mx-auto w-full space-y-4">
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center gap-3 p-4 bg-[#1A1A1F] rounded-[14px] border border-[rgba(255,255,255,0.1)]">
            <Mail className="h-5 w-5 text-[#EEBA2B] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#8A8A96] mb-1">Contattaci via email:</p>
              <a href="mailto:primeassistenza@gmail.com" className="text-[#EEBA2B] font-medium hover:underline text-[#F0EDE8]">
                primeassistenza@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <button
            type="button"
            onClick={() => startTour()}
            className="flex items-center gap-3 w-full p-4 bg-[#1A1A1F] rounded-[14px] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(238,186,43,0.4)] hover:bg-[#1E1E24] transition-colors text-left"
          >
            <Compass className="h-5 w-5 text-[#EEBA2B] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#F0EDE8]">Rivedi il tour dell'app</p>
              <p className="text-xs text-[#8A8A96]">Ripeti la guida introduttiva della dashboard</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
