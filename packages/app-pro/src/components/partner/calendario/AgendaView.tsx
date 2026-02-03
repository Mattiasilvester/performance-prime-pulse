/* eslint-disable @typescript-eslint/no-explicit-any -- calendar/booking types from multiple sources; fixing would require large refactor without changing logic */
/* eslint-disable react-hooks/exhaustive-deps -- calendar effects intentionally omit deps to avoid re-run loops and preserve booking/date behavior */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, X, AlertTriangle, Ban, Briefcase, Loader2, Lock } from 'lucide-react';
import { supabase } from '@pp/shared';
import { useAuth } from '@pp/shared';
import { toast } from 'sonner';
import { ManageBlocksModal } from '@/components/partner/calendar/ManageBlocksModal';
import { useBlockedPeriods } from '@/hooks/useBlockedPeriods';
import { availabilityOverrideService } from '@/services/availabilityOverrideService';
import type { AvailabilityOverride } from '@/services/availabilityOverrideService';
import { ClientAutocomplete } from '@/components/partner/bookings/ClientAutocomplete';
import AddClientModal from '@/components/partner/clients/AddClientModal';
import { autoCompletePastBookings } from '@pp/shared';
import { getServicesByProfessional, type ProfessionalService } from '@/services/professionalServicesService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ViewType = 'day' | 'week' | 'month';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  modalita?: string;
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
}

const WEEKDAYS_FULL = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const WEEKDAYS_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

const AgendaView = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewType, setViewType] = useState<ViewType>('day');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [initialLoading, setInitialLoading] = useState(false); // Inizia a false per mostrare UI subito
  const [isNavigating, setIsNavigating] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBooking, setNewBooking] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes: string;
    status: string;
    color: string;
    price: string; // Prezzo personalizzato (opzionale)
    serviceId: string; // ID servizio selezionato
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManageBlocksModal, setShowManageBlocksModal] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<AvailabilityOverride[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Stato per drag & drop - SEMPLIFICATO
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    booking: any | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  
  // ============================================
  // RESIZE STATE
  // ============================================

  // Stato per il resize degli appuntamenti
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    booking: any | null;
    edge: 'top' | 'bottom';
    startY: number;
    currentY: number;
    originalStartTime: string;
    originalEndTime: string;
    originalDuration: number;
  } | null>(null);

  // Ref per cleanup requestAnimationFrame
  const rafIdRef = useRef<number | null>(null);
  
  // Ref per il container della griglia
  const gridRef = useRef<HTMLDivElement>(null);
  const [editedBooking, setEditedBooking] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes: string;
    status: string;
    color: string;
    price: string; // Prezzo personalizzato (opzionale)
  } | null>(null);

  // Carica professional_id e bookings iniziali
  useEffect(() => {
    const loadInitialData = async () => {
      await loadProfessionalId();
    };
    loadInitialData();
  }, [user]);

  // Carica bookings quando professional_id è disponibile (primo caricamento)
  useEffect(() => {
    console.log('🔄 [AGENDA] useEffect trigger - professionalId:', professionalId, 'initialLoading:', initialLoading);
    if (professionalId && initialLoading) {
      console.log('🔄 [AGENDA] useEffect: professionalId disponibile, initialLoading=true, chiamo fetchBookings(true)');
      fetchBookings(true);
    } else if (professionalId && !initialLoading) {
      console.log('ℹ️ [AGENDA] useEffect: professionalId disponibile ma initialLoading=false, non chiamo fetchBookings');
    } else if (!professionalId) {
      console.log('⚠️ [AGENDA] useEffect: professionalId non ancora disponibile');
    }
  }, [professionalId, initialLoading]);

  // Carica bookings quando cambia mese (silenzioso, senza loading)
  useEffect(() => {
    if (professionalId && !initialLoading) {
      fetchBookings(false);
    }
  }, [currentDate, professionalId]);

  // Carica servizi del professionista quando professionalId è disponibile
  useEffect(() => {
    const loadServices = async () => {
      if (!professionalId) return;
      
      try {
        setLoadingServices(true);
        const fetchedServices = await getServicesByProfessional(professionalId);
        setServices(fetchedServices);
        
        // Se c'è solo un servizio e stiamo creando un nuovo booking, selezionalo automaticamente
        if (fetchedServices.length === 1 && newBooking && !newBooking.serviceId) {
          setNewBooking(prev => prev ? {
            ...prev,
            serviceId: fetchedServices[0].id,
            endTime: calculateEndTime(prev.startTime, fetchedServices[0].duration_minutes)
          } : null);
        }
      } catch (error) {
        console.error('Errore caricamento servizi:', error);
        toast.error('Errore nel caricamento dei servizi');
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [professionalId]); // Solo professionalId come dipendenza per evitare loop

  const loadProfessionalId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
    }
  };

  const fetchBookings = async (isInitialLoad: boolean = false) => {
    if (!professionalId) {
      console.log('⚠️ [AGENDA] fetchBookings: professionalId non disponibile');
      return;
    }

    console.log(`🔄 [AGENDA] fetchBookings chiamato - isInitialLoad: ${isInitialLoad}, professionalId: ${professionalId}`);

    try {
      // Ottimizzazione: auto-completamento in background (non blocca il caricamento)
      if (isInitialLoad) {
        // Avvia auto-completamento in background senza attendere
        autoCompletePastBookings(professionalId).then((completedCount) => {
          if (completedCount > 0) {
            console.log(`✅ [AGENDA] Auto-completati ${completedCount} appuntamenti passati`);
            // I bookings verranno ricaricati automaticamente al cambio mese o quando necessario
          }
        }).catch((error) => {
          console.error('Errore auto-completamento:', error);
        });
      }

      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setIsNavigating(true);
      }

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDateStr = formatDateToString(startOfMonth);
      const endDateStr = formatDateToString(endOfMonth);

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
        .gte('booking_date', startDateStr)
        .lte('booking_date', endDateStr)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

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
        const profilesMap = new Map<string, { first_name: string; last_name: string; email: string }>();
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
            service: normalizedService
          };
        });

        setBookings(bookingsWithClients);
      }
    } catch (error: any) {
      console.error('Errore caricamento bookings:', error);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setIsNavigating(false);
      }
    }
  };

  // Helper per convertire Date in stringa YYYY-MM-DD senza problemi di timezone
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Hook per gestire i blocchi periodi (dopo formatDateToString)
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const { blockedDates, isDateBlocked, refetch: refetchBlocks } = useBlockedPeriods({
    professionalId,
    startDate: formatDateToString(startOfMonth),
    endDate: formatDateToString(endOfMonth),
    autoFetch: !!professionalId,
  });

  // Fetch blocchi orari (availability_overrides) per il range visibile
  const fetchBlockedSlots = useCallback(() => {
    if (!professionalId) {
      setBlockedSlots([]);
      return Promise.resolve();
    }
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startStr =
      viewType === 'week'
        ? formatDateToString(startOfWeek)
        : formatDateToString(currentDate);
    const endStr =
      viewType === 'week'
        ? formatDateToString(endOfWeek)
        : formatDateToString(currentDate);
    return availabilityOverrideService
      .getBlockedSlots(professionalId, startStr, endStr)
      .then(setBlockedSlots)
      .catch(() => setBlockedSlots([]));
  }, [professionalId, currentDate, viewType]);

  useEffect(() => {
    fetchBlockedSlots();
  }, [fetchBlockedSlots]);

  // Verifica se uno slot (data, ora) è coperto da un blocco orario
  const isSlotBlocked = (date: Date, hour: number): boolean => {
    const dateStr = formatDateToString(date);
    const slotStart = `${String(hour).padStart(2, '0')}:00`;
    const slotEnd = `${String(hour + 1).padStart(2, '0')}:00`;
    return blockedSlots.some(
      (o) =>
        o.override_date === dateStr &&
        o.start_time < slotEnd &&
        o.end_time > slotStart
    );
  };

  // Callback quando i blocchi cambiano
  const handleBlocksChanged = () => {
    refetchBlocks();
    fetchBlockedSlots();
  };

  // Genera giorni del mese per la griglia
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Trova il lunedì della prima settimana
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunedì = 0
    startDate.setDate(firstDay.getDate() - diff);

    const days = [];
    const current = new Date(startDate);

    // Genera 42 giorni (6 settimane)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Controlla se un giorno ha appuntamenti
  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDateToString(date);
    return bookings.filter(b => b.booking_date === dateStr);
  };

  // Controlla se è oggi
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Controlla se è il giorno selezionato
  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  // Controlla se è nel mese corrente
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Formatta data per display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Titolo header dinamico
  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return currentDate.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric'
      });
    } else if (viewType === 'week') {
      const weekDays = getWeekDays();
      const firstDay = weekDays[0];
      const lastDay = weekDays[6];
      
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${firstDay.getDate()} - ${lastDay.getDate()} ${firstDay.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;
      } else {
        return `${firstDay.getDate()} ${firstDay.toLocaleDateString('it-IT', { month: 'short' })} - ${lastDay.getDate()} ${lastDay.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
      }
    } else if (viewType === 'day') {
      return currentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return '';
  };

  // Genera i 7 giorni della settimana corrente (partendo da Lunedì)
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunedì = 0
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Navigazione mese/settimana/giorno
  const goToPrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 7);
        return newDate;
      });
    } else if (viewType === 'day') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 1);
        return newDate;
      });
    }
  };

  const goToNext = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 7);
        return newDate;
      });
    } else if (viewType === 'day') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 1);
        return newDate;
      });
    }
  };

  // Navigazione mese (mantenuta per retrocompatibilità)
  const goToPreviousMonth = goToPrevious;
  const goToNextMonth = goToNext;

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Helper per estrarre le note pulite (ora usa colonne dirette + fallback a notes JSON per retrocompatibilità)
  const parseBookingNotes = (booking: any): { 
    clientName?: string; 
    clientEmail?: string; 
    clientPhone?: string;
    originalNotes?: string;
    color?: string;
    serviceType?: string;
  } | null => {
    // Priorità 1: Usa colonne dirette (nuovo sistema)
    if (booking.client_name || booking.client_email || booking.service_type || booking.service || booking.color) {
      return {
        clientName: booking.client_name || undefined,
        clientEmail: booking.client_email || undefined,
        clientPhone: booking.client_phone || undefined,
        // Priorità 1: Nome servizio da professional_services (nuovo sistema)
        // Priorità 2: Colonna diretta service_type (retrocompatibilità)
        serviceType: booking.service?.name || booking.service_type || undefined,
        color: booking.service?.color || booking.color || undefined,
        originalNotes: booking.notes ? (() => {
          // Se notes è JSON, estrai original_notes, altrimenti usa notes come original_notes
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
        const parsed = JSON.parse(booking.notes);
        return {
          clientName: parsed.client_name,
          clientEmail: parsed.client_email,
          clientPhone: parsed.client_phone,
          originalNotes: parsed.original_notes,
          color: parsed.color,
          serviceType: parsed.service_type
        };
      } catch {
        // Se non è JSON, sono note normali
        return { originalNotes: booking.notes };
      }
    }
    
    return null;
  };

  // Helper per ottenere il colore dell'appuntamento
  const getBookingColor = (booking: any): string => {
    // Usa colonna diretta se disponibile
    if (booking.color) return booking.color;
    // Fallback a notes JSON per retrocompatibilità
    const parsed = parseBookingNotes(booking);
    return parsed?.color || '#EEBA2B'; // Default oro
  };

  // Helper per ottenere le note da mostrare
  const getDisplayNotes = (booking: any): string | null => {
    // Se notes è JSON, estrai original_notes, altrimenti usa notes direttamente
    if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes);
        return parsed.original_notes || null;
      } catch {
        // Se non è JSON, usa notes direttamente
        return booking.notes;
      }
    }
    return null;
  };

  // Helper per ottenere il nome cliente
  const getClientName = (booking: any): string => {
    // Priorità 1: Colonna diretta
    if (booking.client_name) return booking.client_name;
    // Priorità 2: Notes JSON (retrocompatibilità)
    const parsed = parseBookingNotes(booking);
    if (parsed?.clientName) return parsed.clientName;
    // Priorità 3: Profilo utente
    if (booking.profiles?.first_name) {
      return `${booking.profiles.first_name} ${booking.profiles.last_name || ''}`.trim();
    }
    if (booking.client?.first_name) {
      return `${booking.client.first_name} ${booking.client.last_name || ''}`.trim();
    }
    return 'Cliente';
  };

  // Calcola orario fine
  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    start.setMinutes(start.getMinutes() + durationMinutes);
    return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  };

  // Helper per calcolare ora fine da startTime e duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  // Gestisce click su slot per creare appuntamento
  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>, hour: number, date: Date) => {
    if (isSlotBlocked(date, hour)) {
      toast.info('Slot bloccato: non disponibile per prenotazioni');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const cellHeight = rect.height;
    
    // Calcola i minuti (0, 15, 30, 45) in base alla posizione Y
    const quarterIndex = Math.floor((clickY / cellHeight) * 4);
    const minutes = Math.min(quarterIndex * 15, 45); // 0, 15, 30, 45
    
    const startTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    setNewBooking({
      date: date,
      startTime: startTime,
      endTime: calculateEndTime(startTime, 60), // Default 1 ora
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
      status: 'confirmed',
      color: '#EEBA2B', // Default oro
      price: '', // Prezzo opzionale
      serviceId: '' // Inizializza senza servizio selezionato
    });
    setSelectedClientId(null); // Reset client selezionato quando si apre il modal
    setShowCreateModal(true);
  };

  // Snap ai 15 minuti
  const snapToQuarter = (minutes: number): number => {
    return Math.round(minutes / 15) * 15;
  };

  // ============================================
  // HELPER FUNCTIONS PER RESIZE - Conversioni Tempo
  // ============================================

  /**
   * Converti stringa orario (HH:MM) in minuti totali dal midnight
   * @example timeToMinutes('10:30') => 630
   */
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  /**
   * Converti minuti totali in stringa orario (HH:MM)
   * @example minutesToTime(630) => '10:30'
   */
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // ============================================
  // HELPER FUNCTIONS PER RESIZE - Validazioni
  // ============================================

  /**
   * Ottieni minuti di inizio da un booking
   */
  const getStartMinutes = (booking: any): number => {
    const startTime = booking.booking_time?.slice(0, 5) || '09:00';
    return timeToMinutes(startTime);
  };

  /**
   * Ottieni minuti di fine da un booking
   */
  const getEndMinutes = (booking: any): number => {
    const startMinutes = getStartMinutes(booking);
    const duration = booking.duration_minutes || 60;
    return startMinutes + duration;
  };

  /**
   * Controlla se un range temporale si sovrappone con altri appuntamenti
   * @returns true se c'è sovrapposizione
   */
  const checkOverlap = (
    bookingId: string,
    date: string,
    startMinutes: number,
    endMinutes: number
  ): boolean => {
    return bookings.some(b => 
      b.id !== bookingId &&
      b.booking_date === date &&
      // Overlap formula: start1 < end2 AND end1 > start2
      startMinutes < getEndMinutes(b) && 
      endMinutes > getStartMinutes(b)
    );
  };

  /**
   * Controlla se un orario è fuori dalla disponibilità settimanale
   * Nota: Per ora restituisce false (non abbiamo availability nel componente)
   * @returns true se fuori disponibilità
   */
  const checkOutsideAvailability = (
    date: string,
    startMinutes: number,
    endMinutes: number
  ): boolean => {
    // TODO: Implementare quando availability sarà disponibile nel componente
    // Per ora restituiamo false (non blocchiamo)
    return false;
  };

  // ============================================
  // CALCOLO PREVIEW RESIZE IN TEMPO REALE
  // ============================================

  /**
   * Calcola la preview del resize durante il drag
   * Include validazioni overlap e disponibilità
   */
  const getResizePreview = (): { 
    startTime: string; 
    endTime: string; 
    duration: number;
    isOverlapping: boolean;
    isOutsideAvailability: boolean;
  } | null => {
    if (!resizeState?.isResizing || !gridRef.current) return null;
    
    // Calcola delta in minuti in base alla vista
    const cellHeight = viewType === 'day' ? 60 : 40;
    const deltaY = resizeState.currentY - resizeState.startY;
    const deltaMinutes = Math.round((deltaY / cellHeight) * 60); // Fluido durante drag
    
    const originalStartMinutes = timeToMinutes(resizeState.originalStartTime);
    const originalEndMinutes = timeToMinutes(resizeState.originalEndTime);
    
    let newStartMinutes = originalStartMinutes;
    let newEndMinutes = originalEndMinutes;
    
    // Applica delta in base al bordo trascinato
    if (resizeState.edge === 'bottom') {
      // Resize dal basso: cambia ora fine
      newEndMinutes = originalEndMinutes + deltaMinutes;
    } else {
      // Resize dall'alto: cambia ora inizio
      newStartMinutes = originalStartMinutes + deltaMinutes;
    }
    
    // VALIDAZIONE 1: Durata minima 15 minuti
    if (newEndMinutes - newStartMinutes < 15) {
      if (resizeState.edge === 'bottom') {
        newEndMinutes = newStartMinutes + 15;
      } else {
        newStartMinutes = newEndMinutes - 15;
      }
    }
    
    // VALIDAZIONE 2: Limiti orari (1:00 - 23:45)
    newStartMinutes = Math.max(60, Math.min(23 * 60 + 45, newStartMinutes));
    newEndMinutes = Math.max(75, Math.min(24 * 60, newEndMinutes));
    
    // VALIDAZIONE 3: Check overlap con altri appuntamenti
    const bookingDate = resizeState.booking.booking_date;
    const isOverlapping = checkOverlap(
      resizeState.booking.id,
      bookingDate,
      newStartMinutes,
      newEndMinutes
    );
    
    // Se c'è overlap, blocca al bordo dell'altro appuntamento
    if (isOverlapping) {
      const overlappingBookings = bookings.filter(b => 
        b.id !== resizeState.booking.id &&
        b.booking_date === bookingDate &&
        newStartMinutes < getEndMinutes(b) && 
        newEndMinutes > getStartMinutes(b)
      );
      
      if (overlappingBookings.length > 0) {
        const nearestBooking = overlappingBookings[0];
        if (resizeState.edge === 'bottom') {
          // Blocca al bordo superiore dell'altro appuntamento
          newEndMinutes = Math.min(newEndMinutes, getStartMinutes(nearestBooking));
        } else {
          // Blocca al bordo inferiore dell'altro appuntamento
          newStartMinutes = Math.max(newStartMinutes, getEndMinutes(nearestBooking));
        }
      }
    }
    
    // VALIDAZIONE 4: Check fuori disponibilità
    const isOutsideAvailability = checkOutsideAvailability(
      bookingDate,
      newStartMinutes,
      newEndMinutes
    );
    
    return {
      startTime: minutesToTime(newStartMinutes),
      endTime: minutesToTime(newEndMinutes),
      duration: newEndMinutes - newStartMinutes,
      isOverlapping: false, // Già bloccato sopra
      isOutsideAvailability,
    };
  };

  // Converti posizione Y in orario (per vista giornaliera)
  const yToTime = (y: number, cellHeight: number = 60): string => {
    const hour = Math.floor(y / cellHeight) + 1; // +1 perché iniziamo da ora 1
    const minutesFraction = (y % cellHeight) / cellHeight;
    const minutes = snapToQuarter(Math.floor(minutesFraction * 60));
    const clampedHour = Math.max(1, Math.min(23, hour));
    const clampedMinutes = minutes >= 60 ? 0 : minutes;
    return `${clampedHour.toString().padStart(2, '0')}:${clampedMinutes.toString().padStart(2, '0')}`;
  };

  // Gestisce sia mouse che touch per iniziare il drag
  const onDragStart = (e: React.MouseEvent | React.TouchEvent, booking: any) => {
    // Solo per mouse events: preventDefault è sicuro
    // Per touch events: NON chiamare preventDefault qui (React gestisce touch come passivo)
    // Il preventDefault sarà gestito negli handler globali su document con { passive: false }
    if (!('touches' in e)) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Ottieni le coordinate (mouse o touch)
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setDragState({
      isDragging: true,
      booking: booking,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    });
  };

  // ============================================
  // HANDLER INIZIO RESIZE
  // ============================================

  /**
   * Inizia il resize di un appuntamento (mouse o touch)
   * @param e - Evento mouse o touch
   * @param booking - Appuntamento da ridimensionare
   * @param edge - Bordo trascinato ('top' o 'bottom')
   */
  const onResizeStart = (
    e: React.MouseEvent | React.TouchEvent, 
    booking: any, 
    edge: 'top' | 'bottom'
  ) => {
    // Solo per mouse events: preventDefault è sicuro
    // Per touch events: NON chiamare preventDefault qui (React gestisce touch come passivo)
    // Il preventDefault sarà gestito negli handler globali su document con { passive: false }
    if (!('touches' in e)) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    // Estrai coordinate Y in base al tipo di evento
    let clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }
    
    // Calcola orari originali
    const startTime = booking.booking_time?.slice(0, 5) || '09:00';
    const endTime = getEndTime(startTime, booking.duration_minutes || 60);
    
    // Imposta stato resize
    setResizeState({
      isResizing: true,
      booking: booking,
      edge: edge,
      startY: clientY,
      currentY: clientY,
      originalStartTime: startTime,
      originalEndTime: endTime,
      originalDuration: booking.duration_minutes || 60,
    });
  };

  // Calcola preview time durante il drag
  const getDragPreviewTime = (): string | null => {
    if (!dragState || !gridRef.current) return null;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const scrollTop = gridRef.current.scrollTop;
    const relativeY = dragState.currentY - gridRect.top + scrollTop - dragState.offsetY;
    const cellHeight = viewType === 'day' ? 60 : 40;
    
    return yToTime(Math.max(0, relativeY), cellHeight);
  };

  // Calcola preview date durante il drag (per vista settimanale)
  const getDragPreviewDate = (): Date => {
    if (!dragState || !gridRef.current || viewType !== 'week') return currentDate;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeX = dragState.currentX - gridRect.left;
    const columnWidth = gridRect.width / 8; // 8 colonne totali
    const dayIndex = Math.floor((relativeX - columnWidth) / columnWidth); // -1 per colonna ore
    const weekDays = getWeekDays();
    const clampedIndex = Math.max(0, Math.min(6, dayIndex));
    
    return weekDays[clampedIndex] || currentDate;
  };

  // Calcola la posizione Y snappata per l'indicatore di drop
  const getDropIndicatorPosition = (): number => {
    if (!dragState?.isDragging || !gridRef.current) return 0;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const scrollTop = gridRef.current.scrollTop;
    const relativeY = dragState.currentY - gridRect.top + scrollTop - dragState.offsetY;
    const cellHeight = viewType === 'day' ? 60 : 40;
    
    // Calcola i minuti totali e fai snap a 15
    const totalMinutes = (relativeY / cellHeight) * 60;
    const snappedMinutes = snapToQuarter(totalMinutes);
    
    // Converti di nuovo in pixel
    const snappedY = (snappedMinutes / 60) * cellHeight;
    
    return Math.max(0, snappedY);
  };

  // useEffect per gestire mousemove, mouseup, touchmove e touchend GLOBALMENTE
  useEffect(() => {
    if (!dragState?.isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
        };
      });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault(); // Previene lo scroll durante il drag
      
      setDragState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.touches[0].clientX,
          currentY: e.touches[0].clientY,
        };
      });
    };
    
    // Funzione comune per terminare il drag
    const finishDrag = async () => {
      if (!dragState?.booking || !gridRef.current) {
        setDragState(null);
        return;
      }
      
      // Controlla se c'è stato movimento significativo
      const deltaX = Math.abs(dragState.currentX - dragState.startX);
      const deltaY = Math.abs(dragState.currentY - dragState.startY);
      
      if (deltaX < 5 && deltaY < 5) {
        // È un click/tap, non un drag - apri il modal
        const bookingToOpen = dragState.booking;
        setDragState(null);
        handleBookingClick(bookingToOpen);
        return;
      }
      
      // È un drag - salva la nuova posizione
      const newTime = getDragPreviewTime();
      const newDate = viewType === 'week' ? getDragPreviewDate() : currentDate;
      
      if (newTime) {
        try {
          const { error } = await supabase
            .from('bookings')
            .update({
              booking_date: formatDateToString(newDate),
              booking_time: newTime,
            })
            .eq('id', dragState.booking.id);
          
          if (error) throw error;
          
          await fetchBookings(false);
          toast.success('Appuntamento spostato!');
        } catch (err: any) {
          console.error('Errore spostamento:', err);
          toast.error('Errore nello spostamento');
        }
      }
      
      setDragState(null);
    };
    
    const handleMouseUp = async () => {
      await finishDrag();
    };
    
    const handleTouchEnd = async () => {
      await finishDrag();
    };
    
    // Aggiungi listener per mouse E touch
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    // Previene il pull-to-refresh su mobile durante il drag
    document.body.style.overscrollBehavior = 'none';
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove, { passive: false } as EventListenerOptions);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [dragState?.isDragging, dragState?.booking, dragState?.currentX, dragState?.currentY, dragState?.startX, dragState?.startY, viewType, currentDate]);

  // ============================================
  // USEEFFECT GESTIONE RESIZE (MOUSE + TOUCH)
  // ============================================

  useEffect(() => {
    if (!resizeState?.isResizing) return;
    
    // Handler mousemove con requestAnimationFrame per performance
    const handleMouseMove = (e: MouseEvent) => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      
      rafIdRef.current = requestAnimationFrame(() => {
        setResizeState(prev => 
          prev ? { ...prev, currentY: e.clientY } : null
        );
      });
    };
    
    // Handler touchmove con requestAnimationFrame
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault(); // Previene scroll durante resize
      
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      
      rafIdRef.current = requestAnimationFrame(() => {
        setResizeState(prev => 
          prev ? { ...prev, currentY: e.touches[0].clientY } : null
        );
      });
    };
    
    // Funzione per completare il resize e salvare su database
    const finishResize = async () => {
      if (!resizeState?.booking) {
        setResizeState(null);
        return;
      }
      
      const preview = getResizePreview();
      if (!preview) {
        setResizeState(null);
        return;
      }
      
      // Controlla se c'è stato un cambiamento effettivo
      const hasChanged = 
        preview.duration !== resizeState.originalDuration || 
        preview.startTime !== resizeState.originalStartTime;
      
      if (!hasChanged) {
        setResizeState(null);
        return;
      }
      
      // VALIDAZIONE: Se fuori disponibilità, chiedi conferma
      if (preview.isOutsideAvailability) {
        const confirmed = window.confirm(
          'Questo appuntamento sarà fuori dalla tua disponibilità settimanale.\n\nVuoi procedere comunque?'
        );
        
        if (!confirmed) {
          setResizeState(null);
          return;
        }
      }
      
      // Snap finale a 15 minuti
      const snappedStartMinutes = snapToQuarter(timeToMinutes(preview.startTime));
      const snappedEndMinutes = snapToQuarter(timeToMinutes(preview.endTime));
      const snappedDuration = snappedEndMinutes - snappedStartMinutes;
      
      const finalStartTime = minutesToTime(snappedStartMinutes);
      const finalDuration = Math.max(15, snappedDuration); // Min 15min
      
      // Salva su database
      try {
        const { error } = await supabase
          .from('bookings')
          .update({
            booking_time: finalStartTime,
            duration_minutes: finalDuration,
          })
          .eq('id', resizeState.booking.id);
        
        if (error) throw error;
        
        // Ricarica appuntamenti
        await fetchBookings(false);
        
        toast.success('Durata appuntamento aggiornata!');
      } catch (err) {
        console.error('Errore resize:', err);
        toast.error('Errore nell\'aggiornamento della durata');
      }
      
      setResizeState(null);
    };
    
    // Handler mouseup/touchend
    const handleMouseUp = () => finishResize();
    const handleTouchEnd = () => finishResize();
    
    // Registra listener globali
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    
    // Applica stili globali durante resize
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.body.style.overscrollBehavior = 'none';
    
    // Cleanup
    return () => {
      // Rimuovi listener (con le stesse opzioni usate per addEventListener)
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove, { passive: false } as EventListenerOptions);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      // Ripristina stili
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.overscrollBehavior = '';
      
      // Cancella RAF pendente
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    resizeState?.isResizing,
    resizeState?.booking,
    resizeState?.currentY,
    resizeState?.startY,
    resizeState?.edge,
    resizeState?.originalStartTime,
    resizeState?.originalEndTime,
    resizeState?.originalDuration,
  ]);

  // Apre modal dettaglio appuntamento
  const handleBookingClick = (booking: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Evita che si apra il modal di creazione
    }
    
    const parsedNotes = parseBookingNotes(booking);
    
    setSelectedBooking(booking);
    setEditedBooking({
      date: booking.booking_date,
      startTime: booking.booking_time?.slice(0, 5) || '09:00',
      endTime: getEndTime(booking.booking_time || '00:00', booking.duration_minutes || 60),
      clientName: getClientName(booking),
      clientEmail: booking.client_email || parsedNotes?.clientEmail || booking.profiles?.email || '',
      clientPhone: booking.client_phone || parsedNotes?.clientPhone || '',
      notes: getDisplayNotes(booking) || '',
      status: booking.status || 'confirmed',
      color: getBookingColor(booking),
      price: booking.price ? booking.price.toString() : '' // Prezzo personalizzato
    });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  // Salva modifiche appuntamento
  const handleUpdateBooking = async () => {
    if (!selectedBooking || !editedBooking || !professionalId) return;
    
    try {
      // Calcola durata in minuti
      const [startH, startM] = editedBooking.startTime.split(':').map(Number);
      const [endH, endM] = editedBooking.endTime.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      
      if (durationMinutes <= 0) {
        toast.error('L\'orario di fine deve essere maggiore dell\'orario di inizio');
        return;
      }

      // Prepara notes solo con original_notes (non più JSON completo)
      const notesContent = editedBooking.notes || null;

      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: editedBooking.date,
          booking_time: editedBooking.startTime,
          duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
          status: editedBooking.status,
          notes: notesContent,
          // Salva nelle colonne separate
          client_name: editedBooking.clientName || null,
          client_email: editedBooking.clientEmail || null,
          client_phone: editedBooking.clientPhone || null,
          color: editedBooking.color || '#EEBA2B',
          // Prezzo personalizzato (opzionale)
          price: editedBooking.price && !isNaN(parseFloat(editedBooking.price.replace(',', '.'))) 
            ? parseFloat(editedBooking.price.replace(',', '.')) 
            : null
        })
        .eq('id', selectedBooking.id);
      
      if (error) throw error;
      
      await fetchBookings(false);
      toast.success('Appuntamento aggiornato!');
      setShowDetailModal(false);
      setSelectedBooking(null);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Errore aggiornamento appuntamento:', err);
      toast.error(err.message || 'Errore nell\'aggiornamento dell\'appuntamento');
    }
  };

  // Apre il dialog di conferma eliminazione
  const confirmDeleteBooking = () => {
    setShowDeleteConfirm(true);
  };

  // Esegue l'eliminazione effettiva
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      // Recupera dati prenotazione prima di eliminare (per notifica)
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('client_name, booking_date, booking_time, professional_id, service_id, cancellation_reason')
        .eq('id', selectedBooking.id)
        .maybeSingle();

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id);
      
      if (error) throw error;

      // Crea notifica per prenotazione cancellata (in background, non blocca il flusso)
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
            id: selectedBooking.id,
            clientName: bookingData.client_name || 'Cliente',
            bookingDate: bookingData.booking_date,
            bookingTime: bookingData.booking_time,
            reason: bookingData.cancellation_reason || undefined,
            serviceName
          });
        } catch (notifErr) {
          // Non bloccare il flusso se la notifica fallisce
          console.error('Errore creazione notifica:', notifErr);
        }
      }
      
      await fetchBookings(false);
      toast.success('Appuntamento eliminato!');
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedBooking(null);
    } catch (err: any) {
      console.error('Errore eliminazione appuntamento:', err);
      toast.error(err.message || 'Errore nell\'eliminazione dell\'appuntamento');
      setShowDeleteConfirm(false);
    }
  };

  // Salva nuovo appuntamento
  const handleCreateBooking = async () => {
    if (!newBooking || !professionalId || !newBooking.clientName) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    try {
      // Calcola durata in minuti
      const [startH, startM] = newBooking.startTime.split(':').map(Number);
      const [endH, endM] = newBooking.endTime.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      
      if (durationMinutes <= 0) {
        toast.error('L\'orario di fine deve essere maggiore dell\'orario di inizio');
        return;
      }

      // Priorità 1: Se cliente selezionato dall'autocomplete, usa il suo user_id dalla tabella clients
      // Priorità 2: Cerca cliente per email (opzionale)
      // Priorità 3: Usa user_id del professionista come placeholder
      let clientUserId: string | null = null;
      
      // Se abbiamo un client_id dalla tabella clients, cerca il corrispondente user_id
      if (selectedClientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('user_id')
          .eq('id', selectedClientId)
          .maybeSingle();
        
        if (clientData?.user_id) {
          clientUserId = clientData.user_id;
        }
      }
      
      // Se non trovato tramite client_id, prova con email
      if (!clientUserId && newBooking.clientEmail) {
        const { data: clientData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', newBooking.clientEmail.toLowerCase())
          .maybeSingle();
        
        if (clientData) {
          clientUserId = clientData.id;
        }
      }
      
      // Prepara notes solo con note testuali (non più JSON completo)
      const notesContent = newBooking.notes || null;

      // Trova servizio selezionato per ottenere colore e altre info
      const selectedService = newBooking.serviceId 
        ? services.find(s => s.id === newBooking.serviceId)
        : null;

      // Prepara dati booking con colonne separate
      const bookingData: any = {
        professional_id: professionalId,
        booking_date: formatDateToString(newBooking.date),
        booking_time: newBooking.startTime,
        duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
        status: newBooking.status,
        notes: notesContent,
        modalita: 'presenza',
        // Salva nelle colonne separate
        client_name: newBooking.clientName || null,
        client_email: newBooking.clientEmail || null,
        client_phone: newBooking.clientPhone || null,
        service_id: newBooking.serviceId || null, // FK a professional_services
        color: selectedService?.color || newBooking.color || '#EEBA2B',
        // Prezzo personalizzato (opzionale) - ha priorità sul prezzo del servizio
        price: newBooking.price && !isNaN(parseFloat(newBooking.price.replace(',', '.'))) 
          ? parseFloat(newBooking.price.replace(',', '.')) 
          : null
      };
      
      // Se abbiamo trovato il cliente, usa il suo ID
      // Altrimenti, usa l'ID dell'utente corrente come placeholder
      if (clientUserId) {
        bookingData.user_id = clientUserId;
      } else {
        // Usa l'ID dell'utente corrente (professionista) come placeholder
        // Questo permette di creare l'appuntamento anche senza cliente registrato
        if (user?.id) {
          bookingData.user_id = user.id;
        } else {
          toast.error('Errore: utente non autenticato');
          return;
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Aggiorna lista bookings
      await fetchBookings(false);
      
      // Crea notifica per nuova prenotazione (in background, non blocca il flusso)
      if (data && professionalId) {
        try {
          // Recupera nome servizio se presente
          let serviceName: string | undefined;
          if (data.service_id) {
            const { data: serviceData } = await supabase
              .from('professional_services')
              .select('name')
              .eq('id', data.service_id)
              .maybeSingle();
            serviceName = serviceData?.name;
          }

          const { notifyNewBooking } = await import('@/services/notificationService');
          await notifyNewBooking(professionalId, {
            id: data.id,
            clientName: newBooking.clientName,
            bookingDate: formatDateToString(newBooking.date),
            bookingTime: newBooking.startTime,
            serviceName
          });
        } catch (notifErr) {
          // Non bloccare il flusso se la notifica fallisce
          console.error('Errore creazione notifica:', notifErr);
        }
      }
      
      // Messaggio toast differenziato in base allo stato del cliente
      if (clientUserId) {
        // Cliente con account utente registrato
        toast.success('Appuntamento creato con successo!');
      } else if (selectedClientId) {
        // Cliente esistente nella tabella clients ma senza account utente
        toast.success('Appuntamento creato (cliente esistente, senza account)');
      } else {
        // Cliente non esistente nella tabella clients
        toast.success('Appuntamento creato (cliente non registrato)');
      }
      
      setShowCreateModal(false);
      setNewBooking(null);
      setSelectedClientId(null); // Reset client selezionato
    } catch (err: any) {
      console.error('Errore creazione appuntamento:', err);
      toast.error(err.message || 'Errore nella creazione dell\'appuntamento');
    }
  };

  const calendarDays = generateCalendarDays();
  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Rimuovo il check che nasconde la UI - mostriamo sempre la pagina mentre i dati caricano in background
  // if (initialLoading) {
  //   return (
  //     <div className="flex items-center justify-center py-12">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B]"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header con selettore vista e navigazione */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 relative">
        {/* Indicatore navigazione sottile */}
        {isNavigating && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#EEBA2B]"></div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Selettore vista */}
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewType === view
                    ? 'bg-[#EEBA2B] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {view === 'day' ? 'Giorno' : view === 'week' ? 'Settimana' : 'Mese'}
              </button>
            ))}
            
            {/* Bottone Gestisci Blocchi - Solo per vista Giorno e Settimana */}
            {(viewType === 'day' || viewType === 'week') && (
              <button
                onClick={() => setShowManageBlocksModal(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span className="hidden sm:inline">Gestisci Blocchi</span>
                <span className="sm:hidden">Blocchi</span>
              </button>
            )}
          </div>

          {/* Navigazione mese */}
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize min-w-[150px] sm:min-w-[200px] text-center">
              {getHeaderTitle()}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Mese successivo"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              Oggi
            </button>
          </div>
        </div>
      </div>

      {/* Vista Mensile */}
      {viewType === 'month' && (
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
        {/* Header giorni settimana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1 mb-2 sm:mb-2">
          {WEEKDAYS_FULL.map((day, i) => (
            <div
              key={day}
              className="text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-1 sm:flex sm:items-center sm:justify-center sm:text-center"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1">
          {calendarDays.map((date, index) => {
            const dayBookings = getBookingsForDate(date);
            const bookingCount = dayBookings.length;
            const isCurrent = isCurrentMonth(date);

            return (
              <button
                key={index}
                onClick={() => {
                  if (isCurrent && !isDateBlocked(date)) {
                    setSelectedDate(date);
                  }
                }}
                className={`
                  aspect-square sm:aspect-square sm:w-[60px] sm:h-[60px] sm:mx-auto 
                  flex flex-col items-center justify-center gap-0.5
                  rounded-lg cursor-pointer transition-colors
                  text-xs sm:text-sm
                  ${!isCurrent ? 'text-gray-300' : ''}
                  ${isDateBlocked(date) && isCurrent
                    ? 'bg-red-100 text-red-600 cursor-not-allowed'
                    : isToday(date) && isCurrent
                    ? 'bg-[#EEBA2B] text-white font-semibold'
                    : isSelected(date) && isCurrent
                    ? 'bg-[#EEBA2B]/20 text-[#EEBA2B] font-semibold'
                    : isCurrent
                    ? 'hover:bg-gray-100 text-gray-900'
                    : 'text-gray-300'
                  }
                `}
                disabled={!isCurrent || isDateBlocked(date)}
              >
                <span className={isDateBlocked(date) && isCurrent ? 'line-through' : ''}>
                  {date.getDate()}
                </span>
                {/* Indicatore blocco */}
                {isDateBlocked(date) && isCurrent && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
                {/* Indicatori appuntamenti */}
                {bookingCount > 0 && isCurrent && !isDateBlocked(date) && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(bookingCount, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#EEBA2B]"
                      />
                    ))}
                    {bookingCount > 3 && (
                      <span className="text-[10px] sm:text-xs text-[#EEBA2B] font-semibold">+</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Vista Settimanale */}
      {viewType === 'week' && (() => {
        const weekDays = getWeekDays();
        const hours = Array.from({ length: 23 }, (_, i) => i + 1); // 1-23

        // Trova booking per giorno e ora
        const getBookingForSlot = (day: Date, hour: number) => {
          const dateStr = formatDateToString(day);
          return bookings.find(b => {
            if (b.booking_date !== dateStr) return false;
            const bookingHour = parseInt(b.booking_time?.split(':')[0] || '0');
            return bookingHour === hour;
          });
        };

        return (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header con giorni della settimana */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              {/* Cella vuota angolo */}
              <div className="p-2 sm:p-2 bg-gray-50 border-r border-gray-200"></div>
              
              {/* Giorni */}
              {weekDays.map((day, i) => (
                <div 
                  key={i}
                  className={`p-2 sm:p-2 text-center border-r border-gray-200 last:border-r-0 ${
                    isDateBlocked(day)
                      ? 'bg-red-100'
                      : isToday(day) 
                      ? 'bg-[#EEBA2B]/10' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-xs hidden sm:block ${
                    isDateBlocked(day) ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm sm:text-lg font-semibold flex items-center justify-center gap-1 ${
                    isDateBlocked(day)
                      ? 'text-red-500 line-through'
                      : isToday(day)
                      ? 'text-[#EEBA2B]'
                      : 'text-gray-900'
                  }`}>
                    <span>{day.getDate()}</span>
                    {isDateBlocked(day) && (
                      <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Griglia ore con appuntamenti posizionati */}
            <div ref={gridRef} className="relative max-h-[500px] sm:max-h-[450px] overflow-y-auto">
              {/* Righe ore di sfondo */}
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="grid grid-cols-8 border-b border-gray-100 last:border-b-0"
                  style={{ height: '40px' }}
                >
                  {/* Colonna ora */}
                  <div className="p-1 sm:p-1 text-xs sm:text-sm text-gray-500 text-right pr-2 sm:pr-2 border-r border-gray-200 bg-gray-50 flex items-center justify-end">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {/* Celle giorni (solo per click e sfondo) */}
                  {weekDays.map((day, dayIndex) => (
                    <div 
                      key={dayIndex}
                      className={`border-r border-gray-100 last:border-r-0 cursor-pointer transition-colors relative ${
                        isToday(day) ? 'bg-[#EEBA2B]/5 hover:bg-[#EEBA2B]/15' : 'hover:bg-[#EEBA2B]/10'
                      }`}
                      onClick={(e) => handleSlotClick(e, hour, day)}
                    />
                  ))}
                </div>
              ))}
              
              {/* Layer appuntamenti per ogni giorno */}
              {weekDays.map((day, dayIndex) => {
                const dayBookings = getBookingsForDate(day);
                
                return dayBookings.map(booking => {
                  const bookingColor = getBookingColor(booking);
                  const clientName = getClientName(booking);
                  
                  const [startH, startM] = (booking.booking_time || '09:00').split(':').map(Number);
                  const durationMinutes = booking.duration_minutes || 60;
                  const topPosition = ((startH - 1) * 40) + (startM / 60 * 40);
                  const height = (durationMinutes / 60) * 40;
                  
                  // Calcolo semplificato usando percentuali
                  const leftPct = 12.5 + (dayIndex * 12.5) + 0.5;
                  const widthPct = 12.5 - 1;
                  
                  // ========================================
                  // CALCOLA POSIZIONE/ALTEZZA DURANTE RESIZE
                  // ========================================
                  const isBeingResized = resizeState?.booking?.id === booking.id;
                  const resizePreview = isBeingResized ? getResizePreview() : null;
                  
                  let displayTop = topPosition;
                  let displayHeight = height;
                  
                  if (isBeingResized && resizePreview) {
                    const [newStartH, newStartM] = resizePreview.startTime.split(':').map(Number);
                    displayTop = ((newStartH - 1) * 40) + (newStartM / 60 * 40);
                    displayHeight = (resizePreview.duration / 60) * 40;
                  }
                  
                  const isDragged = dragState?.booking?.id === booking.id;
                  
                  return (
                    <div
                      key={`${day.getTime()}-${booking.id}`}
                      className={`absolute left-0.5 right-0.5 rounded shadow-sm overflow-hidden pointer-events-auto transition-all text-xs ${
                        isDragged ? 'opacity-50 shadow-lg scale-[0.98]' : 
                        isBeingResized ? 'shadow-lg ring-2 ring-[#EEBA2B] scale-[1.02]' :
                        'hover:shadow-md'
                      } ${!isDragged && !isBeingResized ? 'cursor-grab' : ''}`}
                      style={{ 
                        backgroundColor: bookingColor,
                        top: `${displayTop}px`,
                        height: `${Math.max(displayHeight, 20)}px`,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        zIndex: isDragged || isBeingResized ? 50 : 10,
                        touchAction: 'none',
                      }}
                      onMouseDown={(e) => {
                        if (!isBeingResized) {
                          e.preventDefault();
                          e.stopPropagation();
                          onDragStart(e, booking);
                        }
                      }}
                      onTouchStart={(e) => {
                        if (!isBeingResized) {
                          e.stopPropagation();
                          onDragStart(e, booking);
                        }
                      }}
                    >
                      {/* ========================================
                          HANDLE RESIZE TOP (6px visibile, 12px touch)
                          ======================================== */}
                      <div className="relative h-1.5">
                        <div 
                          className="absolute -top-1.5 -bottom-1.5 left-0 right-0 cursor-ns-resize z-20"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onResizeStart(e, booking, 'top');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            onResizeStart(e, booking, 'top');
                          }}
                        />
                        <div className="h-full hover:bg-white/30 transition-colors pointer-events-none" />
                      </div>
                      
                      {/* ========================================
                          CONTENUTO CARD (più compatto per vista settimana)
                          ======================================== */}
                      <div className="px-0.5 sm:px-1 text-white h-[calc(100%-12px)] overflow-hidden pointer-events-none">
                        <div className="flex items-center gap-0.5 font-medium text-[10px] sm:text-xs truncate">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">
                            {isBeingResized && resizePreview 
                              ? `${resizePreview.startTime}`
                              : `${booking.booking_time?.slice(0, 5)}`
                            }
                          </span>
                        </div>
                        {displayHeight >= 30 && (
                          <div className="flex items-center gap-0.5 mt-0.5 text-[10px] sm:text-xs truncate">
                            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="truncate">{clientName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* ========================================
                          HANDLE RESIZE BOTTOM (6px visibile, 12px touch)
                          ======================================== */}
                      <div className="relative h-1.5">
                        <div 
                          className="absolute -top-1.5 -bottom-1.5 left-0 right-0 cursor-ns-resize z-20"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onResizeStart(e, booking, 'bottom');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            onResizeStart(e, booking, 'bottom');
                          }}
                        />
                        <div className="h-full hover:bg-white/30 transition-colors pointer-events-none" />
                      </div>
                    </div>
                  );
                });
              })}
              {/* Layer slot bloccati (availability_overrides) - grigio, icona lucchetto */}
              {blockedSlots.map((o) => {
                const dayIndex = weekDays.findIndex(
                  (d) => formatDateToString(d) === o.override_date
                );
                if (dayIndex === -1) return null;
                const [startH, startM] = o.start_time.split(':').map(Number);
                const [endH, endM] = o.end_time.split(':').map(Number);
                const topPosition = (startH - 1) * 40 + (startM / 60) * 40;
                const endPosition = (endH - 1) * 40 + (endM / 60) * 40;
                const height = Math.max(endPosition - topPosition, 20);
                const leftPct = 12.5 + dayIndex * 12.5 + 0.5;
                const widthPct = 12.5 - 1;
                return (
                  <div
                    key={o.id}
                    className="absolute left-0.5 right-0.5 rounded shadow-sm overflow-hidden pointer-events-none flex items-center justify-center text-red-600 bg-red-100 border border-red-200"
                    style={{
                      top: `${topPosition}px`,
                      height: `${height}px`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      zIndex: 5,
                    }}
                  >
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
            
          </div>
        );
      })()}

      {/* Vista Giornaliera */}
      {viewType === 'day' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Banner giorno bloccato */}
          {isDateBlocked(currentDate) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <Ban className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-700">Giorno bloccato</p>
                <p className="text-sm text-red-600">
                  Questo giorno non è disponibile per le prenotazioni.
                </p>
              </div>
              <button
                onClick={() => setShowManageBlocksModal(true)}
                className="ml-auto px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition flex-shrink-0"
              >
                Gestisci
              </button>
            </div>
          )}

          {/* Header con data e info giorno */}
          <div className={`p-3 sm:p-4 border-b border-gray-200 ${
            isToday(currentDate) ? 'bg-[#EEBA2B]/10' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold capitalize ${
                  isToday(currentDate) ? 'text-[#EEBA2B]' : 'text-gray-900'
                }`}>
                  {currentDate.toLocaleDateString('it-IT', { weekday: 'long' })}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {isToday(currentDate) && (
                <span className="px-3 py-1 bg-[#EEBA2B] text-white text-sm font-medium rounded-full">
                  Oggi
                </span>
              )}
            </div>
            
            {/* Riepilogo appuntamenti del giorno */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {getBookingsForDate(currentDate).length} appuntamenti
                </span>
              </div>
            </div>
          </div>

          {/* Timeline ore con position relative */}
          <div ref={gridRef} className="relative max-h-[450px] sm:max-h-[500px] overflow-y-auto">
            {/* Griglia ore di sfondo */}
            {Array.from({ length: 23 }, (_, i) => i + 1).map(hour => (
              <div 
                key={hour} 
                className="flex border-b border-gray-100 last:border-b-0"
                style={{ height: '60px' }}
              >
                {/* Colonna ora */}
                <div className="w-16 sm:w-20 flex-shrink-0 p-2 sm:p-3 text-xs sm:text-sm text-gray-500 text-right border-r border-gray-200 bg-gray-50">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Slot cliccabile (per creare nuovi appuntamenti) */}
                <div 
                  className="flex-1 hover:bg-[#EEBA2B]/10 cursor-pointer transition-colors relative"
                  onClick={(e) => handleSlotClick(e, hour, currentDate)}
                />
              </div>
            ))}
            
            {/* Layer appuntamenti posizionati sopra la griglia */}
            <div className="absolute top-0 left-16 sm:left-20 right-0 bottom-0 pointer-events-none">
              {getBookingsForDate(currentDate).map(booking => {
                const bookingColor = getBookingColor(booking);
                const displayNotes = getDisplayNotes(booking);
                const clientName = getClientName(booking);
                
                const [startH, startM] = (booking.booking_time || '09:00').split(':').map(Number);
                const durationMinutes = booking.duration_minutes || 60;
                const topPosition = ((startH - 1) * 60) + (startM / 60 * 60);
                const height = (durationMinutes / 60) * 60;
                
                // ========================================
                // CALCOLA POSIZIONE/ALTEZZA DURANTE RESIZE
                // ========================================
                const isBeingResized = resizeState?.booking?.id === booking.id;
                const resizePreview = isBeingResized ? getResizePreview() : null;
                
                let displayTop = topPosition;
                let displayHeight = height;
                
                if (isBeingResized && resizePreview) {
                  const [newStartH, newStartM] = resizePreview.startTime.split(':').map(Number);
                  displayTop = ((newStartH - 1) * 60) + (newStartM / 60 * 60);
                  displayHeight = (resizePreview.duration / 60) * 60;
                }
                
                const isDragged = dragState?.booking?.id === booking.id;
                
                return (
                  <div
                    key={booking.id}
                    className={`absolute left-1 right-1 rounded-lg shadow-sm overflow-hidden pointer-events-auto transition-all ${
                      isDragged ? 'opacity-50 shadow-lg scale-[0.98]' : 
                      isBeingResized ? 'shadow-lg ring-2 ring-[#EEBA2B] scale-[1.02]' :
                      'hover:shadow-md'
                    } ${!isDragged && !isBeingResized ? 'cursor-grab' : ''}`}
                    style={{ 
                      backgroundColor: bookingColor,
                      top: `${displayTop}px`,
                      height: `${Math.max(displayHeight, 30)}px`,
                      zIndex: isDragged || isBeingResized ? 50 : 10,
                      touchAction: 'none',
                    }}
                    onMouseDown={(e) => {
                      if (!isBeingResized) {
                        e.preventDefault();
                        e.stopPropagation();
                        onDragStart(e, booking);
                      }
                    }}
                    onTouchStart={(e) => {
                      if (!isBeingResized) {
                        e.stopPropagation();
                        onDragStart(e, booking);
                      }
                    }}
                  >
                    {/* ========================================
                        HANDLE RESIZE TOP (8px visibile, 16px touch)
                        ======================================== */}
                    <div className="relative h-2">
                      {/* Area touch invisibile estesa */}
                      <div 
                        className="absolute -top-2 -bottom-2 left-0 right-0 cursor-ns-resize z-20"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onResizeStart(e, booking, 'top');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          onResizeStart(e, booking, 'top');
                        }}
                      />
                      {/* Handle visibile */}
                      <div className="h-full hover:bg-white/30 transition-colors pointer-events-none" />
                    </div>
                    
                    {/* ========================================
                        CONTENUTO CARD
                        ======================================== */}
                    <div className="px-2 pb-2 text-white h-[calc(100%-16px)] overflow-hidden pointer-events-none">
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-medium">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {isBeingResized && resizePreview 
                            ? `${resizePreview.startTime} - ${resizePreview.endTime}`
                            : `${booking.booking_time?.slice(0, 5)} - ${getEndTime(booking.booking_time || '00:00', booking.duration_minutes || 60)}`
                          }
                        </span>
                      </div>
                      {displayHeight >= 40 && (
                        <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{clientName}</span>
                        </div>
                      )}
                      {displayHeight >= 60 && displayNotes && (
                        <p className="mt-1 text-xs opacity-90 truncate">{displayNotes}</p>
                      )}
                    </div>
                    
                    {/* ========================================
                        HANDLE RESIZE BOTTOM (8px visibile, 16px touch)
                        ======================================== */}
                    <div className="relative h-2">
                      {/* Area touch invisibile estesa */}
                      <div 
                        className="absolute -top-2 -bottom-2 left-0 right-0 cursor-ns-resize z-20"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onResizeStart(e, booking, 'bottom');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          onResizeStart(e, booking, 'bottom');
                        }}
                      />
                      {/* Handle visibile */}
                      <div className="h-full hover:bg-white/30 transition-colors pointer-events-none" />
                    </div>
                  </div>
                );
              })}
              {/* Layer slot bloccati (availability_overrides) - vista giorno - stile coerente con vista settimana */}
              {blockedSlots
                .filter((o) => o.override_date === formatDateToString(currentDate))
                .map((o) => {
                  const [startH, startM] = o.start_time.split(':').map(Number);
                  const [endH, endM] = o.end_time.split(':').map(Number);
                  const topPosition = (startH - 1) * 60 + (startM / 60) * 60;
                  const endPosition = (endH - 1) * 60 + (endM / 60) * 60;
                  const height = Math.max(endPosition - topPosition, 24);
                  return (
                    <div
                      key={o.id}
                      className="absolute left-1 right-1 rounded-lg shadow-sm overflow-hidden pointer-events-none flex items-center justify-center text-red-600 bg-red-100 border border-red-200 z-[5]"
                      style={{
                        top: `${topPosition}px`,
                        height: `${height}px`,
                      }}
                    >
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    </div>
                  );
                })}
            </div>
            
            {/* Indicatore di drop durante il drag - VISTA GIORNO */}
            {viewType === 'day' && dragState?.isDragging && (
              <div 
                className="absolute left-16 sm:left-20 right-0 pointer-events-none z-40 transition-all duration-75"
                style={{ top: `${getDropIndicatorPosition()}px` }}
              >
                {/* Contenitore linea */}
                <div className="relative w-full flex items-center">
                  {/* Etichetta orario a sinistra */}
                  <div className="absolute right-full mr-2 bg-[#EEBA2B] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                    {getDragPreviewTime() || '--:--'}
                  </div>
                  
                  {/* Linea orizzontale con pallini */}
                  <div className="w-full flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#EEBA2B] shadow-md flex-shrink-0" />
                    <div className="flex-1 h-0.5 bg-[#EEBA2B]" />
                    <div className="w-3 h-3 rounded-full bg-[#EEBA2B] shadow-md flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Creazione Appuntamento */}
      {showCreateModal && newBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          {/* Overlay con fade in */}
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" />
          
          {/* Modal con slide up */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Nuovo Appuntamento</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Data e ora */}
              <div className="bg-[#EEBA2B]/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#EEBA2B]" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {newBooking.date.toLocaleDateString('it-IT', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="time"
                        value={newBooking.startTime}
                        onChange={(e) => setNewBooking({
                          ...newBooking,
                          startTime: e.target.value,
                          endTime: calculateEndTime(e.target.value, 60)
                        })}
                        step="900"
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={newBooking.endTime}
                        onChange={(e) => setNewBooking({...newBooking, endTime: e.target.value})}
                        step="900"
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Nome cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome cliente *
                </label>
                {professionalId ? (
                  <ClientAutocomplete
                    professionalId={professionalId}
                    value={newBooking.clientName}
                    onChange={(value) => setNewBooking({...newBooking, clientName: value})}
                    onClientSelect={(client) => {
                      setSelectedClientId(client?.id || null);
                      // Se cliente selezionato, compila automaticamente nome, email e telefono
                      if (client) {
                        setNewBooking({
                          ...newBooking,
                          clientName: client.full_name,
                          clientEmail: client.email || '',
                          clientPhone: client.phone || ''
                        });
                      }
                    }}
                    onCreateNewClient={() => setShowAddClientModal(true)}
                    placeholder="Cerca o scrivi nome cliente..."
                  />
                ) : (
                  <input
                    type="text"
                    value={newBooking.clientName}
                    onChange={(e) => setNewBooking({...newBooking, clientName: e.target.value})}
                    placeholder="Es. Mario Rossi"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow"
                  />
                )}
              </div>
              
              {/* Email cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email cliente
                </label>
                <input
                  type="email"
                  value={newBooking.clientEmail}
                  onChange={(e) => setNewBooking({...newBooking, clientEmail: e.target.value})}
                  placeholder="mario@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se il cliente è registrato, verrà collegato automaticamente
                </p>
              </div>
              
              {/* Telefono cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono cliente
                </label>
                <input
                  type="tel"
                  value={newBooking.clientPhone}
                  onChange={(e) => setNewBooking({...newBooking, clientPhone: e.target.value})}
                  placeholder="+39 333 1234567"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow"
                />
              </div>
              
              {/* Tipo servizio - Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo di servizio
                </label>
                {loadingServices ? (
                  <div className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Caricamento servizi...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Select
                      value={newBooking.serviceId}
                      onValueChange={(selectedServiceId) => {
                        const selectedService = services.find(s => s.id === selectedServiceId);
                        
                        setNewBooking({
                          ...newBooking,
                          serviceId: selectedServiceId,
                          // Auto-compila durata se servizio selezionato
                          endTime: selectedService 
                            ? calculateEndTime(newBooking.startTime, selectedService.duration_minutes)
                            : calculateEndTime(newBooking.startTime, 60), // Default 1 ora se nessun servizio
                          // Auto-compila prezzo se servizio selezionato (formattato con virgola e 2 decimali)
                          price: selectedService 
                            ? selectedService.price.toFixed(2).replace('.', ',')
                            : '' // Reset prezzo se nessun servizio selezionato
                        });
                      }}
                    >
                      <SelectTrigger className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow relative bg-[#3A3A3A]">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <SelectValue placeholder="Seleziona un servizio..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100]" position="popper">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - €{service.price} ({service.duration_minutes} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {services.length === 0 && !loadingServices && (
                  <p className="mt-1 text-xs text-gray-500">
                    Nessun servizio disponibile. Configura i servizi nel tuo profilo.
                  </p>
                )}
              </div>
              
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note
                </label>
                <textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  placeholder="Aggiungi note sull'appuntamento..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow resize-none"
                />
              </div>
              
              {/* Prezzo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prezzo (€) <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={newBooking.price}
                  onChange={(e) => {
                    // Permetti solo numeri, virgola e punto
                    const value = e.target.value.replace(/[^0-9,.-]/g, '');
                    setNewBooking({...newBooking, price: value});
                  }}
                  onBlur={(e) => {
                    // Normalizza il valore su blur: converte virgola in punto e formatta
                    const value = e.target.value.replace(',', '.');
                    if (value && !isNaN(parseFloat(value))) {
                      const num = Math.max(0, parseFloat(value)); // Assicura >= 0
                      const formatted = num.toFixed(2);
                      setNewBooking({...newBooking, price: formatted});
                    } else if (value) {
                      // Se c'è un valore non valido, reset
                      setNewBooking({...newBooking, price: ''});
                    }
                  }}
                  placeholder="Es. 50,00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se lasciato vuoto, verrà usato il prezzo del servizio (se disponibile)
                </p>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stato
                </label>
                <select
                  value={newBooking.status}
                  onChange={(e) => setNewBooking({...newBooking, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                >
                  <option value="pending">In attesa</option>
                  <option value="confirmed">Confermato</option>
                  <option value="completed">Completato</option>
                  <option value="cancelled">Cancellato</option>
                  <option value="no_show">Non presentato</option>
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
                      onClick={() => setNewBooking({ ...newBooking!, color })}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        newBooking?.color === color 
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
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={!newBooking.clientName}
                className="flex-1 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#D4A826] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crea Appuntamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dettaglio/Modifica Appuntamento */}
      {showDetailModal && selectedBooking && editedBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowDetailModal(false);
            setIsEditing(false);
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
              style={{ backgroundColor: `${editedBooking.color}15` }}
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Modifica Appuntamento' : 'Dettaglio Appuntamento'}
              </h2>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setIsEditing(false);
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
                style={{ backgroundColor: `${editedBooking.color}15` }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: editedBooking.color }} />
                  <div className="flex-1">
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          value={editedBooking.date}
                          onChange={(e) => setEditedBooking({...editedBooking, date: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={editedBooking.startTime}
                            onChange={(e) => setEditedBooking({
                              ...editedBooking,
                              startTime: e.target.value,
                              endTime: calculateEndTime(e.target.value, 60)
                            })}
                            step="900"
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={editedBooking.endTime}
                            onChange={(e) => setEditedBooking({...editedBooking, endTime: e.target.value})}
                            step="900"
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">
                          {new Date(editedBooking.date + 'T00:00:00').toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {editedBooking.startTime} - {editedBooking.endTime}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Nome cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome cliente
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.clientName}
                    onChange={(e) => setEditedBooking({...editedBooking, clientName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900">
                    {editedBooking.clientName || '-'}
                  </p>
                )}
              </div>
              
              {/* Email cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email cliente
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedBooking.clientEmail}
                    onChange={(e) => setEditedBooking({...editedBooking, clientEmail: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900">
                    {editedBooking.clientEmail || '-'}
                  </p>
                )}
              </div>
              
              {/* Telefono cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono cliente
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedBooking.clientPhone}
                    onChange={(e) => setEditedBooking({...editedBooking, clientPhone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900">
                    {editedBooking.clientPhone || '-'}
                  </p>
                )}
              </div>
              
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note
                </label>
                {isEditing ? (
                  <textarea
                    value={editedBooking.notes}
                    onChange={(e) => setEditedBooking({...editedBooking, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900 min-h-[60px]">
                    {editedBooking.notes || '-'}
                  </p>
                )}
              </div>
              
              {/* Prezzo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prezzo (€) <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={editedBooking.price}
                    onChange={(e) => {
                      // Permetti solo numeri, virgola e punto
                      const value = e.target.value.replace(/[^0-9,.-]/g, '');
                      setEditedBooking({...editedBooking, price: value});
                    }}
                    onBlur={(e) => {
                      // Normalizza il valore su blur: converte virgola in punto e formatta
                      const value = e.target.value.replace(',', '.');
                      if (value && !isNaN(parseFloat(value))) {
                        const num = Math.max(0, parseFloat(value)); // Assicura >= 0
                        const formatted = num.toFixed(2);
                        setEditedBooking({...editedBooking, price: formatted});
                      } else if (value) {
                        // Se c'è un valore non valido, reset
                        setEditedBooking({...editedBooking, price: ''});
                      }
                    }}
                    placeholder="Es. 50,00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-shadow"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900">
                    {editedBooking.price 
                      ? `€${parseFloat(editedBooking.price.replace(',', '.')).toFixed(2).replace('.', ',')}` 
                      : '-'}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Se lasciato vuoto, verrà usato il prezzo del servizio (se disponibile)
                  </p>
                )}
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stato
                </label>
                {isEditing ? (
                  <select
                    value={editedBooking.status}
                    onChange={(e) => setEditedBooking({...editedBooking, status: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                  >
                    <option value="pending">In attesa</option>
                    <option value="confirmed">Confermato</option>
                    <option value="completed">Completato</option>
                    <option value="cancelled">Cancellato</option>
                    <option value="no_show">Non presentato</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${
                    editedBooking.status === 'completed' ? 'bg-blue-500' :
                    editedBooking.status === 'confirmed' ? 'bg-green-500' :
                    editedBooking.status === 'pending' ? 'bg-yellow-500' :
                    editedBooking.status === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}>
                    {editedBooking.status === 'completed' ? 'Completato' :
                     editedBooking.status === 'confirmed' ? 'Confermato' :
                     editedBooking.status === 'pending' ? 'In attesa' :
                     editedBooking.status === 'cancelled' ? 'Cancellato' :
                     editedBooking.status === 'no_show' ? 'Non presentato' :
                     editedBooking.status}
                  </span>
                )}
              </div>
              
              {/* Colore (solo in modifica) */}
              {isEditing && (
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
                        onClick={() => setEditedBooking({ ...editedBooking, color })}
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          editedBooking.color === color 
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleUpdateBooking}
                    disabled={!editedBooking.clientName}
                    className="flex-1 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#D4A826] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Salva Modifiche
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={confirmDeleteBooking}
                    className="flex-1 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                  >
                    Elimina
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#D4A826] transition-colors"
                  >
                    Modifica
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
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
                Eliminare appuntamento?
              </h3>
              <p className="text-gray-500">
                Questa azione non può essere annullata. L'appuntamento verrà eliminato definitivamente.
              </p>
            </div>
            
            {/* Bottoni */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteBooking}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista appuntamenti giorno selezionato */}
      {selectedDate && viewType !== 'day' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Appuntamenti - {formatDate(selectedDate)}
          </h3>

          {selectedBookings.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {selectedBookings.map((booking) => {
                const bookingColor = getBookingColor(booking);
                const displayNotes = getDisplayNotes(booking);
                const clientName = getClientName(booking);
                
                return (
                  <div
                    key={booking.id}
                    className="rounded-lg p-3 sm:p-4 border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                    style={{ 
                      backgroundColor: `${bookingColor}15`,  // Colore con 15% opacità
                      borderLeftColor: bookingColor 
                    }}
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {booking.booking_time} - {getEndTime(booking.booking_time, booking.duration_minutes)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium self-start sm:self-auto ${
                          booking.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : booking.status === 'no_show'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {booking.status === 'completed'
                          ? 'Completato'
                          : booking.status === 'confirmed'
                          ? 'Confermato'
                          : booking.status === 'pending'
                          ? 'In attesa'
                          : booking.status === 'cancelled'
                          ? 'Cancellato'
                          : booking.status === 'no_show'
                          ? 'Non presentato'
                          : booking.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">
                        {clientName}
                      </span>
                    </div>

                    {displayNotes && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">{displayNotes}</p>
                    )}

                    {booking.modalita && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] sm:text-xs">
                        {booking.modalita === 'online' ? 'Online' : 'Presenza'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm sm:text-base">Nessun appuntamento</p>
            </div>
          )}
        </div>
      )}

      {/* Elemento fantasma durante il drag */}
      {dragState?.isDragging && dragState.booking && (
        <>
          {/* Ghost che segue il cursore */}
          <div
            className="fixed pointer-events-none z-[100] rounded-lg shadow-2xl"
            style={{
              backgroundColor: getBookingColor(dragState.booking),
              left: `${dragState.currentX - dragState.offsetX}px`,
              top: `${dragState.currentY - dragState.offsetY}px`,
              width: viewType === 'day' ? '280px' : '100px',
              height: `${Math.max((dragState.booking.duration_minutes || 60) / 60 * (viewType === 'day' ? 60 : 40), 30)}px`,
              opacity: 0.9,
              transform: 'rotate(1deg)',
            }}
          >
            <div className="p-2 text-white text-sm font-medium truncate">
              {getClientName(dragState.booking)}
            </div>
          </div>
          
          {/* Preview della nuova posizione */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg z-[100] text-sm font-medium animate-fadeIn">
            {viewType === 'week' && (
              <span>{getDragPreviewDate().toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })} - </span>
            )}
            <span>{getDragPreviewTime() || '--:--'}</span>
          </div>
        </>
      )}

      {/* Modal Gestisci Blocchi */}
      {professionalId && (
        <ManageBlocksModal
          isOpen={showManageBlocksModal}
          onClose={() => setShowManageBlocksModal(false)}
          professionalId={professionalId}
          currentView={viewType === 'day' ? 'day' : 'week'}
          onBlocksChanged={handleBlocksChanged}
        />
      )}

      {/* Modal Crea Nuovo Cliente */}
      {professionalId && showAddClientModal && (
        <AddClientModal
          professionalId={professionalId}
          onClose={() => {
            setShowAddClientModal(false);
          }}
          onSuccess={() => {
            // Il modal si chiude automaticamente dopo il successo
            setShowAddClientModal(false);
          }}
          onClientCreated={(newClient) => {
            // Auto-seleziona il cliente appena creato nell'autocomplete
            setNewBooking(prev => prev ? {
              ...prev,
              clientName: newClient.full_name
            } : null);
            setSelectedClientId(newClient.id);
            setShowAddClientModal(false);
            toast.success(`Cliente "${newClient.full_name}" creato e selezionato!`);
          }}
          initialName={newBooking?.clientName || ''}
        />
      )}

    </div>
  );
};

export default AgendaView;

