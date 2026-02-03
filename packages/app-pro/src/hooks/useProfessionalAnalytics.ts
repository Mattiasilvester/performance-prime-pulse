/**
 * Step 9: Hook che orchestra il fetch di tutti i dati Andamento & Analytics.
 * Al cambio di timeRange (3/6/12 mesi) aggiorna trend e grafici.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getProfitSummary,
  getRevenueTrend,
  getCostsTrend,
  getMarginTrend,
  getMonthComparison,
  getCostsDistribution,
  getSmartAlertsForProfessional,
  type ProfitSummary,
  type MonthComparison,
  type SmartAlert,
} from '@/services/analyticsService';

export type TimeRange = 3 | 6 | 12;

export interface AnalyticsData {
  profitSummary: ProfitSummary;
  revenueTrend: { month: string; revenue: number }[];
  costsTrend: { month: string; costs: number }[];
  marginTrend: { month: string; margin: number }[];
  monthComparison: MonthComparison;
  costsDistribution: { name: string; value: number }[];
  alerts: SmartAlert[];
}

export function useProfessionalAnalytics(
  professionalId: string | null,
  prezzoSeduta: number
) {
  const [timeRange, setTimeRange] = useState<TimeRange>(6);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAll = useCallback(async () => {
    if (!professionalId) {
      setData(null);
      setLoading(false);
      setIsFirstLoad(false);
      return;
    }
    if (isFirstLoad) setLoading(true);
    try {
      const now = new Date();
      const currY = now.getFullYear();
      const currM = now.getMonth() + 1;

      const [
        profitSummary,
        revenueTrend,
        costsTrend,
        marginTrend,
        monthComparison,
        costsDistribution,
        alerts,
      ] = await Promise.all([
        getProfitSummary(professionalId, prezzoSeduta),
        getRevenueTrend(professionalId, timeRange, prezzoSeduta),
        getCostsTrend(professionalId, timeRange),
        getMarginTrend(professionalId, timeRange, prezzoSeduta),
        getMonthComparison(professionalId, prezzoSeduta),
        getCostsDistribution(professionalId, currY, currM),
        getSmartAlertsForProfessional(professionalId, prezzoSeduta),
      ]);

      setData({
        profitSummary,
        revenueTrend,
        costsTrend,
        marginTrend,
        monthComparison,
        costsDistribution,
        alerts,
      });
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  // isFirstLoad usato solo dentro callback, non deve triggerare refetch
  }, [professionalId, prezzoSeduta, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, isFirstLoad, timeRange, setTimeRange, refetch: fetchAll };
}
