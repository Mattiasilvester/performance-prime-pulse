import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { KPIViewHeader } from './KPIViewHeader';
import { KPILineChart } from './charts';

interface ClientGrowthData {
  total: number;
  newThisMonth: number;
  lastMonth: number;
  growthPercent: number;
  monthlyTrend: Array<{ name: string; value: number }>;
}

interface ClientGrowthViewProps {
  data: ClientGrowthData;
  onBack: () => void;
}

export function ClientGrowthView({ data, onBack }: ClientGrowthViewProps) {
  const isPositive = data.growthPercent >= 0;

  return (
    <div className="space-y-6">
      <KPIViewHeader title="Crescita Clienti" onBack={onBack} />

      {/* Grafico principale */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Trend Nuovi Clienti (6 mesi)</h3>
        <KPILineChart data={data.monthlyTrend} />
      </div>

      {/* Card metriche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Nuovi questo mese</p>
            <Users className="w-5 h-5 text-[#EEBA2B]" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.newThisMonth}</p>
          <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{isPositive ? '+' : ''}{data.growthPercent}% vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Mese scorso</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.lastMonth}</p>
          <p className="text-sm text-gray-400 mt-1">nuovi clienti</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Totale clienti</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.total}</p>
          <p className="text-sm text-gray-400 mt-1">clienti totali</p>
        </div>
      </div>

      {/* Tabella dettaglio */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Dettaglio Mensile</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mese</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nuovi Clienti</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variazione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.monthlyTrend.slice().reverse().map((month, index, arr) => {
                const prevValue = arr[index + 1]?.value ?? month.value;
                const change = prevValue > 0 ? Math.round(((month.value - prevValue) / prevValue) * 100) : 0;
                const isUp = change >= 0;
                return (
                  <tr key={month.name} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-900">{month.name}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{month.value}</td>
                    <td className={`px-5 py-4 text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {index < arr.length - 1 ? `${isUp ? '+' : ''}${change}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
