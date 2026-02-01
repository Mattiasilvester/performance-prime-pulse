import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import AdminStatsCards from '@/components/admin/AdminStatsCards'
import { AdminStats } from '@/types/admin.types'

const fetchAdminStats = async (): Promise<AdminStats> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error('Sessione amministratore non trovata')
  }

  // TODO: Edge Function da creare con il nuovo SuperAdmin
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats?includeWorkouts=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Impossibile recuperare le statistiche admin')
  }

  return response.json()
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 🔄 AUTO-REFRESH DASHBOARD ogni 60 secondi (ottimizzato)
  useEffect(() => {
    const isRefreshing = false; // Evita refresh multipli simultanei
    
    const refreshData = async () => {
      if (isRefreshing) {
        console.log('⏸️ Refresh già in corso, salto...');
        return;
      }
      
      setIsRefreshing(true);
      console.log('🔄 Auto-refresh dashboard...');
      
      try {
        await loadDashboardData();
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

  const loadDashboardData = async () => {
    console.log('📈 Fetching Performance Prime stats via Edge Function...');
    setLoading(true);
    setError(null);
    
    try {
      const apiStats = await fetchAdminStats()
      const normalizedStats: AdminStats = {
        totalUsers: apiStats.totalUsers ?? 0,
        payingUsers: apiStats.payingUsers ?? 0,
        activeToday: apiStats.activeToday ?? 0,
        revenue: apiStats.revenue ?? 0,
        churnRate: apiStats.churnRate ?? 0,
        conversionRate: apiStats.conversionRate ?? 0,
        activeUsers: apiStats.activeUsers ?? 0,
        inactiveUsers: apiStats.inactiveUsers ?? Math.max((apiStats.totalUsers ?? 0) - (apiStats.activeUsers ?? 0), 0),
        totalWorkouts: apiStats.totalWorkouts ?? apiStats.workoutAnalytics?.totalWorkouts ?? 0,
        monthlyWorkouts: apiStats.monthlyWorkouts ?? 0,
        totalPT: apiStats.totalPT ?? 0,
        professionals: apiStats.professionals ?? 0,
        activeObjectives: apiStats.activeObjectives ?? 0,
        totalNotes: apiStats.totalNotes ?? 0,
        growth: apiStats.growth ?? 0,
        engagement: apiStats.engagement ?? 0,
        newUsersThisMonth: apiStats.newUsersThisMonth ?? apiStats.newUsersLast7Days ?? 0,
        activationD0Rate: apiStats.activationD0Rate ?? apiStats.activationRate ?? 0,
        activationRate: apiStats.activationRate ?? apiStats.activationD0Rate ?? 0,
        retentionD7: apiStats.retentionD7 ?? 0,
        weeklyGrowth: apiStats.weeklyGrowth ?? apiStats.newUsersLast7Days ?? 0,
        newUsersLast7Days: apiStats.newUsersLast7Days ?? 0,
        workoutAnalytics: apiStats.workoutAnalytics,
      };

      console.log('📊 admin-stats function response:', normalizedStats);
      setStats(normalizedStats);
      
    } catch (error: unknown) {
      console.error('❌ Error loading dashboard:', error);
      
      // Gestisci errori specifici
      const errorMessage = (error as Error)?.message || 'Errore sconosciuto durante il caricamento';
      setError(errorMessage);
      
      // Imposta valori di default in caso di errore
      setStats({
        totalUsers: 0,
        payingUsers: 0,
        activeToday: 0,
        revenue: 0,
        churnRate: 0,
        conversionRate: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalWorkouts: 0,
        monthlyWorkouts: 0,
        professionals: 0,
        activeObjectives: 0,
        totalNotes: 0,
        totalPT: 0,
        growth: 0,
        engagement: 0,
        newUsersThisMonth: 0,
        activationD0Rate: 0,
        activationRate: 0,
        retentionD7: 0,
        weeklyGrowth: 0,
        newUsersLast7Days: 0,
        workoutAnalytics: undefined,
      });
    } finally {
      setLoading(false);
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
                await loadDashboardData();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              🔄 Aggiorna Ora
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
        </div>
      </div>
      
      {/* Stats Cards */}
      <AdminStatsCards stats={stats} loading={loading} />
      
      {/* TODO (Fase 2): migrare workout analytics e gestione utenti a Edge Functions dedicate */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Panoramica Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Workout totali</h4>
            <p className="text-gray-400">
              {stats?.workoutAnalytics?.totalWorkouts ?? 0} allenamenti registrati
            </p>
          </div>
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Attività media per utente</h4>
            <p className="text-gray-400">
              {stats?.workoutAnalytics?.avgWorkoutsPerUser ?? 0} workout/utente
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          TODO: Migrare elenco utenti e analytics dettagliati tramite Edge Functions dedicate (admin-users, admin-analytics).
        </p>
      </div>
    </div>
  )
}
