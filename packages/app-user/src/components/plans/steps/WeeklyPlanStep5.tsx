import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

export function WeeklyPlanStep5() {
  const { weeklyLimitations, setWeeklyLimitations, nextStep } = usePlanCreationStore();
  const [localValue, setLocalValue] = useState(weeklyLimitations || '');

  const handleContinue = () => {
    setWeeklyLimitations(localValue);
    nextStep();
  };

  const handleSkip = () => {
    setWeeklyLimitations('');
    nextStep();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertCircle className="h-6 w-6 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">
            Hai limitazioni o infortuni?
          </h2>
        </div>
        <p className="text-gray-400 text-lg">
          Opzionale - Aiutaci a creare un piano sicuro per te
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Es: Dolore al ginocchio sinistro, problemi alla spalla destra..."
          rows={6}
          className="
            bg-black/30 
            border-white/10
            text-white
            placeholder:text-gray-500
            focus:border-[#EEBA2B]
          "
        />

        <p className="text-sm text-gray-400">
          💡 Questi dettagli aiutano PrimeBot a evitare esercizi che potrebbero causare problemi
        </p>
      </div>

      <div className="flex gap-3 justify-center pt-6">
        <Button
          variant="ghost"
          onClick={handleSkip}
          size="lg"
          className="text-gray-300 hover:text-white"
        >
          Salta questo step
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-bold"
        >
          Continua →
        </Button>
      </div>
    </div>
  );
}


