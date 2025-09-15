import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import UserManagementTable from '@/components/admin/UserManagementTable';
import { AdminUser } from '@/types/admin.types';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('📊 Loading users with ADMIN client...');
    setLoading(true);
    
    try {
      // USA supabaseAdmin per bypassare RLS
      const { data: profiles, error, count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      console.log('Users query with ADMIN:', { count, error, sample: profiles?.[0] });
      
      if (error) {
        console.error('❌ Users error:', error);
        throw error;
      }
      
      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ No users found');
        setUsers([]);
        return;
      }
      
      // Arricchisci dati utente
      const enrichedUsers = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Conta allenamenti totali (per info)
            const { count: userWorkouts } = await supabaseAdmin
              .from('custom_workouts')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            // Ultimo workout (per info)
            const { data: lastWorkout } = await supabaseAdmin
              .from('custom_workouts')
              .select('created_at')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // LOGICA CORRETTA: Attivo solo se online negli ultimi 5-10 minuti
            const fiveMinutesAgo = new Date();
            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
            
            // Verifica se ha fatto azioni recenti (login, attività) negli ultimi 5 min
            const isActiveNow = profile.last_login && 
              new Date(profile.last_login) > fiveMinutesAgo;

            // Calcola tempo dall'ultimo accesso
            const lastLoginTime = profile.last_login ? new Date(profile.last_login) : null;
            const minutesSinceLogin = lastLoginTime ? 
              Math.floor((new Date() - lastLoginTime) / (1000 * 60)) : null;

            console.log(`👤 ${profile.email}: Last login: ${profile.last_login}, Online ORA: ${isActiveNow}, Minuti fa: ${minutesSinceLogin}`);

            return {
              id: profile.id,
              email: profile.email || 'N/A',
              full_name: profile.full_name || profile.name || 'Senza nome',
              name: profile.full_name || profile.name || 'Senza nome',
              role: profile.role || 'user',
              status: profile.status || 'active',
              subscription_status: profile.subscription_status || 'free',
              created_at: profile.created_at,
              last_login: profile.last_login,
              total_workouts: userWorkouts || 0,
              total_minutes: 0,
              user_workouts: userWorkouts || 0, // Workout totali
              is_active_user: isActiveNow, // Solo se online negli ultimi 5 min
              is_active: profile.is_active !== false,
              last_workout_date: lastWorkout?.created_at,
              minutes_since_login: minutesSinceLogin,
              last_login_formatted: lastLoginTime ? 
                lastLoginTime.toLocaleString('it-IT') : 'Mai',
              ...profile
            };
          } catch (enrichError) {
            console.log('Enrich error for user:', profile.id, enrichError);
            return {
              id: profile.id,
              email: profile.email || 'N/A',
              full_name: profile.full_name || profile.name || 'Senza nome',
              name: profile.full_name || profile.name || 'Senza nome',
              role: profile.role || 'user',
              status: profile.status || 'active',
              subscription_status: profile.subscription_status || 'free',
              created_at: profile.created_at,
              last_login: profile.last_login,
              total_workouts: 0,
              total_minutes: 0,
              user_workouts: 0,
              last_workout_date: null,
              is_active_user: false,
              is_active: profile.is_active !== false,
              ...profile
            };
          }
        })
      );
      
      console.log(`✅ Loaded ${enrichedUsers.length} users with fitness data`);
      setUsers(enrichedUsers);
      
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      console.log(`🔧 Executing action: ${action} for user: ${userId}`);
      
      // Log azione
      const { error: logError } = await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: 'system',
        action,
        target_user_id: userId,
        details: `Action: ${action}`,
        created_at: new Date().toISOString()
      });

      if (logError) {
        console.warn('⚠️ Could not log action:', logError);
      }

      // Ricarica utenti dopo azione
      await loadUsers();
      
    } catch (error) {
      console.error('❌ Error executing action:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Caricamento utenti...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Gestione Utenti</h1>
      <UserManagementTable 
        users={users} 
        onAction={handleUserAction}
        onUserUpdate={loadUsers}
      />
    </div>
  );
}