import { useCallback, useEffect, useState } from 'react'
import UserManagementTable from '@/components/admin/UserManagementTable'
import { AdminUser } from '@/types/admin.types'
import { deleteUser, getUsers, updateUser } from '@/lib/adminApi'
import { toast } from 'sonner'
import ProfessionalDetailPanel from '@/components/admin/ProfessionalDetailPanel'

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isMutating, setIsMutating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUser | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUsers({ limit: 200 })
      setUsers(response.users)
      setTotalCount(response.count)
      setError(null)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento utenti')
      toast.error('Errore nel caricamento degli utenti')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleActive = useCallback(async (user: AdminUser) => {
    setIsMutating(true)
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      toast.success(
        user.is_active
          ? `Utente ${user.email} sospeso`
          : `Utente ${user.email} riattivato`
      )
      await fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      toast.error('Errore durante l\'aggiornamento utente')
    } finally {
      setIsMutating(false)
    }
  }, [fetchUsers])

  const handleDeleteUser = useCallback(async (user: AdminUser) => {
    if (!window.confirm(`Disattivare definitivamente ${user.email}?`)) {
      return
    }

    setIsMutating(true)
    try {
      await deleteUser(user.id)
      toast.success(`Utente ${user.email} disattivato`)
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      toast.error('Errore durante la disattivazione utente')
    } finally {
      setIsMutating(false)
    }
  }, [fetchUsers])

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestione Utenti</h1>
          <p className="text-gray-400 mt-1">
            Controlla lo stato degli utenti, sospendi o riattiva gli account e monitora l&apos;attività in tempo reale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading || isMutating}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-600/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg">
          <div className="font-semibold">Errore: {error}</div>
          <div className="text-sm mt-1">
            Verifica la connessione o riprova tra qualche istante.
          </div>
        </div>
      )}

      <UserManagementTable
        users={users}
        loading={loading}
        isMutating={isMutating}
        totalCount={totalCount}
        onViewDetails={setSelectedDetailUser}
        onToggleActive={handleToggleActive}
        onDeleteUser={handleDeleteUser}
      />

      {selectedDetailUser && (
        <ProfessionalDetailPanel
          user={selectedDetailUser}
          onClose={() => setSelectedDetailUser(null)}
        />
      )}
    </div>
  )
}