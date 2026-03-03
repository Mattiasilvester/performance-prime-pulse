import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Check, Zap, ChevronRight } from 'lucide-react';

export function CreatePlanCard() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/piani/nuovo')}
      className="
        bg-gradient-to-br from-purple-900/50 to-blue-900/50
        border-2 border-purple-500/30
        rounded-2xl p-6
        hover:border-purple-400
        hover:shadow-2xl hover:shadow-purple-500/30
        transition-all duration-300
        cursor-pointer
        group
        relative overflow-hidden
        h-full flex flex-col
      "
    >
      {/* Background animated gradient */}
      <div
        className="
          absolute inset-0 
          bg-gradient-to-r from-transparent via-white/5 to-transparent
          translate-x-[-100%] group-hover:translate-x-[100%]
          transition-transform duration-1000
        "
      />

      <div className="relative flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          {/* Icona Bot animata */}
          <div
            className="
              bg-gradient-to-br from-purple-500 to-blue-500 
              p-4 rounded-xl 
              group-hover:scale-110 
              transition-transform duration-300
              relative flex-shrink-0
            "
          >
            <Bot className="h-8 w-8 text-white" />

            {/* Sparkles animati */}
            <Sparkles
              className="
                h-4 w-4 text-yellow-400 
                absolute -top-1 -right-1
                animate-pulse
              "
            />
          </div>

          {/* Contenuto */}
          <div className="flex-1 min-w-0">
            <h3
              className="
                text-xl font-bold text-white 
                flex items-center gap-2
                mb-2
              "
            >
              Crea Nuovo Piano
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse flex-shrink-0" />
            </h3>

            <p className="text-gray-300 text-sm mb-3">
              Lascia che PrimeBot crei un piano perfetto per te
            </p>
          </div>
        </div>

        {/* Benefici */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
            Personalizzato al 100%
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400 flex-shrink-0" />
            Pronto in 3 minuti
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3 text-purple-400 flex-shrink-0" />
            AI-powered
          </span>
        </div>

        {/* Freccia */}
        <div className="mt-auto flex items-center justify-end">
          <ChevronRight
            className="
              h-6 w-6 text-white 
              group-hover:translate-x-1 
              transition-transform
            "
          />
        </div>
      </div>
    </div>
  );
}


