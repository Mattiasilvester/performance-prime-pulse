import { useState, useEffect, useCallback } from 'react'
import AdminStatsCards from '@/components/admin/AdminStatsCards'
import PulseCheckCards from '@/components/admin/PulseCheckCards'
import AdminKpiAggiuntivi from '@/components/admin/AdminKpiAggiuntivi'
import { AdminStats, PendingApplication as PendingApp, AdminProfessionalRow } from '@/types/admin.types'
import { approveApplication, rejectApplication } from '@/services/adminApplicationService'
import { useToast } from '@/hooks/use-toast'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'

const fetchAdminStats = async (): Promise<AdminStats> => {
  // SuperAdmin usa bypass (localStorage), non sessione Supabase Auth → usiamo anon key per le Edge Function
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY non configurata')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ includeApplications: true, includeProfessionals: true }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error((errorBody as { error?: string }).error || 'Impossibile recuperare le statistiche admin')
  }

  return response.json()
}

const categoryLabel: Record<string, string> = {
  pt: 'PT',
  nutrizionista: 'Nutrizionista',
  fisioterapista: 'Fisioterapista',
  mental_coach: 'Mental Coach',
  osteopata: 'Osteopata',
  altro: 'Altro',
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiStats = await fetchAdminStats()
      const normalizedStats: AdminStats = {
        ...apiStats,
        totalUsers: apiStats.totalUsers ?? 0,
        pulseCheck: apiStats.pulseCheck,
        pendingApplicationsCount: apiStats.pendingApplicationsCount ?? 0,
        pendingApplications: apiStats.pendingApplications ?? [],
        professionalsList: apiStats.professionalsList ?? [],
        professionals: apiStats.professionals ?? apiStats.totalPT ?? 0,
        newUsersLast7Days: apiStats.newUsersLast7Days ?? apiStats.weeklyGrowth ?? 0,
        weeklyGrowth: apiStats.weeklyGrowth ?? apiStats.newUsersLast7Days ?? 0,
        revenue: apiStats.revenue ?? apiStats.pulseCheck?.gmvThisMonth ?? 0,
      }
      setStats(normalizedStats)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore caricamento'
      setError(msg)
      setStats({
        totalUsers: 0,
        payingUsers: 0,
        activeToday: 0,
        revenue: 0,
        churnRate: 0,
        conversionRate: 0,
        pulseCheck: undefined,
        pendingApplications: [],
        professionalsList: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((s) => s ? { ...s } : null)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleApprove = async (applicationId: string) => {
    setActionId(applicationId)
    try {
      await approveApplication(applicationId)
      toast({ title: 'Applicazione approvata', description: 'Professionista creato.' })
      await loadDashboardData()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: e instanceof Error ? e.message : 'Approva fallita',
      })
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    const reason = rejectReason[applicationId] ?? 'Rifiutato da amministratore'
    setActionId(applicationId)
    try {
      await rejectApplication(applicationId, reason)
      toast({ title: 'Applicazione rifiutata' })
      setRejectReason((prev) => ({ ...prev, [applicationId]: '' }))
      await loadDashboardData()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: e instanceof Error ? e.message : 'Rifiuta fallita',
      })
    } finally {
      setActionId(null)
    }
  }

  const [proFilter, setProFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const professionalsList = stats?.professionalsList ?? []
  const filteredPros =
    proFilter === 'active'
      ? professionalsList.filter((p) => p.approval_status === 'approved' && p.attivo)
      : proFilter === 'inactive'
        ? professionalsList.filter((p) => p.approval_status !== 'approved' || !p.attivo)
        : professionalsList

  if (loading && !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded" />
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
            <h1 className="text-3xl font-bold text-white mb-2">Overview — Pulse Check</h1>
            <p className="text-gray-400">Il polso del business in 5 secondi</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true)
              loadDashboardData().finally(() => setIsRefreshing(false))
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Aggiorna
          </button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              error ? 'bg-red-500 animate-pulse' : isRefreshing ? 'bg-yellow-500 animate-spin' : 'bg-green-500 animate-pulse'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              error ? 'text-red-400' : isRefreshing ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {error ? `Errore: ${error}` : isRefreshing ? 'Aggiornamento...' : `Ultimo aggiornamento: ${new Date().toLocaleTimeString('it-IT')}`}
          </span>
        </div>
      </div>

      {stats?.pulseCheck ? (
        <PulseCheckCards pulseCheck={stats.pulseCheck} loading={false} />
      ) : (
        <AdminStatsCards stats={stats ?? undefined} loading={loading} />
      )}

      {/* KPI Aggiuntivi: Churn B2B, Booking completati %, In scadenza, Utenti B2C attivi, Rating medio */}
      {stats?.pulseCheck && (
        <AdminKpiAggiuntivi pulseCheck={stats.pulseCheck} loading={false} />
      )}

      {/* Applicazioni in attesa */}
      <section className="mt-8 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Applicazioni in attesa
            {(stats?.pendingApplicationsCount ?? 0) > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-sm">
                {stats?.pendingApplicationsCount}
              </span>
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {!stats?.pendingApplications?.length ? (
            <p className="p-6 text-gray-500">Nessuna applicazione in attesa.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Città</th>
                  <th className="p-3">Data invio</th>
                  <th className="p-3">Ore in attesa</th>
                  <th className="p-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.pendingApplications ?? []).map((a: PendingApp) => (
                  <tr key={a.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-3 text-white">{`${a.first_name} ${a.last_name}`}</td>
                    <td className="p-3 text-gray-300">{a.email}</td>
                    <td className="p-3">{categoryLabel[a.category] ?? a.category}</td>
                    <td className="p-3 text-gray-300">{a.city}</td>
                    <td className="p-3 text-gray-400">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleString('it-IT') : '—'}
                    </td>
                    <td className="p-3">
                      {a.hoursWaiting != null ? (
                        <span className={a.hoursWaiting > 48 ? 'text-amber-400' : ''}>{a.hoursWaiting}h</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Motivo rifiuto"
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs w-32"
                          value={rejectReason[a.id] ?? ''}
                          onChange={(e) => setRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={actionId === a.id}
                          onClick={() => handleApprove(a.id)}
                          className="p-1.5 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          title="Approva"
                        >
                          {actionId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === a.id}
                          onClick={() => handleReject(a.id)}
                          className="p-1.5 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                          title="Rifiuta"
                        >
                          {actionId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Tabella Professionisti */}
      <section className="mt-8 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Professionisti</h3>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setProFilter(f)}
                className={`px-3 py-1.5 rounded text-sm ${
                  proFilter === f ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'Tutti' : f === 'active' ? 'Attivi' : 'Non attivi'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {!filteredPros.length ? (
            <p className="p-6 text-gray-500">Nessun professionista.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Registrato</th>
                </tr>
              </thead>
              <tbody>
                {filteredPros.map((p: AdminProfessionalRow) => (
                  <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-3 text-white">{`${p.first_name} ${p.last_name}`}</td>
                    <td className="p-3 text-gray-300">{p.email}</td>
                    <td className="p-3">{categoryLabel[p.category] ?? p.category}</td>
                    <td className="p-3 text-gray-400">{p.zona ?? '—'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                          p.approval_status === 'approved' && p.attivo
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-600 text-gray-400'
                        }`}
                      >
                        {p.approval_status === 'approved' && p.attivo ? 'Attivo' : 'Non attivo'}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.rating != null ? `${p.rating} ⭐ (${p.reviews_count ?? 0})` : '—'}
                    </td>
                    <td className="p-3 text-gray-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
