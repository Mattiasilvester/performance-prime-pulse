/**
 * Step 9: Toggle 3 / 6 / 12 mesi per i grafici.
 * Dimensioni identiche per tutti i tab (px-5 py-2 text-sm); solo colore e font-weight cambiano per lo stato attivo.
 */
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TimeRange } from '@/hooks/useProfessionalAnalytics';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}

const tabClass =
  'px-5 py-2 text-sm font-medium transition-colors data-[state=active]:shadow-none data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black data-[state=active]:font-semibold data-[state=inactive]:bg-white/10 data-[state=inactive]:text-gray-400 hover:text-gray-200';

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <Tabs value={String(value)} onValueChange={(v) => onChange(Number(v) as TimeRange)}>
      <TabsList className="bg-gray-800 border border-gray-700 p-1 gap-0">
        <TabsTrigger value="3" className={tabClass}>
          3 mesi
        </TabsTrigger>
        <TabsTrigger value="6" className={tabClass}>
          6 mesi
        </TabsTrigger>
        <TabsTrigger value="12" className={tabClass}>
          12 mesi
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
