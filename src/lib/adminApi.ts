import { supabase } from '@/integrations/supabase/client'
import { AdminUser } from '@/types/admin.types'

interface GetUsersParams {
  limit?: number
  offset?: number
  search?: string
  status?: 'active' | 'inactive' | null
}

interface GetUsersResponse {
  users: AdminUser[]
  count: number
  limit: number
  offset: number
}

interface UpdateUserPayload {
  is_active?: boolean
  role?: string
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

function ensureFunctionsUrl(): string {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL non configurata')
  }
  return FUNCTIONS_URL.replace(/\/+$/, '')
}

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Sessione amministratore non trovata')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

function mapUserProfile(profile: Record<string, unknown>): AdminUser {
  const lastLogin = profile.last_sign_in_at ?? profile.last_login ?? null
  let minutesSinceLogin: number | null = null
  let isActiveUser = false

  if (lastLogin) {
    const diffMs = Date.now() - new Date(lastLogin as string | number | Date).getTime()
    minutesSinceLogin = Math.floor(diffMs / (1000 * 60))
    isActiveUser = minutesSinceLogin <= 5
  }

  return {
    id: String(profile.id ?? ''),
    email: String(profile.email ?? ''),
    name: String(profile.full_name ?? profile.name ?? profile.email ?? 'Utente'),
    full_name: profile.full_name != null ? String(profile.full_name) : (profile.name != null ? String(profile.name) : undefined),
    role: (profile.role as 'user' | 'premium' | 'super_admin') ?? 'user',
    status: profile.is_active === false ? 'suspended' : 'active',
    is_active: profile.is_active !== false,
    is_active_user: isActiveUser,
    minutes_since_login: minutesSinceLogin,
    subscription_status: (profile.subscription_status as AdminUser['subscription_status']) ?? undefined,
    created_at: String(profile.created_at ?? ''),
    last_login: lastLogin != null ? String(lastLogin) : undefined,
    total_workouts: Number(profile.total_workouts ?? 0),
    total_minutes: Number(profile.total_minutes ?? 0),
    user_workouts: Number(profile.user_workouts ?? profile.total_workouts ?? 0),
    last_workout_date: (profile.last_workout_date as string | null) ?? null,
  }
}

export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
  const headers = await getAuthHeader()
  const baseUrl = ensureFunctionsUrl()
  const queryParams = new URLSearchParams()

  if (typeof params.limit === 'number') queryParams.set('limit', params.limit.toString())
  if (typeof params.offset === 'number') queryParams.set('offset', params.offset.toString())
  if (params.search) queryParams.set('search', params.search)
  if (params.status) queryParams.set('status', params.status)

  const queryString = queryParams.toString()
  const url = `${baseUrl}/admin-users${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Errore durante il caricamento utenti')
  }

  const payload = await response.json()
  const users = Array.isArray(payload.users) ? payload.users.map(mapUserProfile) : []

  return {
    users,
    count: typeof payload.count === 'number' ? payload.count : users.length,
    limit: typeof payload.limit === 'number' ? payload.limit : params.limit ?? users.length,
    offset: typeof payload.offset === 'number' ? payload.offset : params.offset ?? 0,
  }
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<AdminUser> {
  const headers = await getAuthHeader()
  const baseUrl = ensureFunctionsUrl()
  const url = `${baseUrl}/admin-users/${userId}`

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Errore durante l\'aggiornamento utente')
  }

  const result = await response.json()
  return mapUserProfile(result.user)
}

export async function deleteUser(userId: string): Promise<void> {
  const headers = await getAuthHeader()
  const baseUrl = ensureFunctionsUrl()
  const url = `${baseUrl}/admin-users/${userId}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Errore durante la disattivazione utente')
  }
}

