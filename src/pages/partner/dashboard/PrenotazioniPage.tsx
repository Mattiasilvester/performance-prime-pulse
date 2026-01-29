import { useState, useEffect } from 'react';
import { Calendar, User, Clock, CheckCircle, TrendingUp, Search, Filter, Edit2, Trash2, MessageSquare, Briefcase, Video, MapPin, X, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { autoCompletePastBookings } from '@/services/bookingsService';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes: string | null;
  modalita: 'online' | 'presenza' | null;
  user_id: string;
  // Nuove colonne migrate da notes JSON
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  service_type?: string | null;
  service_id?: string | null; // FK a professional_services
  color?: string | null;
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  // Nuovo: Relazione con professional_services
  service?: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    color: string;
  } | null;
  // Mantenuto per retrocompatibilità (deprecato)
  parsedNotes?: {
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    original_notes?: string;
    service_type?: string;
  };
}

export default function PrenotazioniPage() {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // Inizia a false per mostrare UI subito
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [modalitaFilter, setModalitaFilter] = useState<string>('all');
  
  // Stats
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    confirmed: 0,
    pending: 0,
  });

  // Modal modifica
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editedBookingData, setEditedBookingData] = useState<{
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    modalita: 'online' | 'presenza' | '';
    serviceType: string;
    notes: string;
    status: string;
    color: string;
  } | null>(null);

  // Modal conferma cancellazione
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  // Fetch bookings quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      // fetchBookings() chiamerà fetchStats() internamente dopo l'auto-completamento
      fetchBookings();
    }
  }, [professionalId]);

  const loadProfessionalId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      toast.error('Errore nel caricamento dei dati');
    }
  };

  // Helper per retrocompatibilità (ora usa colonne dirette)
  const parseBookingNotes = (booking: Booking) => {
    // Priorità 1: Usa colonne dirette (nuovo sistema)
    if (booking.client_name || booking.client_email || booking.service_type) {
      return {
        client_name: booking.client_name || undefined,
        client_email: booking.client_email || undefined,
        client_phone: booking.client_phone || undefined,
        service_type: booking.service_type || undefined,
        original_notes: booking.notes ? (() => {
          try {
            const parsed = JSON.parse(booking.notes);
            return parsed.original_notes || booking.notes;
          } catch {
            return booking.notes;
          }
        })() : undefined
      };
    }
    // Priorità 2: Fallback a notes JSON (retrocompatibilità)
    if (booking.notes) {
      try {
        return JSON.parse(booking.notes);
      } catch {
        return { original_notes: booking.notes };
      }
    }
    return null;
  };

  const getClientName = (booking: Booking): string => {
    // Priorità 1: Colonna diretta
    if (booking.client_name) return booking.client_name;
    // Priorità 2: Notes JSON (retrocompatibilità)
    const parsed = parseBookingNotes(booking);
    if (parsed?.client_name) return parsed.client_name;
    // Priorità 3: Profilo cliente
    if (booking.client) {
      return `${booking.client.first_name} ${booking.client.last_name || ''}`.trim();
    }
    return 'Cliente';
  };

  const getClientEmail = (booking: Booking): string | null => {
    // Priorità 1: Colonna diretta
    if (booking.client_email) return booking.client_email;
    // Priorità 2: Notes JSON (retrocompatibilità)
    const parsed = parseBookingNotes(booking);
    if (parsed?.client_email) return parsed.client_email;
    // Priorità 3: Profilo cliente
    if (booking.client?.email) return booking.client.email;
    return null;
  };

  const getServiceType = (booking: Booking): string | null => {
    // Priorità 1: Nome servizio da professional_services (nuovo sistema)
    if (booking.service?.name) return booking.service.name;
    // Priorità 2: Colonna diretta service_type (retrocompatibilità)
    if (booking.service_type) return booking.service_type;
    // Priorità 3: Notes JSON (retrocompatibilità)
    const parsed = parseBookingNotes(booking);
    return parsed?.service_type || null;
  };

  const getDisplayNotes = (booking: Booking): string | null => {
    // Se notes è JSON, estrai original_notes, altrimenti usa notes direttamente
    if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes);
        return parsed.original_notes || null;
      } catch {
        return booking.notes;
      }
    }
    return null;
  };

  const fetchBookings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true); // Mostra indicatori di caricamento mentre aggiorna
      
      // Ottimizzazione: auto-completamento in background (non blocca il caricamento)
      autoCompletePastBookings(professionalId).then((completedCount) => {
        if (completedCount > 0) {
          console.log(`✅ [PRENOTAZIONI] Auto-completati ${completedCount} appuntamenti passati`);
          // Ricarica bookings e stats dopo l'auto-completamento
          fetchBookings();
        }
      }).catch((error) => {
        console.error('Errore auto-completamento:', error);
      });
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          duration_minutes,
          status,
          notes,
          modalita,
          user_id,
          client_name,
          client_email,
          client_phone,
          service_type,
          service_id,
          color,
          price,
          service:professional_services(id, name, price, duration_minutes, color)
        `)
        .eq('professional_id', professionalId)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (error) throw error;

      // Ottimizzazione: carica tutti i profili necessari in una singola query invece di N query separate
      if (data) {
        // Estrai tutti gli user_id unici (per i bookings che non hanno già client_name)
        const userIdsToFetch = new Set<string>();
        data.forEach((booking) => {
          // Carica profilo solo se non abbiamo già client_name (prenotazione manuale)
          if (!booking.client_name && booking.user_id) {
            userIdsToFetch.add(booking.user_id);
          }
        });

        // Carica tutti i profili necessari in una singola query batch
        let profilesMap = new Map<string, { first_name: string; last_name: string; email: string }>();
        if (userIdsToFetch.size > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', Array.from(userIdsToFetch));

          if (!profilesError && profiles) {
            profiles.forEach((profile) => {
              profilesMap.set(profile.id, {
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || ''
              });
            });
          }
        }

        // Normalizza i dati bookings (senza loop asincrono, solo mapping sincrono)
        const bookingsWithClients = data.map((booking) => {
          // Normalizza service: Supabase restituisce array per JOIN, ma noi vogliamo un singolo oggetto
          let normalizedService: Booking['service'] = null;
          if (booking.service) {
            if (Array.isArray(booking.service)) {
              normalizedService = booking.service.length > 0 ? booking.service[0] : null;
            } else {
              normalizedService = booking.service;
            }
          }

          // Usa profilo se disponibile (solo per prenotazioni senza client_name)
          let client = undefined;
          if (!booking.client_name && booking.user_id) {
            const profile = profilesMap.get(booking.user_id);
            if (profile) {
              client = profile;
            }
          }

          return {
            ...booking,
            client,
            parsedNotes: parseBookingNotes(booking.notes) || undefined,
            service: normalizedService
          };
        });

        setBookings(bookingsWithClients);
      }
      
      // Ricarica sempre le statistiche dopo aver caricato le prenotazioni
      // (per assicurarsi che riflettano gli aggiornamenti dell'auto-completamento)
      await fetchStats();
    } catch (error: any) {
      console.error('Errore caricamento bookings:', error);
      toast.error('Errore nel caricamento delle prenotazioni');
    } finally {
      setLoading(false);
    }
  };

  // Helper function per ottenere la data in formato YYYY-MM-DD (locale)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchStats = async () => {
    if (!professionalId) return;

    try {
      const now = new Date();
      const todayStr = getLocalDateString(now);

      // Stats today - confronto esatto con data odierna (include tutti gli stati)
      const { count: todayCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId)
        .eq('booking_date', todayStr);

      // Stats week - ultimi 7 giorni (da oggi - 6 giorni fino a oggi)
      // Esempio: se oggi è 21 gennaio, conta dal 15 al 21 (7 giorni inclusi)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6); // Oggi - 6 giorni = 7 giorni totali (inclusi oggi)
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const startOfWeekStr = getLocalDateString(sevenDaysAgo);
      const endOfWeekStr = todayStr; // Fino a oggi incluso

      console.log('📅 [PRENOTAZIONI] Calcolo settimana:', {
        oggi: todayStr,
        setteGiorniFa: startOfWeekStr,
        range: `${startOfWeekStr} → ${endOfWeekStr}`,
        professionalId
      });

      // Stats week - ultimi 7 giorni (include tutti gli stati)
      // DEBUG: Facciamo anche una query per vedere le date effettive
      const { data: weekBookings, count: weekCount, error: weekError } = await supabase
        .from('bookings')
        .select('id, booking_date, status', { count: 'exact' })
        .eq('professional_id', professionalId)
        .gte('booking_date', startOfWeekStr)
        .lte('booking_date', endOfWeekStr);

      if (weekError) {
        console.error('❌ [PRENOTAZIONI] Errore query settimana:', weekError);
      } else {
        console.log('📊 [PRENOTAZIONI] Appuntamenti trovati nella settimana:', {
          count: weekCount,
          bookings: weekBookings?.map(b => ({ date: b.booking_date, status: b.status })) || [],
          dateRange: `Dal ${startOfWeekStr} al ${endOfWeekStr}`
        });
        
        // Log dettagliato per debugging
        console.log('🔍 [PRENOTAZIONI] Dettaglio appuntamenti nella settimana:');
        weekBookings?.forEach((b, index) => {
          console.log(`  ${index + 1}. ${b.booking_date} - Status: ${b.status} - ID: ${b.id}`);
        });
        
        // Verifica se ci sono appuntamenti fuori dal range
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('booking_date, status')
          .eq('professional_id', professionalId)
          .order('booking_date', { ascending: true })
          .limit(20);
        
        console.log('📋 [PRENOTAZIONI] Ultimi 20 appuntamenti (per debug):', 
          allBookings?.map(b => `${b.booking_date} (${b.status})`).join(', ') || 'nessuno'
        );
        allBookings?.forEach(b => {
          const isInRange = b.booking_date >= startOfWeekStr && b.booking_date <= endOfWeekStr;
          console.log(`  - ${b.booking_date} (${b.status}) ${isInRange ? '✅ IN RANGE' : '❌ FUORI'}`);
        });
      }

      // Stats confirmed
      const { count: confirmedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId)
        .eq('status', 'confirmed');

      // Stats pending
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId)
        .eq('status', 'pending');

      const newStats = {
        today: todayCount || 0,
        week: weekCount || 0,
        confirmed: confirmedCount || 0,
        pending: pendingCount || 0,
      };
      
      console.log('📊 [PRENOTAZIONI] Statistiche calcolate:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('❌ [PRENOTAZIONI] Errore caricamento stats:', error);
    }
  };

  // Filtri bookings
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    if (searchQuery) {
      const clientName = getClientName(booking).toLowerCase();
      const clientEmail = getClientEmail(booking)?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      if (!clientName.includes(query) && !clientEmail.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      // Data di oggi in formato YYYY-MM-DD (locale)
      const today = getLocalDateString(new Date());
      
      if (dateFilter === 'today') {
        // Confronto stringhe YYYY-MM-DD esatto
        if (booking.booking_date !== today) return false;
      } else if (dateFilter === 'week') {
        // Settimana corrente: dal Lunedì alla Domenica
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunedì
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Domenica
        endOfWeek.setHours(23, 59, 59, 999);
        
        const bookingDate = new Date(booking.booking_date + 'T00:00:00');
        if (bookingDate < startOfWeek || bookingDate > endOfWeek) return false;
      } else if (dateFilter === 'month') {
        // Mese corrente: dal 1° del mese all'ultimo giorno
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const bookingDate = new Date(booking.booking_date + 'T00:00:00');
        if (bookingDate < startOfMonth || bookingDate > endOfMonth) return false;
      }
    }

    // Modalità filter
    if (modalitaFilter !== 'all') {
      const bookingModalita = booking.modalita;
      if (bookingModalita !== modalitaFilter) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
            Confermato
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-600 text-white">
            In attesa
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
            Cancellato
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
            Completato
          </span>
        );
      case 'no_show':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500 text-white">
            No Show
          </span>
        );
      default:
        return null;
    }
  };

  const getEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    start.setMinutes(start.getMinutes() + durationMinutes);
    return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const calculateDurationMinutes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return Math.max(0, endMinutes - startMinutes);
  };

  // ============================================
  // HANDLERS MODIFICA
  // ============================================

  const handleEdit = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const parsed = parseBookingNotes(booking);
    const clientName = getClientName(booking);
    const clientEmail = getClientEmail(booking) || '';
    const serviceType = getServiceType(booking) || '';
    const displayNotes = getDisplayNotes(booking) || '';
    const color = booking.color || parsed?.color || '#EEBA2B';
    const clientPhone = booking.client_phone || parsed?.client_phone || '';

    // Calcola ora fine da ora inizio + durata
    const startTime = booking.booking_time.slice(0, 5);
    const durationMinutes = booking.duration_minutes || 60;
    const endTime = calculateEndTime(startTime, durationMinutes);

    setEditingBooking(booking);
    setEditedBookingData({
      id: booking.id,
      clientName,
      clientEmail,
      clientPhone,
      date: booking.booking_date,
      startTime,
      endTime,
      modalita: booking.modalita || 'presenza',
      serviceType,
      notes: displayNotes,
      status: booking.status,
      color,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editedBookingData || !professionalId) return;

    // Calcola durata da ora inizio e fine
    const durationMinutes = calculateDurationMinutes(editedBookingData.startTime, editedBookingData.endTime);
    
    // Validazione: durata minima 15 minuti
    if (durationMinutes < 15) {
      toast.error('La durata minima è 15 minuti');
      return;
    }
    
    // Validazione: durata massima 4 ore (240 minuti)
    if (durationMinutes > 240) {
      toast.error('La durata massima è 4 ore');
      return;
    }

    // Validazione: ora fine deve essere > ora inizio
    if (editedBookingData.endTime <= editedBookingData.startTime) {
      toast.error('L\'ora di fine deve essere maggiore dell\'ora di inizio');
      return;
    }

    try {
      // Prepara notes solo con note testuali (non più JSON completo)
      const notesToSave = editedBookingData.notes || null;

      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: editedBookingData.date,
          booking_time: editedBookingData.startTime,
          duration_minutes: durationMinutes,
          modalita: editedBookingData.modalita || 'presenza',
          status: editedBookingData.status,
          notes: notesToSave,
          // Salva nelle colonne separate
          client_name: editedBookingData.clientName || null,
          client_email: editedBookingData.clientEmail || null,
          client_phone: editedBookingData.clientPhone || null,
          service_type: editedBookingData.serviceType || null,
          color: editedBookingData.color || '#EEBA2B',
        })
        .eq('id', editedBookingData.id);

      if (error) throw error;

      await fetchBookings();
      await fetchStats();
      
      toast.success('Prenotazione aggiornata!');
      setShowEditModal(false);
      setEditingBooking(null);
      setEditedBookingData(null);
    } catch (err: any) {
      console.error('Errore modifica:', err);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  // ============================================
  // HANDLERS CANCELLA
  // ============================================

  const handleConfirm = async (bookingId: string) => {
    try {
      // Recupera dati prenotazione prima di aggiornare
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('client_name, booking_date, booking_time, professional_id, service_id')
        .eq('id', bookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Crea notifica per prenotazione confermata (in background)
      if (bookingData && bookingData.professional_id) {
        try {
          // Recupera nome servizio se presente
          let serviceName: string | undefined;
          if (bookingData.service_id) {
            const { data: serviceData } = await supabase
              .from('professional_services')
              .select('name')
              .eq('id', bookingData.service_id)
              .maybeSingle();
            serviceName = serviceData?.name;
          }

          const { notifyBookingConfirmed } = await import('@/services/notificationService');
          await notifyBookingConfirmed(bookingData.professional_id, {
            id: bookingId,
            clientName: bookingData.client_name || 'Cliente',
            bookingDate: bookingData.booking_date,
            bookingTime: bookingData.booking_time,
            serviceName
          });
        } catch (notifErr) {
          console.error('Errore creazione notifica:', notifErr);
        }
      }
      
      // Refresh lista e stats
      await fetchBookings();
      await fetchStats();
      
      toast.success('Prenotazione confermata!');
    } catch (err) {
      console.error('Errore conferma:', err);
      toast.error('Errore durante la conferma');
    }
  };

  const handleDelete = (bookingId: string) => {
    setDeletingBookingId(bookingId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingBookingId) return;

    try {
      // Recupera dati prenotazione prima di aggiornare
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('client_name, booking_date, booking_time, professional_id, cancellation_reason, service_id')
        .eq('id', deletingBookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', deletingBookingId);

      if (error) throw error;

      // Crea notifica per prenotazione cancellata (in background)
      if (bookingData && bookingData.professional_id) {
        try {
          // Recupera nome servizio se presente
          let serviceName: string | undefined;
          if (bookingData.service_id) {
            const { data: serviceData } = await supabase
              .from('professional_services')
              .select('name')
              .eq('id', bookingData.service_id)
              .maybeSingle();
            serviceName = serviceData?.name;
          }

          const { notifyBookingCancelled } = await import('@/services/notificationService');
          await notifyBookingCancelled(bookingData.professional_id, {
            id: deletingBookingId,
            clientName: bookingData.client_name || 'Cliente',
            bookingDate: bookingData.booking_date,
            bookingTime: bookingData.booking_time,
            reason: bookingData.cancellation_reason || undefined,
            serviceName
          });
        } catch (notifErr) {
          console.error('Errore creazione notifica:', notifErr);
        }
      }

      await fetchBookings();
      await fetchStats();
      
      toast.success('Prenotazione cancellata');
      setShowDeleteModal(false);
      setDeletingBookingId(null);
    } catch (err: any) {
      console.error('Errore cancellazione:', err);
      toast.error('Errore durante la cancellazione');
    }
  };

  // Rimuovo il check che nasconde la UI - mostriamo sempre la pagina
  // if (loading && bookings.length === 0) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B]"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Prenotazioni</h1>
        <p className="text-gray-500 mt-1">Visualizza e gestisci le prenotazioni</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Oggi */}
        <div 
          onClick={() => {
            setDateFilter('today');
            setStatusFilter('all');
            setModalitaFilter('all');
          }}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            dateFilter === 'today' 
              ? 'border-[#EEBA2B] shadow-lg' 
              : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Oggi</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Questa settimana */}
        <div 
          onClick={() => {
            setDateFilter('week');
            setStatusFilter('all');
            setModalitaFilter('all');
          }}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            dateFilter === 'week' 
              ? 'border-[#EEBA2B] shadow-lg' 
              : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Questa settimana</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.week}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Confermati */}
        <div 
          onClick={() => {
            setStatusFilter('confirmed');
            setDateFilter('all');
            setModalitaFilter('all');
          }}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            statusFilter === 'confirmed' 
              ? 'border-[#EEBA2B] shadow-lg' 
              : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confermati</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* In attesa */}
        <div 
          onClick={() => {
            setStatusFilter('pending');
            setDateFilter('all');
            setModalitaFilter('all');
          }}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            statusFilter === 'pending' 
              ? 'border-[#EEBA2B] shadow-lg' 
              : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
    <div>
              <p className="text-sm text-gray-500">In attesa</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search bar - full width su mobile, più corta su desktop */}
          <div className="w-full sm:flex-[2] sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="search"
              placeholder="Cerca per cliente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Container 3 dropdown - AFFIANCATI sia su mobile che desktop */}
          <div className="flex gap-3 sm:gap-4">
            {/* Status filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select 
                className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">✓ Tutti</option>
                <option value="confirmed">✓ Confermato</option>
                <option value="pending">✓ In attesa</option>
                <option value="cancelled">✓ Cancellato</option>
                <option value="completed">✓ Completato</option>
                <option value="no_show">✓ No show</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Date filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select 
                className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">📅 Tutte</option>
                <option value="today">📅 Oggi</option>
                <option value="week">📅 Settimana</option>
                <option value="month">📅 Mese</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Modalità filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select 
                className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent cursor-pointer"
                value={modalitaFilter}
                onChange={(e) => setModalitaFilter(e.target.value)}
              >
                <option value="all">📍 Tutte</option>
                <option value="online">📍 Online</option>
                <option value="presenza">📍 Presenza</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista prenotazioni */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna prenotazione trovata</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const clientName = getClientName(booking);
            const clientEmail = getClientEmail(booking);
            const serviceType = getServiceType(booking);
            const displayNotes = getDisplayNotes(booking);
            const formattedDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Info cliente e appuntamento */}
                  <div className="flex-1">
                    <div className="mb-3">
                      {/* Riga 1: Nome + Badge (STESSA LINEA su desktop) */}
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
                        </div>
                        {/* Badge - SOLO DESKTOP, sulla stessa riga del nome */}
                        <div className="hidden sm:block">
                          {getStatusBadge(booking.status)}
                        </div>
                        {/* Badge visibile solo su mobile */}
                        <div className="sm:hidden">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      {/* Riga 2: Email (sotto) */}
                      {clientEmail && (
                        <p className="text-sm text-gray-500 ml-7">{clientEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2 ml-7">
                      {/* Data e ora */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {booking.booking_time.slice(0, 5)} - {getEndTime(booking.booking_time, booking.duration_minutes)}
                        </span>
                        <span className="text-gray-400">({booking.duration_minutes} min)</span>
                      </div>

                      {/* Modalità */}
                      {booking.modalita && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {booking.modalita === 'online' ? (
                            <Video className="w-4 h-4 text-gray-400" />
                          ) : (
                            <MapPin className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="capitalize">{booking.modalita === 'online' ? 'Online' : 'In presenza'}</span>
                        </div>
                      )}

                      {/* Tipo servizio */}
                      {serviceType && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{serviceType}</span>
                        </div>
                      )}

                      {/* Note */}
                      {displayNotes && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="flex-1">{displayNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottoni - VISIBILI su mobile e desktop */}
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-center gap-2 mt-4 sm:mt-0">
                      {/* Bottone Conferma - SOLO per prenotazioni in attesa */}
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none sm:min-w-[120px] text-sm font-medium"
                        >
                          <Check className="w-4 h-4" />
                          <span>Conferma</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(booking.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#D4A826] transition-colors text-sm flex-1 sm:flex-none sm:min-w-[120px]"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifica</span>
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors text-sm flex-1 sm:flex-none sm:min-w-[120px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Cancella</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Modifica Prenotazione */}
      {showEditModal && editedBookingData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowEditModal(false);
            setEditingBooking(null);
            setEditedBookingData(null);
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" />
          
          {/* Modal */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con colore personalizzato */}
            <div 
              className="sticky top-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10"
              style={{ backgroundColor: `${editedBookingData.color}15` }}
            >
              <h2 className="text-xl font-semibold text-gray-900">Modifica Prenotazione</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBooking(null);
                  setEditedBookingData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Data e ora */}
              <div 
                className="rounded-xl p-4"
                style={{ backgroundColor: `${editedBookingData.color}15` }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: editedBookingData.color }} />
                  <div className="flex-1">
                    <input
                      type="date"
                      value={editedBookingData.date}
                      onChange={(e) => setEditedBookingData({...editedBookingData, date: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent mb-2"
                    />
                    {/* Orario - Inizio e Fine sulla stessa riga */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Ora Inizio */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ora inizio
                        </label>
                        <input
                          type="time"
                          value={editedBookingData.startTime}
                          onChange={(e) => {
                            const newStartTime = e.target.value;
                            setEditedBookingData(prev => ({
                              ...prev,
                              startTime: newStartTime,
                              // Se ora inizio >= ora fine, sposta ora fine di 1 ora
                              endTime: newStartTime >= (prev?.endTime || '') 
                                ? calculateEndTime(newStartTime, 60) 
                                : (prev?.endTime || '')
                            }));
                          }}
                          step="900"
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      {/* Ora Fine */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ora fine
                        </label>
                        <input
                          type="time"
                          value={editedBookingData.endTime}
                          onChange={(e) => {
                            const newEndTime = e.target.value;
                            // Valida che ora fine sia > ora inizio
                            if (newEndTime > editedBookingData.startTime) {
                              setEditedBookingData(prev => ({ ...prev, endTime: newEndTime }));
                            } else {
                              toast.error('L\'ora di fine deve essere maggiore dell\'ora di inizio');
                            }
                          }}
                          min={editedBookingData.startTime}
                          step="900"
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Mostra durata calcolata come info */}
                    <div className="text-xs text-gray-500 mt-2">
                      Durata: {calculateDurationMinutes(editedBookingData.startTime, editedBookingData.endTime)} minuti
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Nome cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome cliente *
                </label>
                <input
                  type="text"
                  value={editedBookingData.clientName}
                  onChange={(e) => setEditedBookingData({...editedBookingData, clientName: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                />
              </div>
              
              {/* Email cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email cliente
                </label>
                <input
                  type="email"
                  value={editedBookingData.clientEmail}
                  onChange={(e) => setEditedBookingData({...editedBookingData, clientEmail: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                />
              </div>

              {/* Telefono cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono cliente
                </label>
                <input
                  type="tel"
                  value={editedBookingData.clientPhone}
                  onChange={(e) => setEditedBookingData({...editedBookingData, clientPhone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                />
              </div>

              {/* Modalità */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Modalità
                </label>
                <select
                  value={editedBookingData.modalita}
                  onChange={(e) => setEditedBookingData({...editedBookingData, modalita: e.target.value as 'online' | 'presenza'})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                >
                  <option value="presenza">In presenza</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {/* Tipo servizio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo servizio
                </label>
                <input
                  type="text"
                  value={editedBookingData.serviceType}
                  onChange={(e) => setEditedBookingData({...editedBookingData, serviceType: e.target.value})}
                  placeholder="Es. Personal Training, Consulenza..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                />
              </div>
              
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note
                </label>
                <textarea
                  value={editedBookingData.notes}
                  onChange={(e) => setEditedBookingData({...editedBookingData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent resize-none"
                />
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stato
                </label>
                <select
                  value={editedBookingData.status}
                  onChange={(e) => setEditedBookingData({...editedBookingData, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                >
                  <option value="pending">In attesa</option>
                  <option value="confirmed">Confermato</option>
                  <option value="completed">Completato</option>
                  <option value="cancelled">Cancellato</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              {/* Colore appuntamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colore appuntamento
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { color: '#EEBA2B', name: 'Oro' },
                    { color: '#3B82F6', name: 'Blu' },
                    { color: '#10B981', name: 'Verde' },
                    { color: '#F59E0B', name: 'Arancione' },
                    { color: '#EF4444', name: 'Rosso' },
                    { color: '#8B5CF6', name: 'Viola' },
                    { color: '#EC4899', name: 'Rosa' },
                    { color: '#6B7280', name: 'Grigio' },
                    { color: '#14B8A6', name: 'Teal' },
                    { color: '#F97316', name: 'Arancio scuro' },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditedBookingData({ ...editedBookingData, color })}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        editedBookingData.color === color 
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBooking(null);
                    setEditedBookingData(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editedBookingData.clientName}
                  className="flex-1 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#D4A826] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Conferma Eliminazione */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowDeleteModal(false);
            setDeletingBookingId(null);
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 animate-fadeIn" />
          
          {/* Dialog */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icona */}
            <div className="pt-6 pb-2 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            {/* Contenuto */}
            <div className="px-6 pb-4 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cancella prenotazione?
              </h3>
              <p className="text-gray-600 text-sm">
                Sei sicuro di voler cancellare questa prenotazione? Questa azione non può essere annullata.
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingBookingId(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Cancella
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}