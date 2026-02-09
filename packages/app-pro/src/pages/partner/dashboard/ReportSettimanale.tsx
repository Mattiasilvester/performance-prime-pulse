/**
 * Report Settimanale — KPI Lun–Dom, grafico per giorno, top 3 servizi, confronto settimana precedente, Scarica PDF.
 * Layout responsive (mobile-first).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Users,
  Euro,
  CheckCircle,
  Percent,
  Briefcase,
} from 'lucide-react';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import {
  getWeekBounds,
  getWeeklyReportData,
  type WeeklyReportData,
} from '@/services/weeklyReportService';
import { exportWeeklyReportToPDF } from '@/services/weeklyReportExportService';
import { KPIBarChart } from '@/components/partner/dashboard/kpi/charts/KPIBarChart';

const formatEuro = (n: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function ComparisonBadge({
  current,
  previous,
  label,
  formatValue,
}: {
  current: number;
  previous: number;
  label: string;
  formatValue: (n: number) => string;
}) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const percent = previous > 0 ? Math.round((diff / previous) * 100) : (current > 0 ? 100 : 0);
  const isUp = diff > 0;
  const isDown = diff < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <span className="text-gray-600">{label}</span>
      <span className={color}>
        {diff >= 0 ? '+' : ''}{formatValue(diff)}
        {previous > 0 && (
          <span className="ml-1">({percent >= 0 ? '+' : ''}{percent}%)</span>
        )}
      </span>
    </div>
  );
}

export default function ReportSettimanale() {
  const professionalId = useProfessionalId();
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const { dateFrom, dateTo } = getWeekBounds(selectedWeekStart);

  useEffect(() => {
    if (!professionalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getWeeklyReportData(professionalId, dateFrom, dateTo)
      .then(setData)
      .catch(() => {
        toast.error('Errore nel caricamento del report');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [professionalId, dateFrom, dateTo]);

  const goPrevWeek = () => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() - 7);
    setSelectedWeekStart(d);
  };

  const goNextWeek = () => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + 7);
    setSelectedWeekStart(d);
  };

  const handleDownloadPDF = () => {
    if (!data) {
      toast.warning('Nessun dato da esportare');
      return;
    }
    exportWeeklyReportToPDF(data);
    toast.success('Report settimanale scaricato');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header + back + period */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/partner/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#EEBA2B] mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Overview
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Report settimanale
          </h1>
        </div>

        {/* Week selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            aria-label="Settimana precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-[180px] sm:min-w-[220px] text-center px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-900">{data?.periodLabel ?? `${dateFrom} – ${dateTo}`}</span>
          </div>
          <button
            type="button"
            onClick={goNextWeek}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            aria-label="Settimana successiva"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI cards — responsive: 1 col mobile, 2 tablet, 4 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Appuntamenti completati</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.kpi.appuntamentiCompletati}</p>
              {data.previousKpi != null && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <ComparisonBadge
                    current={data.kpi.appuntamentiCompletati}
                    previous={data.previousKpi.appuntamentiCompletati}
                    label="vs sett. prec.:"
                    formatValue={(n) => String(n)}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Incasso lordo</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatEuro(data.kpi.incassoLordo)}</p>
              {data.previousKpi != null && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <ComparisonBadge
                    current={data.kpi.incassoLordo}
                    previous={data.previousKpi.incassoLordo}
                    label="vs sett. prec.:"
                    formatValue={formatEuro}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Clienti (con seduta)</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.kpi.nuoviClienti}</p>
              {data.previousKpi != null && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <ComparisonBadge
                    current={data.kpi.nuoviClienti}
                    previous={data.previousKpi.nuoviClienti}
                    label="vs sett. prec.:"
                    formatValue={(n) => String(n)}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Tasso completamento</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.kpi.tassoCompletamento}%</p>
              {data.previousKpi != null && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <ComparisonBadge
                    current={data.kpi.tassoCompletamento}
                    previous={data.previousKpi.tassoCompletamento}
                    label="vs sett. prec.:"
                    formatValue={(n) => `${n} pp`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Grafico per giorno — responsive height */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#EEBA2B]" />
              Appuntamenti per giorno
            </h2>
            <KPIBarChart
              data={data.dayBars.map((b) => ({ name: b.shortName, value: b.value }))}
              color="#EEBA2B"
              height={260}
            />
          </div>

          {/* Top 3 servizi + Scarica PDF — side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#EEBA2B]" />
                Top 3 servizi
              </h2>
              {data.topServices.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna seduta completata in questa settimana.</p>
              ) : (
                <ul className="space-y-2 sm:space-y-3">
                  {data.topServices.map((s, i) => (
                    <li
                      key={s.serviceType}
                      className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-900">
                        {i + 1}. {s.serviceType}
                      </span>
                      <span className="text-sm text-gray-600">
                        {s.count} sedut{s.count === 1 ? 'a' : 'e'} · {formatEuro(s.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-3.5 bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-semibold rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Scarica PDF
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                Report settimana {data.periodLabel} in PDF.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-100 text-center text-gray-500">
          Nessun dato disponibile per questa settimana.
        </div>
      )}
    </div>
  );
}
