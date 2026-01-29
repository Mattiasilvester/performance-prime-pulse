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
  minutes_since_login?: number | null
  subscription_status?: 'active' | 'inactive' | 'cancelled'
  created_at: string
  last_login?: string
  total_workouts?: number
  total_minutes?: number
  user_workouts?: number
  last_workout_date?: string | null
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
  newUsersLast7Days?: number
  activationD0Rate?: number
  activationRate?: number
  retentionD7?: number
  weeklyGrowth?: number
  workoutAnalytics?: {
    totalWorkouts: number
    avgWorkoutsPerUser: number
    mostActiveUsers: number
  }
}

export interface AdminAuditLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details: Record<string, unknown>
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
