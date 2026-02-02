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

/** Pulse Check: KPI in header SuperAdmin + KPI aggiuntivi */
export interface PulseCheck {
  mrrTotal: number
  mrrUsers: number
  mrrProfessionals: number
  totalUsers: number
  activeProfessionals: number
  bookingsThisMonth: number
  bookingsCompleted: number
  gmvThisMonth: number
  trialConversionRate: number
  avgRating: number
  /** Professionisti B2B con subscription cancellata (status = canceled) */
  churnB2BCanceledCount?: number
  /** Subscription con cancel_at_period_end = true (in scadenza) */
  cancellationsInScadenza?: number
  /** % booking completati sul totale del mese */
  bookingCompletionRate?: number
  /** Utenti B2C totali (profiles esclusi professionisti) */
  b2cTotalCount?: number
  /** Utenti B2C con almeno 1 workout */
  b2cActiveCount?: number
  /** % utenti B2C attivi (con almeno 1 workout) */
  b2cActivePercent?: number
}

export interface AdminStats {
  totalUsers: number
  payingUsers: number
  activeToday: number
  revenue: number
  churnRate: number
  conversionRate: number
  // Pulse Check (da admin-stats)
  pulseCheck?: PulseCheck
  pendingApplicationsCount?: number
  pendingApplications?: PendingApplication[]
  professionalsList?: AdminProfessionalRow[]
  // Legacy / compat
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
  churnB2BCanceledCount?: number
  cancellationsInScadenza?: number
  bookingCompletionRate?: number
  b2cTotalCount?: number
  b2cActiveCount?: number
  b2cActivePercent?: number
  workoutAnalytics?: {
    totalWorkouts: number
    avgWorkoutsPerUser: number
    mostActiveUsers: number
  }
}

/** Riga applicazione in attesa (SuperAdmin) */
export interface PendingApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  category: string
  city: string
  company_name: string | null
  vat_number: string | null
  bio: string | null
  specializations: string[] | null
  status: string | null
  submitted_at: string | null
  hoursWaiting?: number | null
}

/** Riga professionista in tabella SuperAdmin */
export interface AdminProfessionalRow {
  id: string
  first_name: string
  last_name: string
  email: string
  category: string
  zona: string | null
  approval_status: string | null
  attivo: boolean | null
  rating: number | null
  reviews_count: number | null
  created_at: string
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
