import type { LucideIcon } from 'lucide-react';
import { Dumbbell, Target, Clock, Award, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  type: string;
  title: string;
  time: string;
  ago: string;
  status: string;
  icon: LucideIcon;
  color: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const recentActivities: Activity[] = [];

        // Carica workout recenti (limite 3 per la card, tutti per la modale)
        const { data: workouts } = await supabase
          .from('custom_workouts')
          .select('title, total_duration, completed_at, workout_type')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false });

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

        // Carica obiettivi recenti (tutti per la modale)
        const { data: objectives } = await supabase
          .from('user_objectives')
          .select('title, completed_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false });

        objectives?.forEach(objective => {
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

        // Salva tutte le attività per la modale
        setAllActivities(recentActivities);
        
        // Mostra solo le prime 3 per la card
        setActivities(recentActivities.slice(0, 3));
      } catch (error) {
        console.error('Error loading recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivities();
  }, []);

  const getIconStyle = (activity: Activity) => {
    const isObjective = activity.type === 'objective';
    const color = isObjective ? '#10B981' : '#EEBA2B';
    const bg = isObjective ? 'rgba(16,185,129,0.1)' : 'rgba(238,186,43,0.08)';
    return { color, background: bg };
  };

  return (
    <div className="bg-[#16161A] rounded-[18px] p-5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#F0EDE8]">Attività Recente</h3>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[13px] text-[#8A8A96] hover:text-[#F0EDE8] transition-colors cursor-pointer"
        >
          Tutto →
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-[#8A8A96] py-8">Caricamento attività...</div>
        ) : activities.length === 0 ? (
          <div className="text-center text-[#8A8A96] py-8">Nessuna attività recente</div>
        ) : (
          activities.map((activity, index) => {
            const Icon = activity.icon;
            const iconStyle = getIconStyle(activity);
            return (
              <div
                key={index}
                className="flex items-center gap-3.5 p-3 bg-[#1E1E24] rounded-[10px] border border-[rgba(255,255,255,0.06)]"
              >
                <div
                  className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: iconStyle.background }}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: iconStyle.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F0EDE8] truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[#8A8A96] mt-0.5">
                    {activity.time && <span>{activity.time}</span>}
                    {activity.time && activity.ago && <span>·</span>}
                    <span>{activity.ago}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modale Attività Recenti */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161A] rounded-[18px] border border-[rgba(255,255,255,0.06)] max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-[#F0EDE8]">Tutte le Attività</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A8A96] hover:text-[#F0EDE8] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {allActivities.length === 0 ? (
                <div className="text-center text-[#8A8A96] py-8">Nessuna attività recente</div>
              ) : (
                <div className="space-y-2">
                  {allActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    const iconStyle = getIconStyle(activity);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3.5 p-3 bg-[#1E1E24] rounded-[10px] border border-[rgba(255,255,255,0.06)]"
                      >
                        <div
                          className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0"
                          style={{ background: iconStyle.background }}
                        >
                          <Icon className="h-5 w-5 shrink-0" style={{ color: iconStyle.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F0EDE8] truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 text-xs text-[#8A8A96] mt-0.5">
                            {activity.time && <span>{activity.time}</span>}
                            {activity.time && activity.ago && <span>·</span>}
                            <span>{activity.ago}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};