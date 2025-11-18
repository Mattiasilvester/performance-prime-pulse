import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Clock, Flame } from "lucide-react";
import { getUserMetrics, getWeeklyStats, formatDuration } from "@/services/diaryService";

interface UserStats {
  total_workouts?: number;
  total_hours?: number;
  current_streak_days?: number;
  longest_streak_days?: number;
}

export const StatsWidget = () => {
  const [metrics, setMetrics] = useState<UserStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({ count: 0, totalTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
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

  if (loading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          📊 Le Tue Statistiche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workouts Completed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Dumbbell className="w-4 h-4" />
            Allenamenti Completati
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Questa settimana:</span>
              <p className="text-2xl font-bold text-[#FFD700]">{weeklyStats.count}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Totale:</span>
              <p className="text-lg font-semibold text-foreground">
                {metrics?.total_workouts || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            Tempo Totale
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Questa settimana:</span>
              <p className="text-2xl font-bold text-[#FFD700]">
                {formatDuration(weeklyStats.totalTime)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Totale:</span>
              <p className="text-lg font-semibold text-foreground">
                {formatDuration(Math.round((metrics?.total_hours || 0) * 60))}
              </p>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="w-4 h-4" />
            Streak
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-[#FFD700] flex items-center gap-2">
                {metrics?.current_streak_days || 0}
                {(metrics?.current_streak_days || 0) > 0 && (
                  <Flame className="w-8 h-8 text-[#FFD700] animate-pulse" />
                )}
              </p>
              <span className="text-xs text-muted-foreground">
                giorni consecutivi
              </span>
            </div>
            {(metrics?.longest_streak_days || 0) > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Record:</p>
                <p className="text-lg font-semibold text-foreground">
                  {metrics?.longest_streak_days} giorni
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
