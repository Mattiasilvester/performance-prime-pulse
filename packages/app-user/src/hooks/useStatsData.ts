import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserMetrics,
  getWeeklyStats,
  type UserWorkoutStats,
} from '@/services/diaryService';

/** Ritorno di getWeeklyStats: count e totalTime (minuti) */
type WeeklyStats = { count: number; totalTime: number };

export function useStatsData() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserWorkoutStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ count: 0, totalTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);
        const [metricsData, weeklyData] = await Promise.all([
          getUserMetrics(),
          getWeeklyStats(),
        ]);
        setMetrics(metricsData);
        setWeeklyStats(weeklyData);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  return { metrics, weeklyStats, loading };
}
