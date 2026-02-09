// src/components/partner/clients/ClientDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  X, Mail, Phone, MessageCircle, Calendar, 
  User, FileText, FolderOpen, Edit, Trash2,
  Plus, Clock, CheckCircle, PauseCircle
} from 'lucide-react';
import EditClientModal from './EditClientModal';
import AddProjectModal from '@/components/partner/projects/AddProjectModal';
import AddBookingModal from '@/components/partner/bookings/AddBookingModal';

interface Client {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_pp_subscriber: boolean;
  created_at: string;
  total_sessions?: number;
  last_session_date?: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  service_type?: string | null;
  service_id?: string | null; // FK a professional_services
  status: string;
  notes?: string | null;
  service?: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    color: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  objective: string | null;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string | null;
  notes?: string | null;
}

interface ClientDetailModalProps {
  client: Client;
  professionalId: string;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (clientId: string) => void;
}

type TabType = 'details' | 'bookings' | 'projects' | 'notes';

export default function ClientDetailModal({ 
  client, 
  professionalId,
  onClose, 
  onUpdate,
  onDelete 
}: ClientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState(() => {
    // Se è un cliente mock, carica note da localStorage
    if (client.id.startsWith('mock-')) {
      const savedNotes = localStorage.getItem(`client_notes_${client.id}`);
      return savedNotes || client.notes || '';
    }
    return client.notes || '';
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch bookings e projects quando cambia tab
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'projects') {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch only when tab/client changes
  }, [activeTab, client.id]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Se è un cliente mock, non cercare prenotazioni nel database
      if (client.id.startsWith('mock-')) {
        setBookings([]);
        setLoading(false);
        return;
      }
      
      // Fetch tutte le prenotazioni del professionista con JOIN a professional_services
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
          service:professional_services(id, name, price, duration_minutes, color)
        `)
        .eq('professional_id', professionalId)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .limit(100); // Limite più alto per filtrare lato client
      
      if (error) throw error;
      
      // Filtra lato client per match con cliente (service da join può essere oggetto o array)
      type BookingRow = { id: string; user_id?: string; client_name?: string; client_email?: string; notes?: string | Record<string, unknown>; booking_date: string; booking_time: string; duration_minutes?: number; status: string; service_id?: string | null; service?: { name?: string } | { id?: string; name?: string }[] | null; service_type?: string | null };
      const filteredBookings = (data || []).filter((booking: BookingRow) => {
        // Match per user_id se il cliente è registrato
        if (client.user_id && booking.user_id === client.user_id) {
          return true;
        }
        
        // Match per nome cliente - priorità colonna diretta, poi fallback a notes JSON
        if (client.full_name && booking.client_name) {
          // Confronto case-insensitive e normalizzato (trim)
          const bookingName = booking.client_name.trim().toLowerCase();
          const clientName = client.full_name.trim().toLowerCase();
          if (bookingName === clientName) {
            return true;
          }
        }
        
        // Match per email - priorità colonna diretta, poi fallback a notes JSON
        if (client.email) {
          // Priorità 1: Colonna diretta
          if (booking.client_email && booking.client_email.toLowerCase() === client.email.toLowerCase()) {
            return true;
          }
          // Priorità 2: Notes JSON (retrocompatibilità)
          if (booking.notes) {
            try {
              const parsedNotes = typeof booking.notes === 'string' 
                ? JSON.parse(booking.notes) 
                : booking.notes;
              
              if (parsedNotes?.client_email && parsedNotes.client_email.toLowerCase() === client.email.toLowerCase()) {
                return true;
              }
            } catch {
              // Se notes non è JSON valido, ignora
            }
          }
        }
        
        return false;
      }).slice(0, 20); // Limita a 20 risultati
      
      // Mappa i dati al formato Booking
      const serviceName = (s: BookingRow['service']) => (s && !Array.isArray(s) && 'name' in s ? s.name : null);
      const mappedBookings: Booking[] = filteredBookings.map((b: BookingRow) => ({
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        duration_minutes: b.duration_minutes || 60,
        status: b.status,
        notes: typeof b.notes === 'string' ? b.notes : (b.notes == null ? null : JSON.stringify(b.notes)),
        service_id: b.service_id || null,
        service: (b.service && !Array.isArray(b.service) ? (b.service as Booking['service']) : (Array.isArray(b.service) && b.service[0] ? (b.service[0] as Booking['service']) : null)),
        service_type: serviceName(b.service) || b.service_type || (b.notes ? (() => {
          try {
            const parsed = typeof b.notes === 'string' ? JSON.parse(b.notes) : b.notes;
            return (parsed as Record<string, unknown>)?.service_type as string || null;
          } catch {
            return null;
          }
        })() : null)
      }));
      
      setBookings(mappedBookings);
    } catch (err: unknown) {
      console.error('Errore fetch prenotazioni:', err);
      const e = err as { code?: string };
      // Se errore 403 o tabella non esiste, ignora silenziosamente
      if (e.code === 'PGRST116' || e.code === '42501' || e.code === 'PGRST301') {
        setBookings([]);
        return;
      }
      toast.error('Errore nel caricamento delle prenotazioni');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Se è un cliente mock, non cercare progetti nel database
      if (client.id.startsWith('mock-')) {
        setProjects([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Se errore 403 o tabella non esiste, ignora silenziosamente (probabilmente tabella non ancora creata)
        if (error.code === 'PGRST116' || error.code === '42501' || error.code === 'PGRST301') {
          console.log('Tabella projects non disponibile o permessi insufficienti:', error.message);
          setProjects([]);
          return;
        }
        throw error;
      }
      setProjects(data || []);
    } catch (err: unknown) {
      console.error('Errore fetch progetti:', err);
      const e = err as { code?: string; status?: number };
      // Non mostrare toast per errori di permessi (tabella potrebbe non essere ancora creata)
      if (e.code !== '42501' && e.code !== 'PGRST301' && e.status !== 403) {
        toast.error('Errore nel caricamento dei progetti');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    try {
      // Se è un cliente mock, salva in localStorage
      if (client.id.startsWith('mock-')) {
        localStorage.setItem(`client_notes_${client.id}`, notes);
        toast.success('Note salvate (solo in locale - cliente di prova)');
        setIsEditingNotes(false);
        // Aggiorna le note nel client object localmente
        client.notes = notes;
        return;
      }
      
      // Per clienti reali, salva nel database
      const { error } = await supabase
        .from('clients')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', client.id);
      
      if (error) throw error;
      toast.success('Note salvate');
      setIsEditingNotes(false);
      onUpdate();
    } catch (err) {
      console.error('Errore salvataggio note:', err);
      toast.error('Errore nel salvare le note');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);
      
      if (error) throw error;
      toast.success('Cliente eliminato');
      onDelete(client.id);
      onClose();
    } catch (err) {
      console.error('Errore eliminazione cliente:', err);
      toast.error('Errore nell\'eliminazione');
    }
  };

  // Quick Actions
  const handleEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    } else {
      toast.error('Email non disponibile');
    }
  };

  const handleWhatsApp = () => {
    if (client.phone) {
      const phone = client.phone.replace(/\s/g, '').replace('+', '');
      window.open(`https://wa.me/${phone}`, '_blank');
    } else {
      toast.error('Numero di telefono non disponibile');
    }
  };

  const handleCall = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    } else {
      toast.error('Numero di telefono non disponibile');
    }
  };

  // Iniziali avatar
  const initials = client.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Helper per formattare orario
  const formatTime = (time: string) => {
    return time.slice(0, 5); // "HH:mm"
  };

  // Helper per calcolare orario fine
  const getEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'details', label: 'Dettagli', icon: User },
    { id: 'bookings', label: 'Prenotazioni', icon: Calendar },
    { id: 'projects', label: 'Progetti', icon: FolderOpen },
    { id: 'notes', label: 'Note', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{client.full_name}</h2>
            {client.is_pp_subscriber && (
              <span className="text-xs bg-[#EEBA2B]/20 text-[#EEBA2B] px-2 py-0.5 rounded-full font-medium">
                ⭐ PP
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Profilo Cliente */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${
              client.is_pp_subscriber ? 'bg-[#EEBA2B]' : 'bg-gray-400'
            }`}>
              {initials}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{client.full_name}</p>
              {client.email && (
                <p className="text-sm text-gray-500 truncate">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-500 truncate">{client.phone}</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleEmail}
              disabled={!client.email}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!client.phone}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-green-700 rounded-xl transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleCall}
              disabled={!client.phone}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 rounded-xl transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Chiama</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#EEBA2B] border-b-2 border-[#EEBA2B]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* TAB: Dettagli */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Sessioni Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{client.total_sessions || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Ultima Sessione</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.last_session_date 
                      ? new Date(client.last_session_date).toLocaleDateString('it-IT', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : 'Nessuna'
                    }
                  </p>
                </div>
              </div>
              
              {(() => {
                // Per clienti mock, carica anche da localStorage
                const displayNotes = client.id.startsWith('mock-') 
                  ? (localStorage.getItem(`client_notes_${client.id}`) || client.notes || '')
                  : (client.notes || '');
                
                return displayNotes ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">📝 Note</p>
                    <p className="text-sm text-gray-700">{displayNotes}</p>
                  </div>
                ) : null;
              })()}

              {client.is_pp_subscriber && (
                <div className="bg-[#EEBA2B]/10 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <p className="font-medium text-gray-900">Abbonato Performance Prime</p>
                      <p className="text-xs text-gray-500">Questo cliente usa anche l'app PP</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Prenotazioni */}
          {activeTab === 'bookings' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B] mx-auto"></div>
                  <p className="mt-2">Caricamento...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nessuna prenotazione</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map(booking => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <p className="font-medium text-gray-900">
                            {new Date(booking.booking_date).toLocaleDateString('it-IT', { 
                              day: 'numeric', 
                              month: 'short' 
                            })} - {formatTime(booking.booking_time)} - {getEndTime(booking.booking_time, booking.duration_minutes)}
                          </p>
                        </div>
                        {booking.service_type && (
                          <p className="text-sm text-gray-500 ml-6">{booking.service_type}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                        booking.status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status === 'completed' ? '✓ Completata' : 
                         booking.status === 'cancelled' ? '✗ Annullata' : 
                         booking.status === 'pending' ? '⏳ In attesa' : '✓ Confermata'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Progetti */}
          {activeTab === 'projects' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B] mx-auto"></div>
                  <p className="mt-2">Caricamento...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nessun progetto</p>
                  <button 
                    onClick={() => setShowAddProjectModal(true)}
                    className="mt-3 text-[#EEBA2B] hover:underline font-medium text-sm"
                  >
                    + Crea primo progetto
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div 
                      key={project.id}
                      className="p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : project.status === 'paused'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status === 'active' && <CheckCircle className="w-3 h-3" />}
                          {project.status === 'paused' && <PauseCircle className="w-3 h-3" />}
                          {project.status === 'active' ? 'Attivo' : 
                           project.status === 'paused' ? 'In Pausa' : 'Completato'}
                        </span>
                      </div>
                      {project.objective && (
                        <p className="text-sm text-gray-500 mb-2">🎯 {project.objective}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Iniziato: {new Date(project.start_date).toLocaleDateString('it-IT')}
                        {project.end_date && (
                          <> • Fine: {new Date(project.end_date).toLocaleDateString('it-IT')}</>
                        )}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl hover:bg-[#d4a826] transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Crea Progetto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Note */}
          {activeTab === 'notes' && (
            <div>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Aggiungi note private su questo cliente..."
                    className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNotes}
                      className="flex-1 py-2 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#d4a826] transition-colors"
                    >
                      Salva
                    </button>
                    <button
                      onClick={() => {
                        // Reset alle note originali (da localStorage per mock, altrimenti da client)
                        if (client.id.startsWith('mock-')) {
                          const savedNotes = localStorage.getItem(`client_notes_${client.id}`);
                          setNotes(savedNotes || client.notes || '');
                        } else {
                          setNotes(client.notes || '');
                        }
                        setIsEditingNotes(false);
                      }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {(() => {
                    // Per clienti mock, mostra anche note da localStorage
                    const displayNotes = client.id.startsWith('mock-') 
                      ? (localStorage.getItem(`client_notes_${client.id}`) || notes || '')
                      : (notes || '');
                    
                    return displayNotes ? (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{displayNotes}</p>
                        {client.id.startsWith('mock-') && (
                          <p className="text-xs text-gray-400 mt-2 italic">
                            💾 Nota salvata localmente (cliente di prova)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nessuna nota</p>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="mt-3 w-full py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {(() => {
                      const displayNotes = client.id.startsWith('mock-') 
                        ? (localStorage.getItem(`client_notes_${client.id}`) || notes || '')
                        : (notes || '');
                      return displayNotes ? 'Modifica nota' : 'Aggiungi nota';
                    })()}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#d4a826] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Prenota</span>
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            title="Modifica cliente"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            title="Elimina cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminare questo cliente?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Questa azione è irreversibile. Tutti i dati del cliente verranno eliminati.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Modifica Cliente */}
        {showEditModal && (
          <EditClientModal
            client={client}
            professionalId={professionalId}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              onUpdate();
              setShowEditModal(false);
            }}
          />
        )}

        {/* Modal Aggiungi Progetto */}
        {showAddProjectModal && (
          <AddProjectModal
            professionalId={professionalId}
            preselectedClientId={client.id}
            onClose={() => setShowAddProjectModal(false)}
            onSuccess={() => {
              fetchProjects(); // Refresh lista progetti nel tab
              setShowAddProjectModal(false);
            }}
          />
        )}

        {/* Modal Aggiungi Prenotazione */}
        {showBookingModal && (
          <AddBookingModal
            professionalId={professionalId}
            preselectedClientId={client.id}
            preselectedClientName={client.full_name}
            preselectedClientEmail={client.email || undefined}
            preselectedClientUserId={client.user_id || undefined}
            onClose={() => setShowBookingModal(false)}
            onSuccess={() => {
              fetchBookings(); // Refresh lista prenotazioni nel tab
              setShowBookingModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

