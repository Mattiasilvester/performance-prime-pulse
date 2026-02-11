/**
 * Step 9: Andamento & Analytics — riepilogo profitto, grafici Recharts, alert intelligenti.
 * Step 10: Export Report PDF (Analytics) + Report Commercialista (PDF + 3 CSV).
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import { useProfessionalAnalytics } from '@/hooks/useProfessionalAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { exportAnalyticsReportToPDF } from '@/services/analyticsReportExportService';
import {
  getAccountantReportData,
  runAccountantReportExport,
  isProfessionalDataCompleteForReport,
  type AccountantReportData,
  type TimeRange,
} from '@/services/analyticsAccountantReportExportService';
import {
  ProfitSummaryCard,
  RevenueTrendChart,
  CostsTrendChart,
  MarginTrendChart,
  MonthComparisonChart,
  CostsDistributionChart,
  SmartAlerts,
  TimeRangeSelector,
  AccountantReportCompletezzaModal,
} from '@/components/partner/analytics';

export default function AndamentoPage() {
  const navigate = useNavigate();
  const professionalId = useProfessionalId();
  const [prezzoSeduta, setPrezzoSeduta] = useState<number | null>(null);
  const [showCompletezzaModal, setShowCompletezzaModal] = useState(false);
  const [exportingAccountant, setExportingAccountant] = useState(false);
  const [includeClientName, setIncludeClientName] = useState(false);
  const accountantDataRef = useRef<AccountantReportData | null>(null);
  const accountantExportIncludeCSVRef = useRef<boolean>(true);

  const { data, loading, timeRange, setTimeRange } = useProfessionalAnalytics(
    professionalId,
    prezzoSeduta ?? 0
  );

  useEffect(() => {
    if (!professionalId) {
      setPrezzoSeduta(null);
      return;
    }
    const load = async () => {
      const { data: row, error } = await supabase
        .from('professionals')
        .select('prezzo_seduta')
        .eq('id', professionalId)
        .maybeSingle();
      if (!error && row?.prezzo_seduta != null) setPrezzoSeduta(Number(row.prezzo_seduta));
      else setPrezzoSeduta(0);
    };
    load();
  }, [professionalId]);

  const handleExport = () => {
    console.log('[Export] Export Analytics richiesto, data:', data ? 'presente' : 'null/undefined');
    exportAnalyticsReportToPDF(data, timeRange as TimeRange, { professionalName: undefined });
    console.log('[Export] PDF Report Analytics generato con successo');
    toast.success('Report scaricato');
  };

  const runAccountantExport = (reportData: AccountantReportData, includeCSV: boolean = true) => {
    console.log('[Export] Funzione export Report Commercialista chiamata con:', { bookings: reportData.bookings?.length ?? 0, costs: reportData.costs?.length ?? 0 });
    runAccountantReportExport(reportData, { includeCSV });
    console.log('[Export] PDF Report Commercialista generato con successo');
    toast.success(includeCSV ? 'Report Commercialista scaricato (PDF + CSV)' : 'Report Commercialista scaricato (PDF)');
  };

  const handleExportAccountant = async (includeCSV: boolean = true) => {
    if (!professionalId || exportingAccountant) return;
    accountantExportIncludeCSVRef.current = includeCSV;
    setExportingAccountant(true);
    try {
      const reportData = await getAccountantReportData(professionalId, timeRange as TimeRange);
      accountantDataRef.current = reportData;
      if (!isProfessionalDataCompleteForReport(reportData.professional)) {
        setShowCompletezzaModal(true);
        return;
      }
      runAccountantExport(reportData, includeCSV);
    } catch (e) {
      toast.error('Errore durante il caricamento dei dati per il report.');
    } finally {
      setExportingAccountant(false);
    }
  };

  const handleExportAccountantAnyway = () => {
    const reportData = accountantDataRef.current;
    const includeCSV = accountantExportIncludeCSVRef.current ?? true;
    accountantDataRef.current = null;
    setShowCompletezzaModal(false);
    setExportingAccountant(false);
    console.log('[Export] Dialog confermato, chiamo export Report Commercialista...', { hasData: !!reportData });
    if (reportData) {
      runAccountantExport(reportData, includeCSV);
      console.log('[Export] Report Commercialista: export avviato con successo');
    } else {
      console.warn('[Export] Report Commercialista: reportData era null, impossibile esportare');
    }
  };

  const handleCompleteData = () => {
    accountantDataRef.current = null;
    setShowCompletezzaModal(false);
    setExportingAccountant(false);
    navigate('/partner/dashboard/profilo');
  };

  const showPriceBanner = professionalId != null && (prezzoSeduta === null || prezzoSeduta === 0);
  const hasNoData =
    data &&
    !loading &&
    data.profitSummary.revenue === 0 &&
    data.profitSummary.costs === 0 &&
    data.alerts.some((a) => a.message.includes('Nessun dato'));
  const showSkeletons = !professionalId || loading;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-black">
          Andamento & Analytics
        </h1>
      </div>

      {showPriceBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-400 text-sm">
            <strong>Imposta il prezzo per seduta</strong> nel tuo profilo per calcolare i ricavi
            automaticamente.
          </p>
        </div>
      )}

      {hasNoData ? (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nessun dato disponibile</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Completa appuntamenti e registra i tuoi costi nella sezione &quot;Costi & Spese&quot;
            per vedere le analisi del tuo business.
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-[#EEBA2B] text-black font-medium hover:bg-[#d4a826] transition-colors"
          >
            Esporta report Analytics (PDF)
          </button>
        </div>
      ) : (
        <>
          {data?.alerts != null && <SmartAlerts alerts={data.alerts} />}
          <ProfitSummaryCard
            data={data?.profitSummary ?? null}
            loading={showSkeletons}
            onExport={handleExport}
            onExportAccountantPdfOnly={() => handleExportAccountant(false)}
            onExportAccountantPdfCsv={() => handleExportAccountant(true)}
          />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <label className="flex items-center gap-2 cursor-not-allowed opacity-70">
              <input
                type="checkbox"
                checked={includeClientName}
                onChange={() => setIncludeClientName((v) => !v)}
                disabled
                className="rounded border-gray-500"
              />
              Includi nome cliente (disattivato per privacy)
            </label>
          </div>
          <AccountantReportCompletezzaModal
            open={showCompletezzaModal}
            onClose={() => {
              setShowCompletezzaModal(false);
              accountantDataRef.current = null;
              setExportingAccountant(false);
            }}
            onExportAnyway={handleExportAccountantAnyway}
            onCompleteData={handleCompleteData}
          />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueTrendChart data={data?.revenueTrend} loading={showSkeletons} />
            <CostsTrendChart data={data?.costsTrend} loading={showSkeletons} />
            <MarginTrendChart data={data?.marginTrend} loading={showSkeletons} />
            <MonthComparisonChart data={data?.monthComparison} loading={showSkeletons} />
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <CostsDistributionChart data={data?.costsDistribution} loading={showSkeletons} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
