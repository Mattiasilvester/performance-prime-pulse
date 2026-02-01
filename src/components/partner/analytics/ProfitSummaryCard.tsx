/**
 * Step 9: Card riepilogo profitto — Incasso lordo, Totale spese, Margine netto + variazioni %.
 * Step: Report Commercialista — dropdown Esporta (Analytics / Commercialista).
 */
import { DollarSign, TrendingUp, TrendingDown, Minus, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProfitSummary } from '@/services/analyticsService';

interface ProfitSummaryCardProps {
  data: ProfitSummary | null;
  loading?: boolean;
  onExport?: () => void;
  /** Legacy: un solo bottone Report Commercialista (PDF + CSV). */
  onExportAccountant?: () => void;
  /** Report Commercialista solo PDF. */
  onExportAccountantPdfOnly?: () => void;
  /** Report Commercialista PDF + CSV (con logica: nessun CSV vuoto). */
  onExportAccountantPdfCsv?: () => void;
}

function formatEuro(n: number) {
  return `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ChangeIndicator({ percent }: { percent: number }) {
  if (percent > 0)
    return (
      <span className="text-green-400 text-sm flex items-center gap-0.5">
        <TrendingUp className="w-4 h-4" /> +{percent}%
      </span>
    );
  if (percent < 0)
    return (
      <span className="text-red-400 text-sm flex items-center gap-0.5">
        <TrendingDown className="w-4 h-4" /> {percent}%
      </span>
    );
  return (
    <span className="text-gray-400 text-sm flex items-center gap-0.5">
      <Minus className="w-4 h-4" /> 0%
    </span>
  );
}

export function ProfitSummaryCard({
  data,
  loading,
  onExport,
  onExportAccountant,
  onExportAccountantPdfOnly,
  onExportAccountantPdfCsv,
}: ProfitSummaryCardProps) {
  const hasAccountant =
    onExportAccountant != null || onExportAccountantPdfOnly != null || onExportAccountantPdfCsv != null;
  const hasExport = onExport != null || hasAccountant;
  const useDropdown = onExport != null && hasAccountant;

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-[#EEBA2B]/20 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-700 rounded animate-pulse" />
          {hasExport && <div className="h-9 w-28 bg-gray-700 rounded animate-pulse" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-9 w-28 bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-[#EEBA2B]/20 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Riepilogo profitto</h2>
        {useDropdown ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black transition-colors font-medium"
              >
                Esporta <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem onClick={onExport} className="text-white focus:bg-gray-800 focus:text-white">
                Report Analytics
              </DropdownMenuItem>
              {onExportAccountantPdfOnly != null && (
                <DropdownMenuItem onClick={onExportAccountantPdfOnly} className="text-white focus:bg-gray-800 focus:text-white">
                  Report Commercialista (solo PDF)
                </DropdownMenuItem>
              )}
              {onExportAccountantPdfCsv != null && (
                <DropdownMenuItem onClick={onExportAccountantPdfCsv} className="text-white focus:bg-gray-800 focus:text-white">
                  Report Commercialista (PDF + CSV)
                </DropdownMenuItem>
              )}
              {onExportAccountant != null && onExportAccountantPdfOnly == null && onExportAccountantPdfCsv == null && (
                <DropdownMenuItem onClick={onExportAccountant} className="text-white focus:bg-gray-800 focus:text-white">
                  Report Commercialista
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : onExport ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black transition-colors font-medium"
          >
            Esporta Report
          </Button>
        ) : hasAccountant ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportAccountantPdfCsv ?? onExportAccountantPdfOnly ?? onExportAccountant}
            className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black transition-colors font-medium"
          >
            Esporta Report (Commercialista)
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#EEBA2B] mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Incasso Lordo</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatEuro(data.revenue)}</p>
          <ChangeIndicator percent={data.revenueChangePercent} />
        </div>
        <div>
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <span className="text-sm font-medium">Totale Spese</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help text-gray-500 hover:text-gray-400" aria-label="Info costi">
                    <Info className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left">
                  Costi gestionali utilizzati per analisi interna. Non equivalgono ai costi contabili presenti nel Report per Commercialista.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-3xl font-bold text-white">{formatEuro(data.costs)}</p>
          <ChangeIndicator percent={data.costsChangePercent} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-400">Margine Netto</span>
          </div>
          <p
            className={`text-3xl font-bold ${data.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {formatEuro(data.margin)}
          </p>
          <ChangeIndicator percent={data.marginChangePercent} />
        </div>
      </div>
    </div>
  );
}
