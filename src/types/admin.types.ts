// Tipi TypeScript per sistema SuperAdmin
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'user' | 'premium' | 'super_admin'
  status: 'active' | 'suspended' | 'deleted'
  subscription_status?: 'active' | 'inactive' | 'cancelled'
  created_at: string
  last_login?: string
  total_workouts?: number
  total_minutes?: number
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalWorkouts: number
  totalPT: number
  weeklyGrowth: number
  activationD0Rate: number
  retentionD7: number
  payingUsers: number
  activeToday: number
  revenue: number
  churnRate: number
  conversionRate: number
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
