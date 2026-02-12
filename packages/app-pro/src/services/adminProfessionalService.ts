export interface ProfessionalDetailProfile {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  professions: string[];
  bio: string | null;
  specializations: string[];
  city: string | null;
  address: string | null;
  company_name: string | null;
  vat_number: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  is_active: boolean;
  is_approved: boolean;
  approval_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfessionalDetailServiceItem {
  id: string;
  name: string | null;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface ProfessionalDetailClientItem {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_pp_subscriber: boolean | null;
  created_at: string | null;
}

export interface ProfessionalDetailBookingItem {
  id: string;
  booking_date: string | null;
  booking_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  notes: string | null;
  service_type: string | null;
  client_name: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

export interface ProfessionalDetailProjectItem {
  id: string;
  name: string | null;
  objective: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string | null;
  client_name: string | null;
  attachment_count: number;
  attachments_total_size: number;
}

export interface ProfessionalDetailBookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

export interface ProfessionalDetailTotals {
  clients: number;
  bookings: number;
  projects: number;
  attachments: number;
  services: number;
}

export interface ProfessionalDetailSubscription {
  status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string | null;
}

export interface ProfessionalDetailPayload {
  professional: ProfessionalDetailProfile | null;
  services: ProfessionalDetailServiceItem[];
  clients: ProfessionalDetailClientItem[];
  bookings: ProfessionalDetailBookingItem[];
  booking_stats: ProfessionalDetailBookingStats;
  projects: ProfessionalDetailProjectItem[];
  totals: ProfessionalDetailTotals;
  last_login: string | null;
  subscription: ProfessionalDetailSubscription | null;
}

interface GetProfessionalDetailParams {
  professionalId?: string;
  userId?: string;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function ensureFunctionsUrl(): string {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL non configurata');
  }
  return FUNCTIONS_URL.replace(/\/+$/, '');
}

function getAuthHeader(): { Authorization: string; 'Content-Type': string } {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY non configurata');
  return {
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

function getEmptyPayload(): ProfessionalDetailPayload {
  return {
    professional: null,
    services: [],
    clients: [],
    bookings: [],
    booking_stats: { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 },
    projects: [],
    totals: { clients: 0, bookings: 0, projects: 0, attachments: 0, services: 0 },
    last_login: null,
    subscription: null,
  };
}

export async function getProfessionalDetail({
  professionalId,
  userId,
}: GetProfessionalDetailParams): Promise<ProfessionalDetailPayload> {
  if (!professionalId && !userId) {
    throw new Error('professionalId o userId richiesto');
  }

  const response = await fetch(`${ensureFunctionsUrl()}/admin-professional-detail`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ professionalId, userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Errore durante il caricamento dettaglio professionista');
  }

  const payload = (await response.json()) as Partial<ProfessionalDetailPayload>;
  return {
    ...getEmptyPayload(),
    ...payload,
    services: Array.isArray(payload.services) ? payload.services : [],
    clients: Array.isArray(payload.clients) ? payload.clients : [],
    bookings: Array.isArray(payload.bookings) ? payload.bookings : [],
    projects: Array.isArray(payload.projects) ? payload.projects : [],
  };
}

