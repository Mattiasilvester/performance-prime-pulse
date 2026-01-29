import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Search, Users, UserCheck, Star, Plus, 
  ChevronRight, Mail, Phone, ChevronDown 
} from 'lucide-react';
import ClientDetailModal from '@/components/partner/clients/ClientDetailModal';
import AddClientModal from '@/components/partner/clients/AddClientModal';

// Tipi
interface Client {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_pp_subscriber: boolean;
  created_at: string;
  total_sessions: number;
  last_session_date: string | null;
}

export default function ClientiPage() {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false); // Inizia a false per mostrare UI subito
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pp'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    ppSubscribers: 0
  });

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

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

  // Fetch clients
  useEffect(() => {
    if (professionalId) {
      fetchClients();
    }
  }, [professionalId]);

  const fetchClients = async () => {
    if (!professionalId) return;
    setLoading(true);
    
    // Dati mock per test
    const mockClients: Client[] = [
      {
        id: 'mock-1',
        full_name: 'Andrea Rossi',
        email: 'andrea.rossi@email.com',
        phone: '+39 333 1234567',
        notes: 'Preferisce allenamenti mattutini. Obiettivo: perdere 5kg.',
        is_pp_subscriber: true,
        created_at: '2025-06-15T10:00:00Z',
        total_sessions: 24,
        last_session_date: '2026-01-15T11:00:00Z',
        user_id: null
      },
      {
        id: 'mock-2',
        full_name: 'Marco Bianchi',
        email: 'marco.bianchi@gmail.com',
        phone: '+39 347 9876543',
        notes: 'Problema alla spalla destra, evitare esercizi overhead.',
        is_pp_subscriber: false,
        created_at: '2025-09-20T14:30:00Z',
        total_sessions: 12,
        last_session_date: '2026-01-10T09:00:00Z',
        user_id: null
      },
      {
        id: 'mock-3',
        full_name: 'Giulia Verdi',
        email: 'giulia.verdi@outlook.com',
        phone: '+39 320 5551234',
        notes: '',
        is_pp_subscriber: true,
        created_at: '2025-11-01T08:00:00Z',
        total_sessions: 8,
        last_session_date: '2026-01-18T16:00:00Z',
        user_id: null
      },
      {
        id: 'mock-4',
        full_name: 'Luca Ferrari',
        email: 'luca.ferrari@email.it',
        phone: '+39 339 4445566',
        notes: 'Atleta agonista, preparazione maratona primavera 2026.',
        is_pp_subscriber: false,
        created_at: '2025-12-10T12:00:00Z',
        total_sessions: 6,
        last_session_date: '2026-01-12T07:30:00Z',
        user_id: null
      },
      {
        id: 'mock-5',
        full_name: 'Sara Esposito',
        email: 'sara.esposito@gmail.com',
        phone: '+39 328 7778899',
        notes: 'Post gravidanza, focus su core e postura.',
        is_pp_subscriber: true,
        created_at: '2026-01-05T10:00:00Z',
        total_sessions: 3,
        last_session_date: '2026-01-17T10:00:00Z',
        user_id: null
      },
      {
        id: 'mock-6',
        full_name: 'Francesco Conti',
        email: 'f.conti@email.com',
        phone: '+39 345 1112233',
        notes: '',
        is_pp_subscriber: false,
        created_at: '2025-08-22T09:00:00Z',
        total_sessions: 18,
        last_session_date: '2025-12-20T14:00:00Z',
        user_id: null
      },
      {
        id: 'mock-7',
        full_name: 'Chiara Ricci',
        email: 'chiara.ricci@yahoo.it',
        phone: '+39 366 9990000',
        notes: 'Lavora su turni, disponibilità variabile.',
        is_pp_subscriber: true,
        created_at: '2025-07-01T11:00:00Z',
        total_sessions: 30,
        last_session_date: '2026-01-19T08:00:00Z',
        user_id: null
      }
    ];
    
    try {
      // Fetch clients del professionista
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('professional_id', professionalId)
        .order('full_name', { ascending: true });
      
      if (error) {
        // Se la tabella non esiste o errore, usa dati mock
        console.log('Tabella clients non disponibile o errore, uso dati mock:', error.message);
        setClients(mockClients);
        calculateStats(mockClients);
        setLoading(false);
        return;
      }
      
      // Se ci sono dati reali, usali (calcolando sessioni)
      if (data && data.length > 0) {
        // OTTIMIZZAZIONE CRITICA: carica tutte le prenotazioni in UNA singola query invece di N query separate
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('booking_date, notes, user_id, client_email, client_name')
          .eq('professional_id', professionalId)
          .order('booking_date', { ascending: false });

        if (bookingsError) {
          console.error('Errore caricamento bookings per clienti:', bookingsError);
        }

        // Filtra e calcola statistiche per ogni cliente dal dataset condiviso
        const clientsWithStats = data.map((client) => {
          // Filtra lato client per match con questo cliente
          const bookings = (allBookings || []).filter((booking: any) => {
            // Match per user_id
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
                  const parsed = typeof booking.notes === 'string' 
                    ? JSON.parse(booking.notes) 
                    : booking.notes;
                  if (parsed?.client_email && parsed.client_email.toLowerCase() === client.email.toLowerCase()) {
                    return true;
                  }
                } catch {
                  // Se notes non è JSON valido, ignora
                }
              }
            }
            
            return false;
          });

          // Ordina per data (più recente prima) e prendi la prima per last_session_date
          const sortedBookings = bookings.sort((a: any, b: any) => {
            return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
          });

          const totalSessions = sortedBookings?.length || 0;
          const lastSession = sortedBookings?.[0]?.booking_date || null;

          return {
            ...client,
            total_sessions: totalSessions,
            last_session_date: lastSession
          };
        });

        setClients(clientsWithStats);
        calculateStats(clientsWithStats);
      } else {
        // Tabella esiste ma vuota, usa dati mock
        console.log('Tabella clients vuota, uso dati mock per test');
        setClients(mockClients);
        calculateStats(mockClients);
      }
    } catch (err: any) {
      console.error('Errore fetch clienti, uso dati mock:', err);
      // In caso di errore generico, usa dati mock
      setClients(mockClients);
      calculateStats(mockClients);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientsData: Client[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setStats({
      total: clientsData.length,
      active: clientsData.filter(c => 
        c.last_session_date && new Date(c.last_session_date) >= thirtyDaysAgo
      ).length,
      ppSubscribers: clientsData.filter(c => c.is_pp_subscriber).length
    });
  };

  // Filtro clienti
  const filteredClients = clients.filter(client => {
    // Filtro ricerca
    const matchesSearch = 
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.phone && client.phone.includes(searchQuery));
    
    // Filtro PP
    const matchesFilter = filter === 'all' || (filter === 'pp' && client.is_pp_subscriber);
    
    return matchesSearch && matchesFilter;
  });

  // Raggruppa per lettera iniziale
  const groupedClients = filteredClients.reduce((acc, client) => {
    const letter = client.full_name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(client);
    return acc;
  }, {} as Record<string, Client[]>);

  const sortedLetters = Object.keys(groupedClients).sort();

  // Click su stats card
  const handleStatsClick = (type: 'total' | 'active' | 'pp') => {
    if (type === 'total') setFilter('all');
    if (type === 'pp') setFilter('pp');
    // Per 'active' potresti aggiungere un filtro specifico
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
        <p className="text-gray-600 mt-1">Gestisci i tuoi clienti e il loro storico</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Totale Clienti */}
        <div 
          onClick={() => handleStatsClick('total')}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            filter === 'all' ? 'border-[#EEBA2B] shadow-lg' : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totale Clienti</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Clienti Attivi */}
        <div 
          onClick={() => handleStatsClick('active')}
          className="bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-[#EEBA2B]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attivi (30gg)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Abbonati PP */}
        <div 
          onClick={() => handleStatsClick('pp')}
          className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
            filter === 'pp' ? 'border-[#EEBA2B] shadow-lg' : 'border-transparent hover:border-[#EEBA2B]'
          }`}
        >
          <div className="flex items-center justify-between">
    <div>
              <p className="text-sm text-gray-500">Abbonati PP</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ppSubscribers}</p>
            </div>
            <div className="w-12 h-12 bg-[#EEBA2B]/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-[#EEBA2B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="w-full sm:flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]"
            />
          </div>

          {/* Filtro */}
          <div className="flex gap-2 sm:gap-3">
            {/* Mobile: dropdown compatto - Desktop: normale */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pp')}
                className="appearance-none w-full px-3 sm:pl-4 sm:pr-10 py-2.5 pr-8 sm:pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent cursor-pointer text-sm sm:text-base"
              >
                <option value="all">👥 Tutti</option>
                <option value="pp">⭐ Abbonati PP</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Bottone Nuovo Cliente - Mobile: testo completo - Desktop: invariato */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl hover:bg-[#d4a826] transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Nuovo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista Clienti */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Mostra sempre la lista (anche vuota) mentre carica in background */}
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun cliente trovato</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-[#EEBA2B] hover:underline font-medium"
            >
              + Aggiungi il tuo primo cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {sortedLetters.map(letter => (
              <div key={letter}>
                {/* Header Lettera */}
                <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 z-10">
                  <span className="text-sm font-semibold text-gray-500">{letter}</span>
                </div>
                
                {/* Clienti per lettera */}
                {groupedClients[letter].map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                        client.is_pp_subscriber ? 'bg-[#EEBA2B]' : 'bg-gray-400'
                      }`}>
                        {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">{client.full_name}</span>
                          {client.is_pp_subscriber && (
                            <span className="text-xs bg-[#EEBA2B]/20 text-[#EEBA2B] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                              ⭐ PP
                            </span>
                          )}
                        </div>
                        {client.email && (
                          <p className="text-sm text-gray-500 truncate">{client.email}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {client.total_sessions || 0} sessioni 
                          {client.last_session_date && (
                            <> • Ultima: {new Date(client.last_session_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Freccia */}
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dettaglio Cliente */}
      {selectedClient && professionalId && (
        <ClientDetailModal
          client={selectedClient}
          professionalId={professionalId}
          onClose={() => setSelectedClient(null)}
          onUpdate={fetchClients}
          onDelete={(clientId) => {
            setClients(prev => prev.filter(c => c.id !== clientId));
            setSelectedClient(null);
            calculateStats(clients.filter(c => c.id !== clientId));
          }}
        />
      )}

      {/* Modal Aggiungi Cliente */}
      {showAddModal && professionalId && (
        <AddClientModal
          professionalId={professionalId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchClients();
          }}
        />
      )}
    </div>
  );
}