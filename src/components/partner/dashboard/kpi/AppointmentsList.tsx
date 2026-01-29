import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { AppointmentCard } from './AppointmentCard';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: BookingStatus;
  notes?: string;
  client_name?: string;
  client_email?: string;
  service_name?: string;
}

interface AppointmentsListProps {
  appointments: Booking[];
  filter: FilterType;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onCancel: (id: string) => void;
  isLoading?: boolean;
  cancellingId?: string | null;
}

const ITEMS_PER_PAGE = 10;

const filterLabels: Record<FilterType, string> = {
  all: 'Tutti',
  pending: 'In Attesa',
  confirmed: 'Confermati',
  completed: 'Completati',
  cancelled: 'Cancellati',
};

export function AppointmentsList({
  appointments,
  filter,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
  isLoading = false,
  cancellingId = null,
}: AppointmentsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'confirm' | 'complete' | null>(null);

  const filteredAppointments =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
    const dateB = new Date(`${b.booking_date}T${b.booking_time}`);

    if (filter === 'completed' || filter === 'cancelled') {
      return dateB.getTime() - dateA.getTime();
    }
    return dateA.getTime() - dateB.getTime();
  });

  const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = sortedAppointments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleConfirm = async (id: string) => {
    setLoadingId(id);
    setLoadingAction('confirm');
    try {
      await onConfirm(id);
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const handleComplete = async (id: string) => {
    setLoadingId(id);
    setLoadingAction('complete');
    try {
      await onComplete(id);
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#EEBA2B]" />
          <h3 className="font-semibold text-gray-900">Appuntamenti {filterLabels[filter]}</h3>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-sm">
            {filteredAppointments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Chiudi lista"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Nessun appuntamento {filterLabels[filter].toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onConfirm={handleConfirm}
                onComplete={handleComplete}
                onCancel={onCancel}
                isConfirming={loadingId === appointment.id && loadingAction === 'confirm'}
                isCompleting={loadingId === appointment.id && loadingAction === 'complete'}
                isCancelling={cancellingId === appointment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Precedente
          </button>

          <span className="text-sm text-gray-500">
            Pagina {currentPage} di {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Successivo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
