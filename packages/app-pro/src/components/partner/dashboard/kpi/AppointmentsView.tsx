import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayStatus } from '@/utils/bookingHelpers';
import { KPIViewHeader } from './KPIViewHeader';
import { KPIPieChart, KPIBarChart } from './charts';
import { AppointmentsList, type Booking, type BookingStatus } from './AppointmentsList';
import { CancelConfirmModal } from './CancelConfirmModal';

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'incomplete' | null;

interface AppointmentsData {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  incomplete: number;
  completedPercent: number;
  monthlyTrend: Array<{ name: string; value: number }>;
}

interface AppointmentsViewProps {
  data: AppointmentsData;
  onBack: () => void;
  professionalId: string | null;
  onDataChange?: () => void;
}

export function AppointmentsView({
  data,
  onBack,
  professionalId,
  onDataChange,
}: AppointmentsViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(null);
  const [allAppointments, setAllAppointments] = useState<Booking[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{
    id: string;
    booking_date: string;
    booking_time: string;
    notes?: string;
    client_name?: string;
  } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const pieData = [
    { name: 'Completati', value: data.completed, color: '#22c55e' },
    { name: 'Cancellati', value: data.cancelled, color: '#ef4444' },
    { name: 'Non completati', value: data.incomplete ?? 0, color: '#f97316' },
    { name: 'In attesa', value: data.pending, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const fetchAllAppointments = async () => {
    if (!professionalId) return;

    setAppointmentsLoading(true);
    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startStr = firstDayThisMonth.toISOString().split('T')[0];
      const endStr = lastDayThisMonth.toISOString().split('T')[0];

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(
          'id, booking_date, booking_time, duration_minutes, status, notes, client_name, client_email, service_id'
        )
        .eq('professional_id', professionalId)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;

      const ids = [
        ...new Set(
          (bookingsData ?? [])
            .map((b) => b.service_id)
            .filter((id): id is string => Boolean(id))
        ),
      ];
      let servicesMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: services } = await supabase
          .from('professional_services')
          .select('id, name')
          .in('id', ids);
        if (services) {
          servicesMap = Object.fromEntries(
            services.map((s) => [s.id, s.name ?? ''])
          );
        }
      }

      const withServiceName: Booking[] = (bookingsData ?? []).map((b) => ({
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        duration_minutes: b.duration_minutes ?? 60,
        status: b.status as BookingStatus,
        notes: b.notes ?? undefined,
        client_name: b.client_name ?? undefined,
        client_email: b.client_email ?? undefined,
        service_name: b.service_id ? servicesMap[b.service_id] : undefined,
      }));

      setAllAppointments(withServiceName);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Errore nel caricamento degli appuntamenti');
      setAllAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFilter === null) return;
    if (professionalId) {
      fetchAllAppointments();
    } else {
      setAllAppointments([]);
      setAppointmentsLoading(false);
    }
  // Esegui fetch quando cambiano filtro o professionalId; fetchAllAppointments non in deps per evitare loop
  }, [selectedFilter, professionalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('✓ Appuntamento confermato!');
      await fetchAllAppointments();
      onDataChange?.();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error("Errore nella conferma dell'appuntamento");
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      toast.success('✓ Appuntamento completato!');
      await fetchAllAppointments();
      onDataChange?.();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error("Errore nel completamento dell'appuntamento");
    }
  };

  const handleCancelClick = (
    appointment: (typeof allAppointments)[0]
  ) => {
    setAppointmentToCancel({
      id: appointment.id,
      booking_date: appointment.booking_date,
      booking_time: appointment.booking_time,
      notes: appointment.notes,
      client_name: appointment.client_name,
    });
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!appointmentToCancel) return;

    setIsCancelling(true);
    try {
      const updateData: {
        status: string;
        cancelled_at: string;
        cancellation_reason?: string;
      } = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      };
      if (reason) updateData.cancellation_reason = reason;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', appointmentToCancel.id);

      if (error) throw error;

      toast.success('Appuntamento cancellato');
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
      await fetchAllAppointments();
      onDataChange?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error("Errore nella cancellazione dell'appuntamento");
    } finally {
      setIsCancelling(false);
    }
  };

  const getClientName = (apt: typeof appointmentToCancel) => {
    if (!apt) return 'Cliente';
    if (apt.client_name) return apt.client_name;
    if (apt.notes) {
      try {
        const parsed = JSON.parse(apt.notes) as { client_name?: string };
        return parsed.client_name ?? 'Cliente';
      } catch {
        return 'Cliente';
      }
    }
    return 'Cliente';
  };

  return (
    <div className="space-y-6">
      <KPIViewHeader title="Appuntamenti" onBack={onBack} />

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Distribuzione Stato
          </h3>
          <KPIPieChart data={pieData} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Trend Mensile (6 mesi)
          </h3>
          <KPIBarChart data={data.monthlyTrend} />
        </div>
      </div>

      {/* Card metriche (cliccabili/filtri) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() =>
            setSelectedFilter(selectedFilter === 'all' ? null : 'all')
          }
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all ${
            selectedFilter === 'all'
              ? 'border-2 border-[#EEBA2B] shadow-md'
              : 'border-gray-100 hover:border-[#EEBA2B]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Totale</p>
            <CalendarCheck className="w-5 h-5 text-[#EEBA2B]" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.total}</p>
        </div>

        <div
          onClick={() =>
            setSelectedFilter(
              selectedFilter === 'completed' ? null : 'completed'
            )
          }
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all ${
            selectedFilter === 'completed'
              ? 'border-2 border-[#EEBA2B] shadow-md'
              : 'border-gray-100 hover:border-[#EEBA2B]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Completati</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-500 mt-2">
            {data.completed}
          </p>
          <p className="text-sm text-gray-400">{data.completedPercent}%</p>
        </div>

        <div
          onClick={() =>
            setSelectedFilter(
              selectedFilter === 'cancelled' ? null : 'cancelled'
            )
          }
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all ${
            selectedFilter === 'cancelled'
              ? 'border-2 border-[#EEBA2B] shadow-md'
              : 'border-gray-100 hover:border-[#EEBA2B]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Cancellati</p>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-500 mt-2">
            {data.cancelled}
          </p>
          <p className="text-sm text-gray-400">
            {data.total > 0
              ? Math.round((data.cancelled / data.total) * 100)
              : 0}
            %
          </p>
        </div>

        <div
          onClick={() =>
            setSelectedFilter(
              selectedFilter === 'incomplete' ? null : 'incomplete'
            )
          }
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all ${
            selectedFilter === 'incomplete'
              ? 'border-2 border-[#EEBA2B] shadow-md'
              : 'border-gray-100 hover:border-[#EEBA2B]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Non completati</p>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            {data.incomplete ?? 0}
          </p>
        </div>

        <div
          onClick={() =>
            setSelectedFilter(
              selectedFilter === 'pending' ? null : 'pending'
            )
          }
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all ${
            selectedFilter === 'pending'
              ? 'border-2 border-[#EEBA2B] shadow-md'
              : 'border-gray-100 hover:border-[#EEBA2B]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">In attesa</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-500 mt-2">
            {data.pending}
          </p>
        </div>
      </div>

      {/* Lista Appuntamenti */}
      {selectedFilter !== null && (
        <AppointmentsList
          appointments={allAppointments}
          filter={selectedFilter}
          onClose={() => setSelectedFilter(null)}
          onConfirm={handleConfirmAppointment}
          onComplete={handleCompleteAppointment}
          onCancel={(id) => {
            const apt = allAppointments.find((a) => a.id === id);
            if (apt) handleCancelClick(apt);
          }}
          isLoading={appointmentsLoading}
          cancellingId={isCancelling ? appointmentToCancel?.id ?? null : null}
        />
      )}

      {/* Modal Cancellazione */}
      {appointmentToCancel && (
        <CancelConfirmModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setAppointmentToCancel(null);
          }}
          onConfirm={handleCancelConfirm}
          appointmentInfo={{
            clientName: getClientName(appointmentToCancel),
            date: new Date(
              appointmentToCancel.booking_date + 'T00:00:00'
            ).toLocaleDateString('it-IT'),
            time: appointmentToCancel.booking_time?.substring(0, 5) ?? '',
          }}
          isLoading={isCancelling}
        />
      )}
    </div>
  );
}
