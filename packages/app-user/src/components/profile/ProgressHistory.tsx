
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { fetchProgressStats, ProgressData } from '@/services/statsService';
import { useTranslation } from '@/hooks/useTranslation';

const ProgressChart = lazy(() => import('@/components/ProgressChart'));

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
    hours: chartData.reduce((sum, item) => sum + item.hours, 0)
  } : { workouts: 0, hours: 0 };

  // Formatta le ore totali in formato Xh Ym
  const formatTotalHours = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#F0EDE8]">Storico Progressi</h3>
        <span className="text-[13px] text-[#8A8A96]">Periodo</span>
      </div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <div className="hidden lg:flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                period === opt.key ? 'bg-[#EEBA2B] text-[#0A0A0C] font-medium' : 'bg-[#1E1E24] text-[#8A8A96]'
              }`}
              onClick={() => setPeriod(opt.key)}
            >
              {t(opt.label)}
            </button>
          ))}
        </div>
        <div className="lg:hidden">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#1E1E24] border border-[rgba(255,255,255,0.06)] text-[#F0EDE8] px-3 py-2 rounded-lg text-sm"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key} className="bg-[#1E1E24]">
                {t(opt.label)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-[#8A8A96] text-sm">Caricamento dati...</div>
          </div>
        ) : (
          <Suspense fallback={<div className="h-64 w-full rounded-lg bg-[#1E1E24] animate-pulse" />}>
            <ProgressChart data={chartData || []} />
          </Suspense>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1E1E24]">
          <div className="text-2xl font-bold text-[#F0EDE8]">{totalStats.workouts}</div>
          <div className="text-[10px] text-[#5C5C66] mt-1">{t('progressHistory.workouts')} · {t('progressHistory.inPeriod')}</div>
        </div>
        <div className="text-center p-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1E1E24]">
          <div className="text-2xl font-bold text-[#10B981]">{formatTotalHours(totalStats.hours)}</div>
          <div className="text-[10px] text-[#5C5C66] mt-1">{t('progressHistory.totalHours')} · {t('progressHistory.inPeriod')}</div>
        </div>
      </div>
    </div>
  );
};
