import { Users, Calendar, FolderKanban, Euro, ClipboardList, Clock, User, Briefcase, UserPlus, CheckCircle, FolderPlus, ChevronDown, ChevronUp, X, MapPin, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
}

interface RecentActivity {
  id: string;
  type: 'client_added' | 'booking_created' | 'booking_completed' | 'project_created';
  timestamp: string;
  message: string;
  icon: typeof UserPlus;
  iconColor: string;
  bgColor: string;
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
  const [stats, setStats] = useState({
    clienti: 0,
    prenotazioni: 0,
    progetti: 0,
    guadagni: 0
  });

  // Carica professional_id
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

  const loadProfessionalId = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
        setUserName(`${data.first_name} ${data.last_name}`);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      if (error.code !== 'PGRST116') {
        // Ignora se non trovato (utente non è professionista)
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

        // 4. Guadagni mese (solo completed, con JOIN su professional_services)
        // Include sia prezzo personalizzato (bookings.price) che prezzo servizio (professional_services.price)
        supabase
          .from('bookings')
          .select(`
            id,
            price,
            service_id,
            service:professional_services(price)
          `)
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

      // Calcola guadagni: priorità al prezzo personalizzato (bookings.price), poi prezzo servizio (professional_services.price), poi 0
      let guadagni = 0;
      
      if (earningsResult.error) {
        console.warn('⚠️ [OVERVIEW] Impossibile calcolare guadagni:', earningsResult.error.message);
      } else if (earningsResult.data) {
        console.log('💰 [OVERVIEW] Calcolo guadagni:', {
          bookingsCount: earningsResult.data.length,
          bookings: earningsResult.data.map((b: any) => ({
            id: b.id,
            price_custom: b.price,
            service_id: b.service_id,
            has_service: !!b.service
          }))
        });

        earningsResult.data.forEach((booking: any) => {
          let priceToAdd = 0;
          
          // Priorità 1: Prezzo personalizzato dalla colonna bookings.price
          if (booking.price !== null && booking.price !== undefined && booking.price !== '') {
            const customPrice = parseFloat(booking.price);
            if (!isNaN(customPrice) && customPrice >= 0) {
              priceToAdd = customPrice;
              console.log(`💰 [OVERVIEW] Usato prezzo personalizzato: ${priceToAdd}€ per booking ${booking.id}`);
            }
          }
          
          // Priorità 2: Prezzo dal servizio (professional_services.price) se non c'è prezzo personalizzato
          if (priceToAdd === 0) {
            const service = Array.isArray(booking.service) 
              ? booking.service[0] 
              : booking.service;
            
            if (service?.price) {
              const servicePrice = parseFloat(service.price);
              if (!isNaN(servicePrice) && servicePrice >= 0) {
                priceToAdd = servicePrice;
                console.log(`💰 [OVERVIEW] Usato prezzo servizio: ${priceToAdd}€ per booking ${booking.id}`);
              }
            }
          }
          
          // Priorità 3: Se non c'è né prezzo personalizzato né servizio, aggiunge 0 (non fa nulla)
          if (priceToAdd === 0) {
            console.warn(`⚠️ [OVERVIEW] Booking ${booking.id} senza prezzo (né personalizzato né servizio)`);
          }
          
          guadagni += priceToAdd;
        });
      }

      console.log('💰 [OVERVIEW] Guadagni totali calcolati:', guadagni);

      setStats({
        clienti,
        prenotazioni,
        progetti,
        guadagni: Math.round(guadagni * 100) / 100 // Arrotonda a 2 decimali
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

  const statCards = [
    {
      label: 'Clienti totali',
      value: loading ? '...' : stats.clienti.toString(),
      icon: Users,
      bgColor: 'bg-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      label: 'Prenotazioni questo mese',
      value: loading ? '...' : stats.prenotazioni.toString(),
      icon: Calendar,
      bgColor: 'bg-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Progetti attivi',
      value: loading ? '...' : stats.progetti.toString(),
      icon: FolderKanban,
      bgColor: 'bg-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Incassi mensili',
      value: loading ? '...' : formatEarnings(stats.guadagni),
      icon: Euro,
      bgColor: 'bg-green-200',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bentornato, {userName}!
        </h1>
        <p className="text-gray-500 capitalize">{formattedDate}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prossimi Appuntamenti */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessun appuntamento in programma</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const serviceColor = booking.service?.color || '#EEBA2B';
              const statusColor = booking.status === 'confirmed' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700';
              const statusLabel = booking.status === 'confirmed' ? 'Confermato' : 'In attesa';

              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowBookingModal(true);
                  }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* Indicatore data/ora */}
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-semibold text-xs"
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
        )}
      </div>

      {/* Attività Recenti */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Attività recenti
          </h2>
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
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Icona attività */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}>
                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>

                  {/* Dettagli attività */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </div>
  );
}

// Componente Modal Dettagli Appuntamento
interface BookingDetailModalProps {
  booking: UpcomingBooking;
  onClose: () => void;
}

function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const serviceColor = booking.service?.color || '#EEBA2B';
  const statusColor = booking.status === 'confirmed' 
    ? 'bg-green-100 text-green-700 border-green-200' 
    : 'bg-yellow-100 text-yellow-700 border-yellow-200';
  const statusLabel = booking.status === 'confirmed' ? 'Confermato' : 'In attesa';

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: serviceColor + '20' }}
            >
              <Calendar className="w-5 h-5" style={{ color: serviceColor }} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dettagli Appuntamento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

