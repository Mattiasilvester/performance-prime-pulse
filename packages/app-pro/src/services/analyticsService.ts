/**
 * Step 9: Andamento & Analytics — servizio aggregati ricavi, costi, margine.
 * Usa professional_costs.cost_date (non month_year). Ricavi = count(completed) × prezzo_seduta.
 */
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export interface ProfitSummary {
  revenue: number;
  costs: number;
  margin: number;
  revenueChangePercent: number;
  costsChangePercent: number;
  marginChangePercent: number;
  bookingsCount: number;
}

export interface MonthComparison {
  current: { revenue: number; costs: number; margin: number };
  previous: { revenue: number; costs: number; margin: number };
}

export interface SmartAlert {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  message: string;
}

function monthStartEnd(year: number, month: number): { start: string; end: string } {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Ricavi di un mese: SUM(bookings.price) per bookings completed nel mese.
 * Se price è NULL la riga è esclusa dal totale (coerente con Report Commercialista).
 * prezzoSeduta non usato per il totale; mantiene firma per compatibilità.
 */
export async function getMonthlyRevenue(
  professionalId: string,
  year: number,
  month: number,
  _prezzoSeduta: number
): Promise<{ revenue: number; bookingsCount: number }> {
  const { start, end } = monthStartEnd(year, month);
  const { data, error } = await supabase
    .from('bookings')
    .select('price')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .gte('booking_date', start)
    .lte('booking_date', end);

  if (error) return { revenue: 0, bookingsCount: 0 };
  const rows = data ?? [];
  const revenue = rows.reduce((sum, row) => {
    const p = (row as { price: number | null }).price;
    if (p == null || Number.isNaN(Number(p))) return sum;
    return sum + Number(p);
  }, 0);
  return { revenue, bookingsCount: rows.length };
}

/**
 * Totale costi di un mese (cost_date nel mese).
 */
export async function getMonthlyCosts(
  professionalId: string,
  year: number,
  month: number
): Promise<number> {
  const { start, end } = monthStartEnd(year, month);
  const { data, error } = await supabase
    .from('professional_costs')
    .select('amount')
    .eq('professional_id', professionalId)
    .gte('cost_date', start)
    .lte('cost_date', end);

  if (error) return 0;
  return (data ?? []).reduce((sum, c) => sum + Number((c as { amount: number }).amount), 0);
}

/**
 * Trend ricavi ultimi N mesi.
 */
export async function getRevenueTrend(
  professionalId: string,
  months: number,
  prezzoSeduta: number
): Promise<{ month: string; revenue: number }[]> {
  const result: { month: string; revenue: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const { revenue } = await getMonthlyRevenue(professionalId, y, m, prezzoSeduta);
    result.push({
      month: format(d, 'MMM yyyy', { locale: it }),
      revenue,
    });
  }
  return result;
}

/**
 * Trend costi ultimi N mesi.
 */
export async function getCostsTrend(
  professionalId: string,
  months: number
): Promise<{ month: string; costs: number }[]> {
  const result: { month: string; costs: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const costs = await getMonthlyCosts(professionalId, y, m);
    result.push({
      month: format(d, 'MMM yyyy', { locale: it }),
      costs,
    });
  }
  return result;
}

/**
 * Trend margine (ricavi − costi) ultimi N mesi.
 */
export async function getMarginTrend(
  professionalId: string,
  months: number,
  prezzoSeduta: number
): Promise<{ month: string; margin: number }[]> {
  const result: { month: string; margin: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const { revenue } = await getMonthlyRevenue(professionalId, y, m, prezzoSeduta);
    const costs = await getMonthlyCosts(professionalId, y, m);
    result.push({
      month: format(d, 'MMM yyyy', { locale: it }),
      margin: revenue - costs,
    });
  }
  return result;
}

/**
 * Confronto mese corrente vs precedente.
 */
export async function getMonthComparison(
  professionalId: string,
  prezzoSeduta: number
): Promise<MonthComparison> {
  const now = new Date();
  const currY = now.getFullYear();
  const currM = now.getMonth() + 1;
  const prev = subMonths(now, 1);
  const prevY = prev.getFullYear();
  const prevM = prev.getMonth() + 1;

  const [currRev, currCosts, prevRev, prevCosts] = await Promise.all([
    getMonthlyRevenue(professionalId, currY, currM, prezzoSeduta),
    getMonthlyCosts(professionalId, currY, currM),
    getMonthlyRevenue(professionalId, prevY, prevM, prezzoSeduta),
    getMonthlyCosts(professionalId, prevY, prevM),
  ]);

  return {
    current: {
      revenue: currRev.revenue,
      costs: currCosts,
      margin: currRev.revenue - currCosts,
    },
    previous: {
      revenue: prevRev.revenue,
      costs: prevCosts,
      margin: prevRev.revenue - prevCosts,
    },
  };
}

/**
 * Distribuzione costi per categoria (mese corrente).
 */
export async function getCostsDistribution(
  professionalId: string,
  year: number,
  month: number
): Promise<{ name: string; value: number }[]> {
  const { start, end } = monthStartEnd(year, month);
  const { data, error } = await supabase
    .from('professional_costs')
    .select('category, amount')
    .eq('professional_id', professionalId)
    .gte('cost_date', start)
    .lte('cost_date', end);

  if (error) return [];
  const grouped: Record<string, number> = {};
  for (const row of data ?? []) {
    const cat = (row as { category: string }).category || 'altro';
    grouped[cat] = (grouped[cat] || 0) + Number((row as { amount: number }).amount);
  }
  const labels: Record<string, string> = {
    affitto: 'Affitto',
    utilities: 'Utenze',
    assicurazione: 'Assicurazione',
    attrezzatura: 'Attrezzatura',
    percentuale_palestra: 'Percentuale palestra',
    software: 'Software',
    marketing: 'Marketing',
    formazione: 'Formazione',
    trasporti: 'Trasporti',
    altro: 'Altro',
  };
  return Object.entries(grouped).map(([key, value]) => ({
    name: labels[key] ?? key,
    value,
  }));
}

/**
 * Riepilogo profitto (mese corrente + variazioni % vs mese precedente).
 */
export async function getProfitSummary(
  professionalId: string,
  prezzoSeduta: number
): Promise<ProfitSummary> {
  const now = new Date();
  const currY = now.getFullYear();
  const currM = now.getMonth() + 1;
  const prev = subMonths(now, 1);
  const prevY = prev.getFullYear();
  const prevM = prev.getMonth() + 1;

  const [currRev, currCosts, prevRev, prevCosts] = await Promise.all([
    getMonthlyRevenue(professionalId, currY, currM, prezzoSeduta),
    getMonthlyCosts(professionalId, currY, currM),
    getMonthlyRevenue(professionalId, prevY, prevM, prezzoSeduta),
    getMonthlyCosts(professionalId, prevY, prevM),
  ]);

  const revenue = currRev.revenue;
  const costs = currCosts;
  const margin = revenue - costs;
  const prevMargin = prevRev.revenue - prevCosts;

  const revenueChangePercent =
    prevRev.revenue > 0 ? Math.round(((revenue - prevRev.revenue) / prevRev.revenue) * 100) : revenue > 0 ? 100 : 0;
  const costsChangePercent =
    prevCosts > 0 ? Math.round(((costs - prevCosts) / prevCosts) * 100) : costs > 0 ? 100 : 0;
  const marginChangePercent =
    prevMargin !== 0 ? Math.round(((margin - prevMargin) / Math.abs(prevMargin)) * 100) : margin !== 0 ? 100 : 0;

  return {
    revenue,
    costs,
    margin,
    revenueChangePercent,
    costsChangePercent,
    marginChangePercent,
    bookingsCount: currRev.bookingsCount,
  };
}

/**
 * Rapporto costi fissi / totale costi per un mese (per alert).
 */
export async function getFixedCostsRatio(
  professionalId: string,
  year: number,
  month: number
): Promise<number> {
  const total = await getMonthlyCosts(professionalId, year, month);
  if (total <= 0) return 0;
  const { start, end } = monthStartEnd(year, month);
  const { data, error } = await supabase
    .from('professional_costs')
    .select('amount')
    .eq('professional_id', professionalId)
    .eq('cost_type', 'fisso')
    .gte('cost_date', start)
    .lte('cost_date', end);

  if (error) return 0;
  const fixedSum = (data ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0);
  return fixedSum / total;
}

/**
 * Genera alert intelligenti (async: fetch dati e chiama generateSmartAlerts).
 */
export async function getSmartAlertsForProfessional(
  professionalId: string,
  prezzoSeduta: number
): Promise<SmartAlert[]> {
  const comparison = await getMonthComparison(professionalId, prezzoSeduta);
  const summary = await getProfitSummary(professionalId, prezzoSeduta);
  const now = new Date();
  const fixedRatio = await getFixedCostsRatio(
    professionalId,
    now.getFullYear(),
    now.getMonth() + 1
  );
  return generateSmartAlerts(
    comparison.current.revenue,
    comparison.previous.revenue,
    comparison.current.costs,
    comparison.previous.costs,
    comparison.current.margin,
    comparison.previous.margin,
    summary.bookingsCount,
    fixedRatio
  );
}

/**
 * Genera alert intelligenti (sync, con dati già disponibili).
 */
export function generateSmartAlerts(
  currentRevenue: number,
  previousRevenue: number,
  currentCosts: number,
  previousCosts: number,
  currentMargin: number,
  previousMargin: number,
  completedBookings: number,
  fixedCostsRatio: number
): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  if (previousMargin > 0) {
    const marginChange = ((currentMargin - previousMargin) / previousMargin) * 100;
    if (marginChange > 5) {
      alerts.push({
        type: 'success',
        icon: '📈',
        message: `Il tuo margine è cresciuto del ${marginChange.toFixed(0)}% rispetto al mese scorso`,
      });
    } else if (marginChange < -5) {
      alerts.push({
        type: 'warning',
        icon: '📉',
        message: `Il tuo margine è calato del ${Math.abs(marginChange).toFixed(0)}% rispetto al mese scorso`,
      });
    }
  }

  if (previousCosts > 0) {
    const costsChange = ((currentCosts - previousCosts) / previousCosts) * 100;
    if (costsChange > 10) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        message: `Le spese sono aumentate del ${costsChange.toFixed(0)}% questo mese`,
      });
    }
  }

  if (completedBookings >= 30) {
    alerts.push({
      type: 'success',
      icon: '🎯',
      message: `Hai raggiunto ${completedBookings} appuntamenti completati — grande risultato!`,
    });
  }

  if (currentCosts > 0 && fixedCostsRatio > 0.6) {
    alerts.push({
      type: 'info',
      icon: '💡',
      message: `I costi fissi rappresentano il ${(fixedCostsRatio * 100).toFixed(0)}% delle tue spese — valuta ottimizzazione`,
    });
  }

  if (currentMargin < 0) {
    alerts.push({
      type: 'danger',
      icon: '🔴',
      message: `Attenzione: questo mese sei in perdita di €${Math.abs(currentMargin).toFixed(0)}`,
    });
  }

  if (currentRevenue === 0 && currentCosts === 0) {
    alerts.push({
      type: 'info',
      icon: '📊',
      message:
        'Nessun dato per questo mese. Completa appuntamenti e registra costi per vedere le analisi.',
    });
  }

  return alerts;
}
