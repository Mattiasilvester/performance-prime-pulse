/**
 * Report Settimanale — dati Lun–Dom per KPI, grafico per giorno, top servizi, confronto settimana precedente.
 */
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

/** Lun–Dom: weekStartsOn 1 = Monday */
const WEEK_STARTS_ON = 1;

export interface WeeklyReportKpi {
  appuntamentiCompletati: number;
  incassoLordo: number;
  nuoviClienti: number;
  tassoCompletamento: number;
}

export interface DayBar {
  name: string;
  shortName: string;
  value: number;
  date: string;
}

export interface TopService {
  serviceType: string;
  count: number;
  revenue: number;
}

export interface WeeklyReportData {
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
  kpi: WeeklyReportKpi;
  previousKpi: WeeklyReportKpi | null;
  dayBars: DayBar[];
  topServices: TopService[];
}

/**
 * Restituisce lunedì 00:00 e domenica 23:59:59 della settimana che contiene `date`.
 */
export function getWeekBounds(date: Date): { dateFrom: string; dateTo: string } {
  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  return {
    dateFrom: format(start, 'yyyy-MM-dd'),
    dateTo: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Label leggibile per la settimana (es. "3 feb – 9 feb 2026").
 */
export function getWeekPeriodLabel(dateFrom: string, dateTo: string): string {
  const from = new Date(dateFrom + 'T00:00:00');
  const to = new Date(dateTo + 'T00:00:00');
  return `${format(from, 'd MMM', { locale: it })} – ${format(to, 'd MMM yyyy', { locale: it })}`;
}

/**
 * Carica tutti i dati per il report settimanale: KPI, per giorno, top 3 servizi, confronto settimana precedente.
 */
export async function getWeeklyReportData(
  professionalId: string,
  dateFrom: string,
  dateTo: string
): Promise<WeeklyReportData> {
  const periodLabel = getWeekPeriodLabel(dateFrom, dateTo);

  // Booking della settimana (tutti gli status per totali e tasso completamento)
  const { data: weekBookings, error: weekErr } = await supabase
    .from('bookings')
    .select('id, booking_date, booking_time, status, price, client_name, service_type')
    .eq('professional_id', professionalId)
    .gte('booking_date', dateFrom)
    .lte('booking_date', dateTo)
    .order('booking_date', { ascending: true });

  if (weekErr) {
    return {
      dateFrom,
      dateTo,
      periodLabel,
      kpi: { appuntamentiCompletati: 0, incassoLordo: 0, nuoviClienti: 0, tassoCompletamento: 0 },
      previousKpi: null,
      dayBars: buildEmptyDayBars(dateFrom, dateTo),
      topServices: [],
    };
  }

  const bookings = weekBookings ?? [];
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalInWeek = bookings.length;
  const appuntamentiCompletati = completed.length;
  const incassoLordo = completed.reduce((sum, b) => sum + (b.price != null && !Number.isNaN(Number(b.price)) ? Number(b.price) : 0), 0);
  const uniqueClients = new Set(completed.map((b) => (b.client_name || '').trim()).filter(Boolean));
  const nuoviClienti = uniqueClients.size;
  const tassoCompletamento = totalInWeek > 0 ? Math.round((appuntamentiCompletati / totalInWeek) * 100) : 0;

  const kpi: WeeklyReportKpi = {
    appuntamentiCompletati,
    incassoLordo,
    nuoviClienti,
    tassoCompletamento,
  };

  // Per giorno (Lun–Dom)
  const dayBars = buildDayBars(dateFrom, dateTo, completed);

  // Top 3 servizi (per count)
  const byService = new Map<string, { count: number; revenue: number }>();
  for (const b of completed) {
    const key = (b.service_type || 'Altro').trim();
    const cur = byService.get(key) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += b.price != null && !Number.isNaN(Number(b.price)) ? Number(b.price) : 0;
    byService.set(key, cur);
  }
  const topServices: TopService[] = Array.from(byService.entries())
    .map(([serviceType, v]) => ({ serviceType, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Settimana precedente (stessi Lun–Dom)
  const prevStart = subWeeks(new Date(dateFrom + 'T12:00:00'), 1);
  const { dateFrom: prevFrom, dateTo: prevTo } = getWeekBounds(prevStart);

  const { data: prevBookings, error: prevErr } = await supabase
    .from('bookings')
    .select('id, status, price, client_name')
    .eq('professional_id', professionalId)
    .gte('booking_date', prevFrom)
    .lte('booking_date', prevTo);

  let previousKpi: WeeklyReportKpi | null = null;
  if (!prevErr && prevBookings?.length) {
    const prevCompleted = prevBookings.filter((b) => b.status === 'completed');
    const prevTotal = prevBookings.length;
    const prevRevenue = prevCompleted.reduce(
      (s, b) => s + (b.price != null && !Number.isNaN(Number(b.price)) ? Number(b.price) : 0),
      0
    );
    const prevClients = new Set(prevCompleted.map((b) => (b.client_name || '').trim()).filter(Boolean)).size;
    previousKpi = {
      appuntamentiCompletati: prevCompleted.length,
      incassoLordo: prevRevenue,
      nuoviClienti: prevClients,
      tassoCompletamento: prevTotal > 0 ? Math.round((prevCompleted.length / prevTotal) * 100) : 0,
    };
  }

  return {
    dateFrom,
    dateTo,
    periodLabel,
    kpi,
    previousKpi,
    dayBars,
    topServices,
  };
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domenica',
  1: 'Lunedì',
  2: 'Martedì',
  3: 'Mercoledì',
  4: 'Giovedì',
  5: 'Venerdì',
  6: 'Sabato',
};

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function buildEmptyDayBars(dateFrom: string, dateTo: string): DayBar[] {
  const bars: DayBar[] = [];
  const start = new Date(dateFrom + 'T12:00:00');
  const end = new Date(dateTo + 'T12:00:00');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    bars.push({
      name: DAY_LABELS[dow] ?? '',
      shortName: DAY_SHORT[dow] ?? String(dow),
      value: 0,
      date: format(d, 'yyyy-MM-dd'),
    });
  }
  return bars;
}

function buildDayBars(dateFrom: string, dateTo: string, completed: { booking_date: string }[]): DayBar[] {
  const bars = buildEmptyDayBars(dateFrom, dateTo);
  const countByDate = new Map<string, number>();
  for (const b of completed) {
    const d = b.booking_date;
    countByDate.set(d, (countByDate.get(d) ?? 0) + 1);
  }
  return bars.map((bar) => ({
    ...bar,
    value: countByDate.get(bar.date) ?? 0,
  }));
}
