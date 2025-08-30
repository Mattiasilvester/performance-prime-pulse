
import { TrendingUp, Target, Lightbulb, Lock } from 'lucide-react';

const insights = [
  {
    icon: TrendingUp,
    title: 'Progressi in Crescita',
    description: 'La tua costanza negli ultimi 7 giorni è aumentata del 23%',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Target,
    title: 'Obiettivo Vicino',
    description: 'Sei al 78% del tuo obiettivo mensile di allenamenti',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Lightbulb,
    title: 'Consiglio del Giorno',
    description: 'Aggiungi 5 minuti di stretching dopo ogni workout',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export const AIInsights = () => {
  return (
    <div className="bg-black rounded-2xl shadow-sm border border-gray-500 p-6 insights-ai relative">
      <h3 className="text-lg font-semibold text-[#EEBA2B] mb-4">
        Insights AI
      </h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="p-3 rounded-xl border border-[#EEBA2B]" style={{background: 'linear-gradient(135deg, #000000 0%, #C89116 100%)'}}>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                  <Icon className={`h-4 w-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-white mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Overlay unico su tutta la sezione Insights AI */}
      <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-bold text-white mb-2">Funzionalità in arrivo</h3>
          <p className="text-sm text-gray-200">Gli insights AI saranno disponibili presto!</p>
        </div>
      </div>
    </div>
  );
};
