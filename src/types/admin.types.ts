// Tipi TypeScript per sistema SuperAdmin
export interface AdminUser {
  id: string
  email: string
  name: string
  full_name?: string // Alias per name (compatibility)
  role: 'user' | 'premium' | 'super_admin'
  status: 'active' | 'suspended' | 'deleted'
  is_active?: boolean // Calcolato da status
  is_active_user?: boolean // Calcolato da last_login
  subscription_status?: 'active' | 'inactive' | 'cancelled'
  created_at: string
  last_login?: string
  total_workouts?: number
  total_minutes?: number
}

export interface AdminStats {
  totalUsers: number
  payingUsers: number
  activeToday: number
  revenue: number
  churnRate: number
  conversionRate: number
  // Properties aggiuntive usate nel dashboard
  activeUsers?: number
  inactiveUsers?: number
  totalWorkouts?: number
  monthlyWorkouts?: number
  professionals?: number
  activeObjectives?: number
  totalNotes?: number
  totalPT?: number
  growth?: number
  engagement?: number
  newUsersThisMonth?: number
  activationD0Rate?: number
  retentionD7?: number
  weeklyGrowth?: number
}

export interface AdminAuditLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details: Record<string, any>
  ip_address?: string
  created_at: string
}

export interface AdminSession {
  id: string
  admin_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface AdminCredentials {
  email: string
  password: string
  secretKey: string
}
