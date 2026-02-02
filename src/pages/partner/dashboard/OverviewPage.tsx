/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps -- tipi attività partner; load/fetch intenzionali */
import { Calendar, FolderKanban, ClipboardList, Clock, User, Briefcase, UserPlus, CheckCircle, FolderPlus, ChevronDown, ChevronUp, X, MapPin, Video, Bell, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getDisplayStatus, bookingDisplayStatusConfig } from '@/utils/bookingHelpers';
import { ScheduleNotificationModal } from '@/components/partner/notifications/ScheduleNotificationModal';
import { PromemoriList } from '@/components/partner/notifications/PromemoriList';
import { KPICardsSection, type KPIViewType } from '@/components/partner/dashboard/kpi/KPICardsSection';

interface UpcomingBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed';
  client_name: string | null;
  modalita?: 'online' | 'presenza' | null;
  service?: {
    id: string;
    name: string;
    color: string;
  } | null;
  service_type?: string | null;
  color?: string | null; // Colore salvato nel booking
}

/** Placeholder per test UI quando non ci sono prossimi appuntamenti */
function getPlaceholderUpcomingBookings(): UpcomingBooking[] {
  const today = new Date();
  const d = (n: number) => {
    const t = new Date(today);
    t.setDate(t.getDate() + n);
    return t.toISOString().split('T')[0];
  };
  return [
    { id: 'placeholder-1', booking_date: d(0), booking_time: '09:00', duration_minutes: 60, status: 'pending', client_name: 'Cliente Demo 1', service: { id: 's1', name: 'Consulenza', color: '#EEBA2B' }, service_type: 'Consulenza' },
    { id: 'placeholder-2', booking_date: d(0), booking_time: '11:30', duration_minutes: 45, status: 'confirmed', client_name: 'Cliente Demo 2', service: { id: 's2', name: 'Revisione', color: '#22c55e' }, service_type: 'Revisione' },
    { id: 'placeholder-3', booking_date: d(1), booking_time: '14:00', duration_minutes: 90, status: 'pending', client_name: 'Cliente Demo 3', service: { id: 's3', name: 'Piano personalizzato', color: '#3b82f6' }, service_type: 'Piano personalizzato' },
    { id: 'placeholder-4', booking_date: d(2), booking_time: '10:00', duration_minutes: 60, status: 'confirmed', client_name: 'Cliente Demo 4', service: { id: 's4', name: 'Follow-up', color: '#EEBA2B' }, service_type: 'Follow-up' },
  ];
}

interface RecentActivity {
  id: string;
  type: 'client_added' | 'booking_created' | 'booking_completed' | 'project_created';
  timestamp: string;
  message: string;
  icon: typeof UserPlus;
  iconColor: string;
  bgColor: string;
  // ID per aprire modal dettagli
  bookingId?: string;
  clientId?: string;
  projectId?: string;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('Professionista');
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Inizia a false per mostrare UI subito
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [upcomingBookingsLoading, setUpcomingBookingsLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UpcomingBooking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityDetails, setActivityDetails] = useState<any>(null);
  const [activityDetailsLoading, setActivityDetailsLoading] = useState(false);
  const [kpiView, setKpiView] = useState<KPIViewType>('overview');
  const [promemoriRefreshKey, setPromemoriRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    clienti: 0,
    prenotazioni: 0,
    progetti: 0,
    guadagni: 0,
    /** Booking completed nel mese con price NULL (per coerenza contabile). */
    guadagniMancanti: 0,
  });

  // Nome da user_metadata (onboarding) come fallback immediato
  useEffect(() => {
    if (!user?.user_metadata) return;
    const meta = user.user_metadata as Record<string, unknown>;
    const fn = (meta?.first_name as string)?.trim?.() || '';
    const ln = (meta?.last_name as string)?.trim?.() || '';
    const fromMeta = [fn, ln].filter(Boolean).join(' ').trim();
    if (fromMeta) setUserName(fromMeta);
  }, [user?.id, user?.user_metadata]);

  // Carica professional_id (e nome da DB se presente)
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  // Carica statistiche quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchStats();
      fetchUpcomingBookings();
      fetchRecentActivities();
    }
  }, [professionalId]);

  const loadProfessionalId = async (retryCount = 0) => {
    if (!user?.id) return;

    const maxRetries = 2;
    const delays = [1500, 3000];

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
        const nameFromDb = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
        if (nameFromDb) setUserName(nameFromDb);
        // se nameFromDb è vuoto resta il nome da user_metadata (già impostato sopra)
      } else if (retryCount < maxRetries) {
        // Trigger signup può creare il professional subito dopo: ritenta
        setTimeout(() => loadProfessionalId(retryCount + 1), delays[retryCount]);
      }
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Errore caricamento professional_id:', error);
      }
      if (retryCount < maxRetries) {
        setTimeout(() => loadProfessionalId(retryCount + 1), delays[retryCount]);
      }
    }
  };

  const fetchStats = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      // Calcola range mese corrente
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Helper per formattare date locale
      const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startOfMonthStr = formatDateToString(firstDayOfMonth);
      const endOfMonthStr = formatDateToString(lastDayOfMonth);

      // Esegui tutte le query in parallelo (usando allSettled per gestire errori gracefully)
      const results = await Promise.allSettled([
        // 1. Clienti totali
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', professionalId),

        // 2. Prenotazioni questo mese (escludendo cancelled)
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .gte('booking_date', startOfMonthStr)
          .lte('booking_date', endOfMonthStr)
          .neq('status', 'cancelled'),

        // 3. Progetti attivi
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .eq('status', 'active'),

        // 4. Guadagni mese (solo completed, contabile: solo bookings.price, nessun fallback)
        supabase
          .from('bookings')
          .select('id, price')
          .eq('professional_id', professionalId)
          .gte('booking_date', startOfMonthStr)
          .lte('booking_date', endOfMonthStr)
          .eq('status', 'completed')
      ]);

      // Estrai risultati da Promise.allSettled
      const clientsResult = results[0].status === 'fulfilled' ? results[0].value : { error: { message: 'Query fallita' }, count: 0 };
      const bookingsResult = results[1].status === 'fulfilled' ? results[1].value : { error: { message: 'Query fallita' }, count: 0 };
      const projectsResult = results[2].status === 'fulfilled' ? results[2].value : { error: { message: 'Query fallita' }, count: 0 };
      const earningsResult = results[3].status === 'fulfilled' ? results[3].value : { error: { message: 'Query fallita' }, data: null };

      // Verifica errori nelle query
      if (clientsResult.error) {
        console.error('❌ [OVERVIEW] Errore query clienti:', clientsResult.error);
      }
      if (bookingsResult.error) {
        console.error('❌ [OVERVIEW] Errore query prenotazioni:', bookingsResult.error);
      }
      if (projectsResult.error) {
        console.error('❌ [OVERVIEW] Errore query progetti:', projectsResult.error);
      }
      if (earningsResult.error) {
        console.error('❌ [OVERVIEW] Errore query guadagni:', earningsResult.error);
      }

      // Estrai i conteggi
      const clienti = clientsResult.count || 0;
      const prenotazioni = bookingsResult.count || 0;
      const progetti = projectsResult.count || 0;

      // Incassi mese contabili: solo SUM(bookings.price) per completed, nessun fallback su professional_services (allineato ad Andamento e Report Commercialista)
      let guadagni = 0;
      let guadagniMancanti = 0;

      if (earningsResult.error) {
        console.warn('⚠️ [OVERVIEW] Impossibile calcolare guadagni:', earningsResult.error.message);
      } else if (earningsResult.data) {
        earningsResult.data.forEach((booking: any) => {
          const p = booking.price;
          if (p != null && p !== '' && !Number.isNaN(parseFloat(String(p))) && parseFloat(String(p)) >= 0) {
            guadagni += parseFloat(String(p));
          } else {
            guadagniMancanti += 1;
          }
        });
      }

      setStats({
        clienti,
        prenotazioni,
        progetti,
        guadagni: Math.round(guadagni * 100) / 100,
        guadagniMancanti,
      });
    } catch (error: any) {
      console.error('Errore caricamento statistiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingBookings = async () => {
    if (!professionalId) return;

    setUpcomingBookingsLoading(true);
    try {
      // Data di oggi in formato YYYY-MM-DD
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          duration_minutes,
          status,
          client_name,
          modalita,
          service_id,
          service_type,
          notes,
          color,
          service:professional_services(id, name, color)
        `)
        .eq('professional_id', professionalId)
        .gte('booking_date', todayStr) // Solo appuntamenti futuri (da oggi in poi)
        .in('status', ['pending', 'confirmed']) // Solo pending e confirmed
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Mappa i dati al formato UpcomingBooking
      const mappedBookings: UpcomingBooking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        duration_minutes: booking.duration_minutes || 60,
        status: booking.status,
        client_name: booking.client_name || null,
        modalita: booking.modalita || null,
        service: booking.service || null,
        service_type: booking.service_type || null,
        color: booking.color || null, // Aggiungi colore dal booking
      }));

      setUpcomingBookings(mappedBookings);
    } catch (error: any) {
      console.error('Errore caricamento prossimi appuntamenti:', error);
      setUpcomingBookings([]);
    } finally {
      setUpcomingBookingsLoading(false);
    }
  };

  // Helper per formattare data in italiano
  const formatBookingDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Rimuovi ore/minuti per confronto date
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Oggi';
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Domani';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Helper per formattare ora (HH:MM)
  const formatBookingTime = (timeStr: string): string => {
    return timeStr.substring(0, 5); // Prende solo HH:MM
  };

  // Helper per ottenere nome servizio
  const getServiceName = (booking: UpcomingBooking): string => {
    // Priorità 1: Nome servizio da professional_services
    if (booking.service?.name) return booking.service.name;
    // Priorità 2: Colonna diretta service_type (retrocompatibilità)
    if (booking.service_type) return booking.service_type;
    return 'Servizio';
  };

  // Helper per ottenere nome cliente
  const getClientName = (booking: UpcomingBooking): string => {
    return booking.client_name || 'Cliente';
  };

  const fetchRecentActivities = async () => {
    if (!professionalId) return;

    setRecentActivitiesLoading(true);
    try {
      // Esegui tutte le query in parallelo
      const [clientsResult, bookingsResult, completedBookingsResult, projectsResult] = await Promise.allSettled([
        // 1. Clienti aggiunti (ultimi 10)
        supabase
          .from('clients')
          .select('id, full_name, created_at')
          .eq('professional_id', professionalId)
          .order('created_at', { ascending: false })
          .limit(10),

        // 2. Prenotazioni create (ultimi 10)
        supabase
          .from('bookings')
          .select('id, booking_date, booking_time, client_name, created_at')
          .eq('professional_id', professionalId)
          .order('created_at', { ascending: false })
          .limit(10),

        // 3. Prenotazioni completate (ultimi 10, solo quelle con status completed)
        supabase
          .from('bookings')
          .select('id, booking_date, booking_time, client_name, updated_at')
          .eq('professional_id', professionalId)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(10),

        // 4. Progetti creati (ultimi 10)
        supabase
          .from('projects')
          .select('id, name, created_at')
          .eq('professional_id', professionalId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const activities: RecentActivity[] = [];

      // 1. Clienti aggiunti
      if (clientsResult.status === 'fulfilled' && clientsResult.value.data) {
        clientsResult.value.data.forEach((client: any) => {
          activities.push({
            id: `client-${client.id}`,
            type: 'client_added',
            timestamp: client.created_at,
            message: `Nuovo cliente aggiunto: ${client.full_name}`,
            icon: UserPlus,
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-100',
            clientId: client.id, // Salva ID per aprire modal
          });
        });
      }

      // 2. Prenotazioni create
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.data) {
        bookingsResult.value.data.forEach((booking: any) => {
          const clientName = booking.client_name || 'Cliente';
          const date = formatBookingDate(booking.booking_date);
          const time = formatBookingTime(booking.booking_time);
          activities.push({
            id: `booking-created-${booking.id}`,
            type: 'booking_created',
            timestamp: booking.created_at,
            message: `Prenotazione creata: ${date}, ${time} - ${clientName}`,
            icon: Calendar,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-100',
            bookingId: booking.id, // Salva ID per aprire modal
          });
        });
      }

      // 3. Prenotazioni completate
      if (completedBookingsResult.status === 'fulfilled' && completedBookingsResult.value.data) {
        completedBookingsResult.value.data.forEach((booking: any) => {
          const clientName = booking.client_name || 'Cliente';
          const date = formatBookingDate(booking.booking_date);
          const time = formatBookingTime(booking.booking_time);
          activities.push({
            id: `booking-completed-${booking.id}`,
            type: 'booking_completed',
            timestamp: booking.updated_at,
            message: `Prenotazione completata: ${date}, ${time} - ${clientName}`,
            icon: CheckCircle,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-100',
            bookingId: booking.id, // Salva ID per aprire modal
          });
        });
      }

      // 4. Progetti creati
      if (projectsResult.status === 'fulfilled' && projectsResult.value.data) {
        projectsResult.value.data.forEach((project: any) => {
          activities.push({
            id: `project-${project.id}`,
            type: 'project_created',
            timestamp: project.created_at,
            message: `Progetto creato: ${project.name}`,
            icon: FolderPlus,
            iconColor: 'text-purple-500',
            bgColor: 'bg-purple-100',
            projectId: project.id, // Salva ID per aprire modal
          });
        });
      }

      // Ordina per timestamp DESC e prendi le prime 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error: any) {
      console.error('Errore caricamento attività recenti:', error);
      setRecentActivities([]);
    } finally {
      setRecentActivitiesLoading(false);
    }
  };

  // Handler per click su attività recente
  const handleActivityClick = async (activity: RecentActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
    setActivityDetailsLoading(true);
    setActivityDetails(null);

    try {
      if (activity.bookingId) {
        // Carica dettagli booking completo
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_time,
            duration_minutes,
            status,
            client_name,
            client_email,
            client_phone,
            modalita,
            service_id,
            service_type,
            notes,
            color,
            service:professional_services(id, name, color, price)
          `)
          .eq('id', activity.bookingId)
          .single();

        if (error) throw error;
        setActivityDetails({ type: 'booking', data });
      } else if (activity.clientId) {
        // Carica dettagli cliente completo
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', activity.clientId)
          .single();

        if (error) throw error;
        setActivityDetails({ type: 'client', data });
      } else if (activity.projectId) {
        // Carica dettagli progetto completo
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', activity.projectId)
          .single();

        if (error) throw error;
        setActivityDetails({ type: 'project', data });
      }
    } catch (error: any) {
      console.error('Errore caricamento dettagli attività:', error);
    } finally {
      setActivityDetailsLoading(false);
    }
  };

  // Helper per formattare timestamp relativo (es. "2 ore fa", "Ieri", "3 giorni fa")
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Adesso';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
    } else if (diffDays === 1) {
      return 'Ieri';
    } else if (diffDays < 7) {
      return `${diffDays} giorni fa`;
    } else {
      // Se più di 7 giorni, mostra data formattata
      return activityDate.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Formatta i guadagni in formato italiano (es. €1.250,00)
  const formatEarnings = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {kpiView === 'overview' ? (
        <>
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {userName !== 'Professionista' ? `Benvenuto, ${userName}!` : 'Bentornato, Professionista!'}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 capitalize">{formattedDate}</p>
            </div>
            <Link
              to="/partner/dashboard/report-settimanale"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-medium text-black bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 rounded-xl transition-colors border border-[#EEBA2B]/50 shrink-0"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Report Settimana</span>
            </Link>
          </div>

          {/* KPI Cards - PrimePro */}
          <KPICardsSection
            professionalId={professionalId}
            activeView="overview"
            onNavigateToView={setKpiView}
            onBack={() => setKpiView('overview')}
          />

      {/* Prossimi Appuntamenti */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Prossimi appuntamenti
        </h2>
        
        {upcomingBookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (() => {
          const displayBookings = upcomingBookings.length > 0 ? upcomingBookings : getPlaceholderUpcomingBookings();
          const isPlaceholder = upcomingBookings.length === 0;
          return (
          <div className="space-y-3">
            {isPlaceholder && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-2">
                Dati di test per verificare layout e interazioni.
              </p>
            )}
            {displayBookings.map((booking) => {
              // Priorità: colore salvato nel booking, poi colore del servizio, poi default
              const serviceColor = booking.color || booking.service?.color || '#EEBA2B';
              const displayStatus = getDisplayStatus({ status: booking.status, booking_date: booking.booking_date });
              const statusConfig = bookingDisplayStatusConfig[displayStatus];
              const statusColor = statusConfig.className;
              const statusLabel = statusConfig.label;

              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowBookingModal(true);
                  }}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* Indicatore data/ora */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center text-white font-semibold text-[10px] sm:text-xs"
                    style={{ backgroundColor: serviceColor }}
                  >
                    <span className="text-[10px] uppercase leading-tight">
                      {formatBookingDate(booking.booking_date)}
                    </span>
                    <span className="text-sm font-bold mt-0.5">
                      {formatBookingTime(booking.booking_time)}
                    </span>
                  </div>

                  {/* Dettagli appuntamento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 truncate">
                        {getClientName(booking)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {/* Su mobile: truncate più aggressivo, su desktop: normale */}
                      <span className="truncate sm:max-w-none">{getServiceName(booking)}</span>
                      <span className="mx-1 hidden sm:inline">•</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {/* Su mobile: "60min" sulla stessa riga, su desktop: "60 min" */}
                      <span className="whitespace-nowrap">
                        <span className="sm:hidden">{booking.duration_minutes}min</span>
                        <span className="hidden sm:inline">{booking.duration_minutes} min</span>
                      </span>
                    </div>
                  </div>

                  {/* Badge status */}
                  <div className="flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      {/* Promemoria in programma */}
      <PromemoriList refreshTrigger={promemoriRefreshKey} />

      {/* Attività Recenti */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Attività recenti
          </h2>
          <div className="flex items-center gap-2">
            {/* Bottone Promemoria */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#EEBA2B] bg-[#EEBA2B]/10 hover:bg-[#EEBA2B]/20 rounded-lg transition-colors border border-[#EEBA2B]/30"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Promemoria</span>
              <span className="sm:hidden">Promemoria</span>
            </button>
            {recentActivities.length > 5 && (
              <button
                onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                aria-label={isActivitiesExpanded ? 'Riduci attività' : 'Espandi attività'}
              >
                {isActivitiesExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {recentActivitiesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna attività recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(isActivitiesExpanded ? recentActivities : recentActivities.slice(0, 5)).map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Icona attività */}
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.iconColor}`} />
                  </div>

                  {/* Dettagli attività */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm font-medium text-gray-900 mb-0.5 sm:mb-1 line-clamp-2">
                      {activity.message}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      ) : (
        <KPICardsSection
          professionalId={professionalId}
          activeView={kpiView}
          onNavigateToView={setKpiView}
          onBack={() => setKpiView('overview')}
        />
      )}

      {/* Modal Dettagli Appuntamento */}
      {showBookingModal && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Modal Promemoria */}
      <ScheduleNotificationModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          fetchRecentActivities();
          setPromemoriRefreshKey((k) => k + 1);
        }}
      />

      {/* Modal Dettagli Attività Recente */}
      {showActivityModal && selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          details={activityDetails}
          loading={activityDetailsLoading}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedActivity(null);
            setActivityDetails(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal Dettagli Appuntamento
interface BookingDetailModalProps {
  booking: UpcomingBooking;
  onClose: () => void;
}

function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  // Priorità: colore salvato nel booking, poi colore del servizio, poi default
  const serviceColor = booking.color || booking.service?.color || '#EEBA2B';
  const displayStatus = getDisplayStatus({ status: booking.status, booking_date: booking.booking_date });
  const statusConfig = bookingDisplayStatusConfig[displayStatus];
  const statusColor = statusConfig.className + ' border-current';
  const statusLabel = statusConfig.label;

  // Helper per formattare ora (HH:MM)
  const formatBookingTime = (timeStr: string): string => {
    return timeStr.substring(0, 5); // Prende solo HH:MM
  };

  // Helper per ottenere nome servizio
  const getServiceName = (booking: UpcomingBooking): string => {
    // Priorità 1: Nome servizio da professional_services
    if (booking.service?.name) return booking.service.name;
    // Priorità 2: Colonna diretta service_type (retrocompatibilità)
    if (booking.service_type) return booking.service_type;
    return 'Servizio';
  };

  // Helper per ottenere nome cliente
  const getClientName = (booking: UpcomingBooking): string => {
    return booking.client_name || 'Cliente';
  };

  // Formatta data completa
  const formatFullDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calcola ora fine
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div 
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0"
              style={{ backgroundColor: serviceColor + '20' }}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: serviceColor }} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Dettagli Appuntamento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Data e Ora */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Data e Ora</span>
            </div>
            <div className="pl-6">
              <p className="font-semibold text-gray-900 capitalize">
                {formatFullDate(booking.booking_date)}
              </p>
              <p className="text-gray-600">
                Dalle {formatBookingTime(booking.booking_time)} alle {calculateEndTime(booking.booking_time, booking.duration_minutes)}
              </p>
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Cliente</span>
            </div>
            <p className="pl-6 font-semibold text-gray-900">
              {getClientName(booking)}
            </p>
          </div>

          {/* Servizio */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Briefcase className="w-4 h-4" />
              <span>Servizio</span>
            </div>
            <div className="pl-6">
              <p className="font-semibold text-gray-900">
                {getServiceName(booking)}
              </p>
            </div>
          </div>

          {/* Durata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Durata</span>
            </div>
            <p className="pl-6 font-semibold text-gray-900">
              {booking.duration_minutes} minuti
            </p>
          </div>

          {/* Modalità */}
          {booking.modalita && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {booking.modalita === 'online' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span>Modalità</span>
              </div>
              <p className="pl-6 font-semibold text-gray-900 capitalize">
                {booking.modalita === 'online' ? 'Online' : 'In presenza'}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4" />
              <span>Stato</span>
            </div>
            <div className="pl-6">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}

// Componente Modal Dettagli Attività Recente
interface ActivityDetailModalProps {
  activity: RecentActivity;
  details: any;
  loading: boolean;
  onClose: () => void;
}

function ActivityDetailModal({ activity, details, loading, onClose }: ActivityDetailModalProps) {
  const Icon = activity.icon;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col mx-4 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bgColor}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Dettagli Attività</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{activity.message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B]"></div>
            </div>
          ) : details?.type === 'booking' ? (
            <BookingActivityDetails booking={details.data} />
          ) : details?.type === 'client' ? (
            <ClientActivityDetails client={details.data} />
          ) : details?.type === 'project' ? (
            <ProjectActivityDetails project={details.data} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nessun dettaglio disponibile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}

// Componente Dettagli Booking
function BookingActivityDetails({ booking }: { booking: any }) {
  const formatFullDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string): string => {
    return timeStr.substring(0, 5);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const serviceColor = booking.color || booking.service?.color || '#EEBA2B';
  const serviceName = booking.service?.name || booking.service_type || 'Servizio';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Data e Ora */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Data e Ora</span>
        </div>
        <div className="pl-5 sm:pl-6">
          <p className="font-semibold text-gray-900 capitalize">
            {formatFullDate(booking.booking_date)}
          </p>
          <p className="text-gray-600">
            Dalle {formatTime(booking.booking_time)} alle {calculateEndTime(booking.booking_time, booking.duration_minutes)}
          </p>
        </div>
      </div>

      {/* Cliente */}
      {booking.client_name && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cliente</span>
          </div>
          <div className="pl-5 sm:pl-6 space-y-1">
            <p className="font-semibold text-gray-900">{booking.client_name}</p>
            {booking.client_email && (
              <p className="text-sm text-gray-600">{booking.client_email}</p>
            )}
            {booking.client_phone && (
              <p className="text-sm text-gray-600">{booking.client_phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Servizio */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Servizio</span>
        </div>
        <div className="pl-5 sm:pl-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: serviceColor }}
            />
            <p className="font-semibold text-gray-900">{serviceName}</p>
          </div>
          {booking.service?.price && (
            <p className="text-sm text-gray-600 mt-1">Prezzo: €{booking.service.price.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Durata */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Durata</span>
        </div>
        <p className="pl-5 sm:pl-6 font-semibold text-gray-900 text-sm sm:text-base">
          {booking.duration_minutes} minuti
        </p>
      </div>

      {/* Modalità */}
      {booking.modalita && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            {booking.modalita === 'online' ? (
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span>Modalità</span>
          </div>
          <p className="pl-5 sm:pl-6 font-semibold text-gray-900 capitalize text-sm sm:text-base">
            {booking.modalita === 'online' ? 'Online' : 'In presenza'}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Stato</span>
        </div>
        <div className="pl-5 sm:pl-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              bookingDisplayStatusConfig[
                getDisplayStatus({ status: booking.status, booking_date: booking.booking_date })
              ].className
            }`}
          >
            {bookingDisplayStatusConfig[
              getDisplayStatus({ status: booking.status, booking_date: booking.booking_date })
            ].label}
          </span>
        </div>
      </div>

      {/* Note */}
      {booking.notes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Note</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{booking.notes}</p>
        </div>
      )}
    </div>
  );
}

// Componente Dettagli Cliente
function ClientActivityDetails({ client }: { client: any }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Nome Completo</span>
        </div>
        <p className="pl-5 sm:pl-6 font-semibold text-gray-900 text-sm sm:text-base">{client.full_name || (client.first_name + ' ' + client.last_name)}</p>
      </div>

      {client.email && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span>Email</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 text-sm sm:text-base break-all">{client.email}</p>
        </div>
      )}

      {client.phone && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span>Telefono</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 text-sm sm:text-base">{client.phone}</p>
        </div>
      )}

      {client.notes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Note</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{client.notes}</p>
        </div>
      )}
    </div>
  );
}

// Componente Dettagli Progetto
function ProjectActivityDetails({ project }: { project: any }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Nome Progetto</span>
        </div>
        <p className="pl-5 sm:pl-6 font-semibold text-gray-900 text-sm sm:text-base">{project.name}</p>
      </div>

      {project.objective && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span>Obiettivo</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 text-sm sm:text-base">{project.objective}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <span>Stato</span>
        </div>
        <div className="pl-5 sm:pl-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : project.status === 'completed'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {project.status === 'active' 
              ? 'Attivo' 
              : project.status === 'completed'
              ? 'Completato'
              : project.status === 'paused'
              ? 'In pausa'
              : project.status}
          </span>
        </div>
      </div>

      {project.start_date && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Data Inizio</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 text-sm sm:text-base">
            {new Date(project.start_date).toLocaleDateString('it-IT')}
          </p>
        </div>
      )}

      {project.notes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Note</span>
          </div>
          <p className="pl-5 sm:pl-6 text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{project.notes}</p>
        </div>
      )}
    </div>
  );
}