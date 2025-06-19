
import React, { useState, useEffect } from 'react';
import { fetchProgressStats, ProgressData } from '@/services/statsService';
import ProgressChart from '@/components/ProgressChart';

const PERIOD_OPTIONS = [
  { label: 'Ultima settimana', key: 'week' },
  { label: 'Ultimo mese', key: 'month' },
  { label: 'Ultimi 6 mesi', key: '6months' },
  { label: 'Ultimo anno', key: 'year' },
  { label: 'Sempre', key: 'all' }
];

export const ProgressHistory = () => {
  const [period, setPeriod] = useState('month');
  const [chartData, setChartData] = useState<ProgressData[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchProgressStats(period);
        setChartData(data);
      } catch (error) {
        console.error('Error loading progress stats:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [period]);

  // Calcola le statistiche totali per il periodo
  const totalStats = chartData ? {
    workouts: chartData.reduce((sum, item) => sum + item.workouts, 0),
    hours: Math.round(chartData.reduce((sum, item) => sum + item.hours, 0) * 10) / 10
  } : { workouts: 0, hours: 0 };

  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#EEBA2B]">Storico Progressi</h3>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                period === opt.key 
                  ? 'bg-[#EEBA2B] text-black font-medium' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setPeriod(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-400">Caricamento dati...</div>
          </div>
        ) : (
          <ProgressChart data={chartData || []} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gradient-to-br from-[#EEBA2B]/20 to-transparent rounded-xl border border-[#EEBA2B]/30">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-[#EEBA2B] rounded-full mr-2"></div>
            <span className="text-sm font-medium text-white">Allenamenti</span>
          </div>
          <div className="text-2xl font-bold text-[#EEBA2B]">{totalStats.workouts}</div>
          <div className="text-sm text-gray-400">Nel periodo</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-transparent rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-white">Ore totali</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">{totalStats.hours}h</div>
          <div className="text-sm text-gray-400">Nel periodo</div>
        </div>
      </div>
    </div>
  );
};
