import { Zap, Calendar, Check, ChevronRight } from 'lucide-react';
import { usePlanCreationStore } from '@/stores/planCreationStore';

export function PlanTypeSelector() {
  const { setPlanType } = usePlanCreationStore();

  const handleSelectType = (type: 'daily' | 'weekly') => {
    setPlanType(type);
    // Rimosso nextStep() - setPlanType nello store già gestisce currentStep = 0
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Che tipo di piano vuoi creare?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli in base alle tue esigenze
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* PIANO GIORNALIERO */}
        <button
          onClick={() => handleSelectType('daily')}
          className="
            bg-gradient-to-br from-orange-500 to-red-500 
            hover:from-orange-400 hover:to-red-400
            rounded-2xl p-8 text-left
            transition-all duration-300
            hover:shadow-2xl hover:shadow-orange-500/30
            hover:scale-105
            group
            relative overflow-hidden
            h-full
          "
        >
          {/* Animated gradient */}
          <div
            className="
              absolute inset-0 
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              translate-x-[-100%] group-hover:translate-x-[100%]
              transition-transform duration-1000
            "
          />

          <div className="relative space-y-4 flex flex-col h-full">
            {/* Icon */}
            <div
              className="
                bg-white/20 p-4 rounded-xl 
                w-fit
                group-hover:scale-110 
                transition-transform
              "
            >
              <Zap className="h-10 w-10 text-white" />
            </div>

            {/* Title + Badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">
                  Piano Giornaliero
                </h3>
                <span
                  className="
                  bg-white/20 text-white 
                  text-xs px-3 py-1 rounded-full
                  font-semibold
                "
                >
                  Veloce ⚡
                </span>
              </div>
              <p className="text-white/90 text-base">
                Un singolo workout personalizzato per oggi
              </p>
            </div>

            {/* Benefici */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Pronto in 2 minuti</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Inizia subito</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Flessibile e veloce</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-end mt-auto">
              <ChevronRight
                className="
                h-6 w-6 text-white 
                group-hover:translate-x-1 
                transition-transform
              "
              />
            </div>
          </div>
        </button>

        {/* PIANO SETTIMANALE */}
        <button
          onClick={() => handleSelectType('weekly')}
          className="
            bg-gradient-to-br from-purple-600 to-blue-600 
            hover:from-purple-500 hover:to-blue-500
            rounded-2xl p-8 text-left
            transition-all duration-300
            hover:shadow-2xl hover:shadow-purple-500/30
            hover:scale-105
            group
            relative overflow-hidden
            h-full
          "
        >
          {/* Animated gradient */}
          <div
            className="
              absolute inset-0 
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              translate-x-[-100%] group-hover:translate-x-[100%]
              transition-transform duration-1000
            "
          />

          <div className="relative space-y-4 flex flex-col h-full">
            {/* Icon */}
            <div
              className="
                bg-white/20 p-4 rounded-xl 
                w-fit
                group-hover:scale-110 
                transition-transform
              "
            >
              <Calendar className="h-10 w-10 text-white" />
            </div>

            {/* Title + Badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">
                  Piano Settimanale
                </h3>
                <span
                  className="
                  bg-white/20 text-white 
                  text-xs px-3 py-1 rounded-full
                  font-semibold
                "
                >
                  Completo 📅
                </span>
              </div>
              <p className="text-white/90 text-base">
                Piano strutturato per più settimane
              </p>
            </div>

            {/* Benefici */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Progressione garantita</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>4-12 settimane</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Risultati a lungo termine</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-end mt-auto">
              <ChevronRight
                className="
                h-6 w-6 text-white 
                group-hover:translate-x-1 
                transition-transform
              "
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

