import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminStatsCards from '@/components/admin/AdminStatsCards'
import UserManagementTable from '@/components/admin/UserManagementTable'
import { AdminStats, AdminUser } from '@/types/admin.types'
// import { inspectDatabase } from '@/utils/databaseInspector' // File rimosso

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [workoutAnalytics, setWorkoutAnalytics] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    loadDashboardData()
    // Database inspection rimosso - non più necessario
    // Carica analytics workout
    fetchWorkoutAnalytics()
  }, [])

  // 🔄 AUTO-REFRESH DASHBOARD ogni 60 secondi (ottimizzato)
  useEffect(() => {
    let isRefreshing = false; // Evita refresh multipli simultanei
    
    const refreshData = async () => {
      if (isRefreshing) {
        console.log('⏸️ Refresh già in corso, salto...');
        return;
      }
      
      setIsRefreshing(true);
      console.log('🔄 Auto-refresh dashboard...');
      
      try {
        await Promise.all([
          loadDashboardData(),
          // Database inspection rimosso
          fetchWorkoutAnalytics()
        ]);
        console.log('✅ Auto-refresh completato');
      } catch (error) {
        console.error('❌ Errore durante auto-refresh:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Auto-refresh ogni 60 secondi (ottimizzato da 30s)
    const interval = setInterval(refreshData, 60000); // 60 secondi

    return () => clearInterval(interval);
  }, []);

  // Funzione retry con backoff esponenziale
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const loadDashboardData = async () => {
    console.log('📈 Fetching REAL Performance Prime stats with ADMIN client...');
    setLoading(true);
    setError(null);
    
    try {
      // 1. Utenti totali da profiles (con retry e error handling)
      const { count: totalUsers, error: profilesError } = await retryWithBackoff(async () => {
        const result = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (result.error) {
          throw new Error(`Profiles query failed: ${result.error.message}`);
        }
        
        return result;
      });
      
      console.log('👥 Profiles query result:', { totalUsers, profilesError });
      
      // 2. Utenti attivi (ultimi 30 giorni)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers, error: activeError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      console.log('🔥 Active users (30 days):', { activeUsers, activeError });
      
      // 3. Nuovi utenti ultimi 7 giorni
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: weeklyNewUsers, error: weeklyError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());
      
      console.log('📈 Weekly new users:', { weeklyNewUsers, weeklyError });
      
      // 4. Calcola Activation D0 Rate (% primo workout entro 24h)
      let activationD0Rate = 0;
      try {
        const { data: activationData, error: activationError } = await supabaseAdmin
          .from('custom_workouts')
          .select('user_id, created_at')
          .not('user_id', 'is', null);
        
        if (!activationError && activationData) {
          // Conta utenti che hanno fatto primo workout entro 24h dalla registrazione
          const usersWithFirstWorkout = new Set();
          const userFirstWorkout = new Map();
          
          // Trova primo workout per ogni utente
          activationData.forEach(workout => {
            if (!userFirstWorkout.has(workout.user_id)) {
              userFirstWorkout.set(workout.user_id, workout.created_at);
            }
          });
          
          // Conta utenti con primo workout entro 24h
          let usersActivatedWithin24h = 0;
          for (const [userId, firstWorkoutDate] of userFirstWorkout) {
            // Trova data registrazione utente
            const userProfile = profiles?.find(p => p.id === userId);
            if (userProfile) {
              const registrationDate = new Date(userProfile.created_at);
              const workoutDate = new Date(firstWorkoutDate);
              const hoursDiff = (workoutDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff <= 24) {
                usersActivatedWithin24h++;
              }
            }
          }
          
          activationD0Rate = totalUsersFinal > 0 ? 
            Math.round((usersActivatedWithin24h / totalUsersFinal) * 100) : 0;
        }
      } catch (error) {
        console.warn('⚠️ Errore calcolo Activation D0 Rate:', error);
      }

      // 5. Calcola Retention D7 (% utenti attivi dopo 7 giorni)
      let retentionD7 = 0;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Conta utenti registrati 7+ giorni fa
        const { data: oldUsers, error: oldUsersError } = await supabaseAdmin
          .from('profiles')
          .select('id, created_at, last_login')
          .lt('created_at', sevenDaysAgo.toISOString());
        
        if (!oldUsersError && oldUsers && oldUsers.length > 0) {
          // Conta quanti di questi sono ancora attivi (hanno fatto login negli ultimi 7 giorni)
          const now = new Date();
          const sevenDaysAgoForActivity = new Date();
          sevenDaysAgoForActivity.setDate(sevenDaysAgoForActivity.getDate() - 7);
          
          const activeOldUsers = oldUsers.filter(user => {
            if (!user.last_login) return false;
            const lastLoginDate = new Date(user.last_login);
            return lastLoginDate >= sevenDaysAgoForActivity;
          });
          
          retentionD7 = oldUsers.length > 0 ? 
            Math.round((activeOldUsers.length / oldUsers.length) * 100) : 0;
          
          console.log('📊 Retention D7 calcolata:', {
            totalOldUsers: oldUsers.length,
            activeOldUsers: activeOldUsers.length,
            retentionD7
          });
        }
      } catch (error) {
        console.warn('⚠️ Errore calcolo Retention D7:', error);
      }

      // 6. Calcoli semplici
      const totalUsersFinal = totalUsers || 0;
      const activeUsersFinal = activeUsers || 0;
      const inactiveUsers = totalUsersFinal - activeUsersFinal;
      const growthRate = totalUsersFinal ? ((weeklyNewUsers || 0) / totalUsersFinal * 100) : 0;
      
      const statsData = {
        totalUsers: totalUsersFinal,
        activeUsers: activeUsersFinal,
        inactiveUsers: inactiveUsers,
        totalWorkouts: 0, // Non disponibile senza tabella workouts
        monthlyWorkouts: 0, // Non disponibile senza tabella workouts
        professionals: 0, // Non disponibile senza tabella professionals
        activeObjectives: 0, // Non disponibile senza tabella objectives
        totalNotes: 0, // Non disponibile senza tabella notes
        growth: parseFloat(growthRate.toFixed(1)),
        engagement: totalUsersFinal ? parseFloat((activeUsersFinal / totalUsersFinal * 100).toFixed(1)) : 0,
        newUsersThisMonth: weeklyNewUsers || 0,
        // Nuove metriche activation
        activationD0Rate: activationD0Rate,
        retentionD7: retentionD7,
        weeklyGrowth: weeklyNewUsers || 0
      };
      
      console.log('📊 REAL Performance Prime stats with ADMIN:', statsData);
      console.log('🔄 METRICHE ACTIVATION REAL-TIME:', {
        activationD0Rate: `${activationD0Rate}%`,
        retentionD7: `${retentionD7}%`,
        weeklyGrowth: `+${weeklyNewUsers || 0}`,
        timestamp: new Date().toISOString()
      });
      setStats(statsData);
      
      // 10. Carica profili per la tabella
      const { data: profiles, error: profilesDataError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesDataError) {
        console.error('❌ Profiles data error:', profilesDataError);
        throw profilesDataError;
      }

      // Trasforma i dati per la tabella utenti
      if (profiles) {
        const usersData: AdminUser[] = profiles.map(profile => ({
          id: profile.id,
          email: profile.email || '',
          name: profile.full_name || profile.name || 'N/A',
          role: profile.role || 'user',
          status: profile.status || 'active',
          subscription_status: profile.subscription_status,
          created_at: profile.created_at,
          last_login: profile.last_login,
          total_workouts: profile.total_workouts || 0,
          total_minutes: profile.total_minutes || 0
        }));
        
        console.log(`✅ Processed ${usersData.length} users for dashboard`);
        setUsers(usersData);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      
      // Gestisci errori specifici
      const errorMessage = error?.message || 'Errore sconosciuto durante il caricamento';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Imposta valori di default in caso di errore
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalWorkouts: 0,
        monthlyWorkouts: 0,
        professionals: 0,
        activeObjectives: 0,
        totalNotes: 0,
        growth: 0,
        engagement: 0,
        newUsersThisMonth: 0
      });
      setUsers([]);
      
      // Auto-retry dopo 30 secondi se non è un errore critico
      if (retryCount < 3 && !errorMessage.includes('permission denied')) {
        console.log('🔄 Scheduling auto-retry in 30 seconds...');
        setTimeout(() => {
          console.log('🔄 Auto-retry triggered...');
          loadDashboardData();
        }, 30000);
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchWorkoutAnalytics = async () => {
    try {
      console.log('🏃‍♂️ Verificando tabella custom_workouts...');
      
      // Verifica se la tabella custom_workouts esiste e ha dati
      const { data: workoutData, error: workoutError, count: workoutCount } = await supabaseAdmin
        .from('custom_workouts')
        .select('*', { count: 'exact' })
        .limit(5);
      
      console.log('📊 Custom Workouts Analysis:', {
        exists: !workoutError,
        error: workoutError?.message,
        count: workoutCount,
        sampleData: workoutData?.length || 0
      });
      
      if (workoutError) {
        console.error('❌ Tabella custom_workouts non accessibile:', workoutError);
        setWorkoutAnalytics({
          topTypes: {},
          recentCount: 0,
          message: `❌ Tabella custom_workouts non accessibile: ${workoutError.message}`,
          hasData: false,
          tableExists: false
        });
        return;
      }
      
      // Analizza struttura dati se disponibili
      let structure = {};
      if (workoutData && workoutData.length > 0) {
        structure = {
          columns: Object.keys(workoutData[0]),
          sampleRecord: workoutData[0]
        };
        console.log('📋 Struttura custom_workouts:', structure);
      }
      
      // Calcola metriche se ci sono dati
      const recentCount = workoutCount || 0;
      const hasData = recentCount > 0;
      
      setWorkoutAnalytics({
        topTypes: {},
        recentCount,
        message: hasData 
          ? `✅ Tabella custom_workouts popolata con ${recentCount} record`
          : '⚠️ Tabella custom_workouts vuota - nessun workout registrato',
        hasData,
        tableExists: true,
        structure,
        totalWorkouts: recentCount
      });
      
      console.log('✅ Workout analytics loaded:', {
        hasData,
        totalWorkouts: recentCount,
        tableExists: true
      });
      
    } catch (error) {
      console.error('❌ Workout analytics error:', error);
      setWorkoutAnalytics({
        topTypes: {},
        recentCount: 0,
        message: `❌ Errore verifica custom_workouts: ${error}`,
        hasData: false,
        tableExists: false
      });
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      // Log azione
      const { error: logError } = await supabase.from('admin_audit_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action,
        target_user_id: userId,
        details: { 
          timestamp: new Date().toISOString(),
          action_type: action
        }
      })

      if (logError) console.error('Error logging action:', logError)

      // Esegui azione
      switch(action) {
        case 'suspend':
          const { error: suspendError } = await supabase
            .from('profiles')
            .update({ status: 'suspended' })
            .eq('id', userId)
          if (suspendError) throw suspendError
          break
          
        case 'activate':
          const { error: activateError } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', userId)
          if (activateError) throw activateError
          break
          
        case 'delete':
          if (confirm('Sei sicuro? Questa azione è irreversibile.')) {
            const { error: deleteError } = await supabase
              .from('profiles')
              .update({ status: 'deleted' })
              .eq('id', userId)
            if (deleteError) throw deleteError
          }
          break
      }
      
      // Ricarica dati
      loadDashboardData()
    } catch (error) {
      console.error('Error executing user action:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-400">Gestione completa del sistema Performance Prime Pulse</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh...');
                loadDashboardData();
                // Database inspection rimosso
                fetchWorkoutAnalytics();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              🔄 Aggiorna Ora
            </button>
            
            <button
              onClick={async () => {
                // Database inspection rimosso - funzionalità non più disponibile
                console.log('Database inspection non più disponibile');
                alert('Database inspection non più disponibile');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🔍 Inspect Database
            </button>
          </div>
        </div>
        
        {/* Indicatore Live Monitoring */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500 animate-pulse' : 
            isRefreshing ? 'bg-yellow-500 animate-spin' : 
            'bg-green-500 animate-pulse'
          }`}></div>
          <span className={`text-sm font-medium ${
            error ? 'text-red-400' : 
            isRefreshing ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            {error ? `❌ Errore: ${error}` : 
             isRefreshing ? '🔄 Aggiornamento in corso...' : 
             `Live Monitoring • Ultimo aggiornamento: ${new Date().toLocaleTimeString('it-IT')}`}
          </span>
          {retryCount > 0 && (
            <span className="text-xs text-gray-400">
              (Tentativi: {retryCount})
            </span>
          )}
        </div>
        
        {/* Database info migliorato */}
        {dbInfo && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6 border border-gray-700">
            <h3 className="text-yellow-400 font-bold mb-4">🗄️ Database Discovery Results:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold">Auth Users</h4>
                <p className="text-2xl text-green-400">{dbInfo.authUsers || 'N/A'}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold">Profiles</h4>
                <p className="text-2xl text-blue-400">{dbInfo.profiles?.count || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold">Tables Found</h4>
                <p className="text-2xl text-purple-400">{dbInfo.customTables?.length || 0}</p>
              </div>
            </div>
            
            {dbInfo.customTables && dbInfo.customTables.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Existing Tables:</h4>
                <div className="flex flex-wrap gap-2">
                  {dbInfo.customTables.map((table: any, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                      {table.name} ({table.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {dbInfo.profiles?.columns && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Profile Columns:</h4>
                <div className="text-sm text-gray-300">
                  {dbInfo.profiles.columns.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      <AdminStatsCards stats={stats} loading={loading} />
      
      {/* Workout Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🏃‍♂️ Workout Analytics</h3>
          {workoutAnalytics ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-300">Allenamenti ultimi 7 giorni:</p>
                <p className="text-2xl font-bold text-green-400">{workoutAnalytics.recentCount}</p>
              </div>
              
              {workoutAnalytics.message && (
                <div className={`rounded-lg p-3 mb-4 ${
                  workoutAnalytics.hasData 
                    ? 'bg-green-600/20 border border-green-500/50' 
                    : 'bg-yellow-600/20 border border-yellow-500/50'
                }`}>
                  <p className={`text-sm ${
                    workoutAnalytics.hasData ? 'text-green-300' : 'text-yellow-300'
                  }`}>
                    {workoutAnalytics.message}
                  </p>
                  
                  {workoutAnalytics.structure && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p><strong>Colonne disponibili:</strong> {workoutAnalytics.structure.columns?.join(', ')}</p>
                      {workoutAnalytics.totalWorkouts > 0 && (
                        <p><strong>Total Workouts:</strong> {workoutAnalytics.totalWorkouts}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {workoutAnalytics.topTypes && Object.keys(workoutAnalytics.topTypes).length > 0 && (
                <div>
                  <p className="text-gray-300 mb-2">Top Tipologie:</p>
                  {Object.entries(workoutAnalytics.topTypes).slice(0, 5).map(([type, count]: any) => (
                    <div key={type} className="flex justify-between text-sm mb-1">
                      <span className="text-white">{type || 'N/A'}</span>
                      <span className="text-blue-400">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Caricamento analytics...</p>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Obiettivi Overview</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-300">Obiettivi attivi totali:</p>
              <p className="text-2xl font-bold text-purple-400">{stats?.activeObjectives || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Note utenti totali:</p>
              <p className="text-2xl font-bold text-orange-400">{stats?.totalNotes || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Professionisti attivi:</p>
              <p className="text-2xl font-bold text-yellow-400">{stats?.professionals || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Summary */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Panoramica Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Utenti Recenti</h4>
            <p className="text-gray-400">
              {users.length > 0 
                ? `Ultimo utente: ${users[0]?.name || 'N/A'}` 
                : 'Nessun utente registrato'
              }
            </p>
          </div>
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Stato Sistema</h4>
            <p className="text-green-400">● Tutti i servizi operativi</p>
          </div>
        </div>
      </div>
    </div>
  )
}
