
import { TrendingUp, Target, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWorkoutStats } from '@/services/workoutStatsService';
import { supabase } from '@/integrations/supabase/client';
import { useMedalSystem } from '@/hooks/useMedalSystem';
import { ChallengeModal } from '@/components/medals/ChallengeModal';

interface StatsData {
  totalWorkouts: number;
  totalHours: number;
  totalObjectives: number;
  completedObjectives: number;
}

export const StatsOverview = () => {
  const [stats, setStats] = useState<StatsData>({
    totalWorkouts: 0,
    totalHours: 0,
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
  } = useMedalSystem();

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Carica statistiche workout
        const workoutStats = await fetchWorkoutStats();
        
        // Carica obiettivi
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Ottieni dati card medaglie dinamici
  const medalCardData = getMedalCardData();

  const statsCards = [
    {
      label: 'Allenamenti completati',
      value: loading ? '...' : stats.totalWorkouts.toString(),
      change: '+0%',
      icon: TrendingUp,
      color: 'text-pp-gold',
      bgColor: 'bg-black',
    },
    {
      label: 'Obiettivi raggiunti',
      value: loading ? '...' : `${stats.completedObjectives}/${stats.totalObjectives}`,
      change: '+0',
      icon: Target,
      color: 'text-pp-gold',
      bgColor: 'bg-black',
    },
    {
      label: 'Tempo totale',
      value: loading ? '...' : `${stats.totalHours}h`,
      change: '+0h',
      icon: Clock,
      color: 'text-pp-gold',
      bgColor: 'bg-black',
    },
    {
      label: medalCardData.label,
      value: loading ? '...' : medalCardData.value,
      change: medalCardData.state === 'challenge_active' ? `${medalCardData.daysRemaining}d` : '+0',
      icon: Award,
      color: 'text-pp-gold',
      bgColor: 'bg-black',
      description: medalCardData.description,
      isMedalCard: true,
      medalData: medalCardData
    },
  ];
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const isMedalCard = (stat as any).isMedalCard;
          const medalData = (stat as any).medalData;
          
          return (
            <div
              key={stat.label}
              className={`bg-gradient-to-br from-black to-[#c89116]/20 rounded-2xl p-4 shadow-lg border-2 border-[#c89116] hover:shadow-xl hover:shadow-[#c89116]/20 transition-all duration-200 ${
                isMedalCard && medalData.state === 'challenge_active' ? 'ring-2 ring-pp-gold/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl bg-[#c89116]/20 border border-[#c89116]`}>
                  {isMedalCard ? (
                    <span className="text-lg">{medalData.icon}</span>
                  ) : (
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  )}
                </div>
                <span className="text-sm font-medium text-white">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-pp-gold">{stat.value}</p>
                <p className="text-sm text-white">{stat.label}</p>
                {isMedalCard && (stat as any).description && (
                  <p className="text-xs text-pp-gold/80">{(stat as any).description}</p>
                )}
                {isMedalCard && medalData.state === 'challenge_active' && medalData.progress !== undefined && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-pp-gold h-1 rounded-full transition-all duration-300"
                        style={{ width: `${(medalData.progress / 3) * 100}%` }}
                      ></div>
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
