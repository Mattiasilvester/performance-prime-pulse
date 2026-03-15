
import { Zap, Target, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWorkoutStats } from '@/services/workoutStatsService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { ChallengeModal } from '@/components/medals/ChallengeModal';

interface StatsData {
  totalWorkouts: number;
  totalHours: string; // Ora è una stringa formattata (es. "39m" o "1h 30m")
  totalMinutes?: number; // Minuti totali per calcoli interni
  totalObjectives: number;
  completedObjectives: number;
}

export const StatsOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalWorkouts: 0,
    totalHours: '0h 0m',
    totalObjectives: 0,
    completedObjectives: 0
  });
  const [loading, setLoading] = useState(true);

  // Hook per sistema medaglie e sfide
  const {
    medalSystem,
    challengeModal,
    getMedalCardData,
    startKickoffChallenge,
    closeChallengeModal
  } = useMedalSystemContext();

  useEffect(() => {
    if (!user?.id) return;
    const loadStats = async () => {
      try {
        const workoutStats = await fetchWorkoutStats(user.id);
        const { data: objectives } = await supabase
          .from('user_objectives')
          .select('completed')
          .eq('user_id', user.id);
        const totalObjectives = objectives?.length || 0;
        const completedObjectives = objectives?.filter(obj => obj.completed).length || 0;
        setStats({
          totalWorkouts: workoutStats.total_workouts,
          totalHours: workoutStats.total_hours,
          totalObjectives,
          completedObjectives
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Ascolta l'evento di completamento workout per refresh automatico
    const handleWorkoutCompleted = () => {
      loadStats();
    };

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
    };
  }, [user?.id]);

  // Ottieni dati card medaglie dinamici
  const medalCardData = getMedalCardData();

  interface StatCardRow {
    label: string;
    value: string;
    change: string;
    icon: typeof Zap;
    iconColor: string;
    iconBg: string;
    description?: string;
    isMedalCard?: boolean;
    medalData?: ReturnType<typeof getMedalCardData>;
  }

  const statsCards: StatCardRow[] = [
    {
      label: 'Allenamenti completati',
      value: loading ? '...' : stats.totalWorkouts.toString(),
      change: '+0%',
      icon: Zap,
      iconColor: '#EEBA2B',
      iconBg: 'rgba(238,186,43,0.08)',
    },
    {
      label: 'Obiettivi raggiunti',
      value: loading ? '...' : `${stats.completedObjectives}/${stats.totalObjectives}`,
      change: '+0',
      icon: Target,
      iconColor: '#10B981',
      iconBg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Tempo totale',
      value: loading ? '...' : stats.totalHours,
      change: '+0h',
      icon: Clock,
      iconColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.1)',
    },
    {
      label: medalCardData.label,
      value: loading ? '...' : medalCardData.value,
      change: medalCardData.state === 'challenge_active' ? `${medalCardData.daysRemaining}d` : '+0',
      icon: Award,
      iconColor: '#EEBA2B',
      iconBg: 'rgba(238,186,43,0.08)',
      description: medalCardData.description,
      isMedalCard: true,
      medalData: medalCardData
    },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-0">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const isMedalCard = stat.isMedalCard;
          const medalData = stat.medalData;
          
          return (
            <div
              key={stat.label}
              className={`bg-[#16161A] rounded-[14px] p-4 border border-[rgba(255,255,255,0.06)] ${
                isMedalCard && medalData?.state === 'challenge_active' ? 'ring-1 ring-[#EEBA2B]/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: stat.iconBg }}
                >
                  {isMedalCard && medalData ? (
                    <span className="text-lg" style={{ color: stat.iconColor }}>{medalData.icon}</span>
                  ) : (
                    <Icon className="w-5 h-5 shrink-0" style={{ color: stat.iconColor }} />
                  )}
                </div>
                <span
                  className="text-[12px] font-semibold rounded-full py-0.5 px-2"
                  style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}
                >
                  {stat.change}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-[#F0EDE8]">{stat.value}</p>
                <p className="text-[11px] text-[#8A8A96] uppercase tracking-[0.5px]">{stat.label}</p>
                {isMedalCard && stat.description && (
                  <p className="text-[11px] text-[#8A8A96] mt-1">{stat.description}</p>
                )}
                {isMedalCard && medalData?.state === 'challenge_active' && medalData.progress !== undefined && (
                  <div className="mt-1">
                    <div className="w-full bg-[#2a2a2e] rounded-full h-1">
                      <div 
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ width: `${((medalData?.progress ?? 0) / 3) * 100}%`, background: '#EEBA2B' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Sfida */}
      <ChallengeModal
        modalData={challengeModal}
        onClose={closeChallengeModal}
        onStartChallenge={startKickoffChallenge}
      />
    </>
  );
};
