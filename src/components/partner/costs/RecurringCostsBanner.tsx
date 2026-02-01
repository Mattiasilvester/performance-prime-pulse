/**
 * Step 8 fix: Banner costi ricorrenti attivi e totale mensile.
 * Design: sfondo #EEBA2B/10, bordo #EEBA2B, icona RefreshCw.
 */
import { RefreshCw } from 'lucide-react';

interface RecurringCostsBannerProps {
  count: number;
  totalPerMonth: number;
}

export function RecurringCostsBanner({ count, totalPerMonth }: RecurringCostsBannerProps) {
  if (count === 0) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4 mb-4"
      style={{
        backgroundColor: 'rgba(238, 186, 43, 0.1)',
        borderColor: '#EEBA2B',
      }}
    >
      <RefreshCw className="w-5 h-5 shrink-0 text-[#EEBA2B]" />
      <p className="text-sm font-medium text-gray-900">
        {count} {count === 1 ? 'costo ricorrente attivo' : 'costi ricorrenti attivi'} · €
        {totalPerMonth.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mese
      </p>
    </div>
  );
}
