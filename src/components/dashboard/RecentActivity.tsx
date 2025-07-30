import { Dumbbell, Target, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  type: string;
  title: string;
  time: string;
  ago: string;
  status: string;
  icon: any;
  color: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const recentActivities: Activity[] = [];

        // Carica workout recenti
        const { data: workouts } = await supabase
          .from('custom_workouts')
          .select('title, total_duration, completed_at, workout_type')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(3);

        workouts?.forEach(workout => {
          const completedDate = new Date(workout.completed_at);
          const now = new Date();
          const diffHours = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60));
          
          let timeAgo = '';
          if (diffHours < 1) timeAgo = 'meno di 1 ora fa';
          else if (diffHours < 24) timeAgo = `${diffHours} ore fa`;
          else timeAgo = `${Math.floor(diffHours / 24)} giorni fa`;

          recentActivities.push({
            type: 'workout',
            title: `${workout.title} completato`,
            time: workout.total_duration ? `${workout.total_duration} min` : '',
            ago: timeAgo,
            status: 'completed',
            icon: Dumbbell,
            color: 'text-pp-gold',
          });
        });

        // Carica obiettivi recenti
        try {
          const { data: objectives, error: objectivesError } = await supabase
            .from('user_objectives')
            .select('title, completed_at')
            .eq('user_id', user.id)
            .eq('completed', true)
            .order('completed_at', { ascending: false })
            .limit(2);

          if (!objectivesError && objectives) {
            objectives.forEach(objective => {
              if (objective.completed_at) {
                const completedDate = new Date(objective.completed_at);
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60));
                
                let timeAgo = '';
                if (diffHours < 1) timeAgo = 'meno di 1 ora fa';
                else if (diffHours < 24) timeAgo = `${diffHours} ore fa`;
                else timeAgo = `${Math.floor(diffHours / 24)} giorni fa`;

                recentActivities.push({
                  type: 'objective',
                  title: `Obiettivo "${objective.title}" raggiunto`,
                  time: '',
                  ago: timeAgo,
                  status: 'completed',
                  icon: Target,
                  color: 'text-pp-gold',
                });
              }
            });
          } else {
            console.warn('Tabella user_objectives non disponibile:', objectivesError);
          }
        } catch (error) {
          console.error('Error loading objectives:', error);
        }

        // Ordina per data più recente
        recentActivities.sort((a, b) => {
          const getHoursFromAgo = (ago: string) => {
            if (ago.includes('meno di 1 ora')) return 0;
            if (ago.includes('ore fa')) return parseInt(ago.split(' ')[0]);
            if (ago.includes('giorni fa')) return parseInt(ago.split(' ')[0]) * 24;
            return 999;
          };
          return getHoursFromAgo(a.ago) - getHoursFromAgo(b.ago);
        });

        setActivities(recentActivities.slice(0, 4));
      } catch (error) {
        console.error('Error loading recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivities();
  }, []);

  return (
    <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg border-2 border-[#c89116]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Attività Recenti</h3>
        <button className="text-sm text-white hover:text-pp-gold font-medium transition-colors">
          Vedi tutte
        </button>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-pp-gold/60 py-8">
            Caricamento attività...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-pp-gold/60 py-8">
            Nessuna attività recente
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-center space-x-3 p-3 hover:bg-[#c89116]/10 rounded-xl transition-colors">
                <div className={`p-2 rounded-xl bg-[#c89116]/20 border border-[#c89116]`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{activity.title}</p>
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                    <span>•</span>
                    <span>{activity.ago}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};