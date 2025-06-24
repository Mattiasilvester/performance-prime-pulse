
import React, { useState, useEffect } from 'react';
import { fetchProgressStats, ProgressData } from '@/services/statsService';
import ProgressChart from '@/components/ProgressChart';
import { useTranslation } from '@/hooks/useTranslation';

const PERIOD_OPTIONS = [
  { label: 'progressHistory.lastWeek', key: 'week' },
  { label: 'progressHistory.lastMonth', key: 'month' }
];

export const ProgressHistory = () => {
  const { t } = useTranslation();
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

  const totalStats = chartData ? {
    workouts: chartData.reduce((sum, item) => sum + item.workouts, 0),
    hours: Math.round(chartData.reduce((sum, item) => sum + item.hours, 0) * 10) / 10
  } : { workouts: 0, hours: 0 };

  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#EEBA2B]">{t('progressHistory.title')}</h3>
        
        {/* Desktop buttons */}
        <div className="hidden lg:flex gap-2">
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
              {t(opt.label)}
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="lg:hidden">
          <label className="block text-sm font-medium text-[#EEBA2B] mb-1">Periodo</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-black border border-[#EEBA2B] text-[#EEBA2B] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key} className="bg-black text-[#EEBA2B]">
                {t(opt.label)}
              </option>
            ))}
          </select>
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
            <span className="text-sm font-medium text-white">{t('progressHistory.workouts')}</span>
          </div>
          <div className="text-2xl font-bold text-[#EEBA2B]">{totalStats.workouts}</div>
          <div className="text-sm text-gray-400">{t('progressHistory.inPeriod')}</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-transparent rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-white">{t('progressHistory.totalHours')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">{totalStats.hours}h</div>
          <div className="text-sm text-gray-400">{t('progressHistory.inPeriod')}</div>
        </div>
      </div>
    </div>
  );
};
