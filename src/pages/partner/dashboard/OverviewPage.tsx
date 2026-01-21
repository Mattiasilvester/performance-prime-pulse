import { Users, Calendar, FolderKanban, Euro, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function OverviewPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('Professionista');
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Inizia a false per mostrare UI subito
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
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun appuntamento in programma</p>
        </div>
      </div>

      {/* Attività Recenti */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Attività recenti
        </h2>
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessuna attività recente</p>
        </div>
      </div>
    </div>
  );
}

