
import { TrendingUp, Target, Lightbulb } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Insights AI
      </h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="p-3 rounded-xl border border-slate-200">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                  <Icon className={`h-4 w-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 text-sm">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
