import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminStatsCards from '@/components/admin/AdminStatsCards'
import UserManagementTable from '@/components/admin/UserManagementTable'
import { AdminStats, AdminUser } from '@/types/admin.types'
import { inspectDatabase } from '@/utils/databaseInspector'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [workoutAnalytics, setWorkoutAnalytics] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
    // Ispeziona database all'avvio
    inspectDatabase().then(setDbInfo)
    // Carica analytics workout
    fetchWorkoutAnalytics()
  }, [])

  // 🔄 AUTO-REFRESH DASHBOARD ogni 30 secondi
  useEffect(() => {
    const refreshData = () => {
      console.log('🔄 Auto-refresh dashboard...');
      loadDashboardData();
      inspectDatabase().then(setDbInfo);
      fetchWorkoutAnalytics();
    };

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh dashboard...');
      refreshData();
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    console.log('📈 Fetching REAL Performance Prime stats with ADMIN client...');
    setLoading(true);
    
    try {
      // 1. Utenti totali da profiles (con supabaseAdmin per bypassare RLS)
      const { count: totalUsers, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('👥 Profiles query result:', { totalUsers, profilesError });
      
      if (profilesError) {
        console.error('❌ Profiles error:', profilesError);
        throw profilesError;
      }
      
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
      
      // 4. Calcoli semplici
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
        newUsersThisMonth: weeklyNewUsers || 0
      };
      
      console.log('📊 REAL Performance Prime stats with ADMIN:', statsData);
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
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
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
    } finally {
      setLoading(false);
    }
  }

  const fetchWorkoutAnalytics = async () => {
    try {
      console.log('🏃‍♂️ Fetching workout analytics from EXISTING tables...');
      
      // Per ora non abbiamo tabelle workout, quindi mostriamo dati placeholder
      setWorkoutAnalytics({
        topTypes: {},
        recentCount: 0,
        message: 'Tabelle workout non disponibili - usando dati da profiles'
      });
      
      console.log('✅ Workout analytics placeholder loaded');
      
    } catch (error) {
      console.error('❌ Workout analytics error:', error);
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
                inspectDatabase().then(setDbInfo);
                fetchWorkoutAnalytics();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              🔄 Aggiorna Ora
            </button>
            
            <button
              onClick={async () => {
                const info = await inspectDatabase();
                setDbInfo(info);
                console.log('Database Info:', info);
                alert('Check console for database structure');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🔍 Inspect Database
            </button>
          </div>
        </div>
        
        {/* Indicatore Live Monitoring */}
        <div className="mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">
            Live Monitoring • Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
          </span>
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
      <AdminStatsCards stats={stats} />
      
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
                <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">{workoutAnalytics.message}</p>
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
