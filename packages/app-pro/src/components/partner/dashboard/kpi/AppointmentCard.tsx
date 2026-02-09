import {
  Calendar,
  Clock,
  User,
  Mail,
  Tag,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  getDisplayStatus,
  bookingDisplayStatusConfig,
  type BookingDisplayStatus,
} from '@/utils/bookingHelpers';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentCardProps {
  appointment: {
    id: string;
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    status: BookingStatus;
    notes?: string;
    client_name?: string;
    client_email?: string;
    service_name?: string;
  };
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isConfirming?: boolean;
  isCompleting?: boolean;
  isCancelling?: boolean;
}

export function AppointmentCard({
  appointment,
  onConfirm,
  onComplete,
  onCancel,
  isConfirming = false,
  isCompleting = false,
  isCancelling = false,
}: AppointmentCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const displayStatus: BookingDisplayStatus = getDisplayStatus({
    status: appointment.status,
    booking_date: appointment.booking_date,
  });
  const statusConfig = bookingDisplayStatusConfig[displayStatus];

  const getStatusBadge = () => (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}
    >
      {statusConfig.label}
    </span>
  );

  const getClientInfo = () => {
    let clientName = appointment.client_name ?? 'Cliente';
    let clientEmail = appointment.client_email ?? '';
    let serviceName = appointment.service_name ?? '';

    if (appointment.notes) {
      try {
        const parsed = JSON.parse(appointment.notes) as {
          client_name?: string;
          client_email?: string;
          service_type?: string;
        };
        clientName = parsed.client_name ?? clientName;
        clientEmail = parsed.client_email ?? clientEmail;
        serviceName = parsed.service_type ?? serviceName;
      } catch {
        // notes is not JSON, use as is
      }
    }

    return { clientName, clientEmail, serviceName };
  };

  const { clientName, clientEmail, serviceName } = getClientInfo();
  const canConfirm = appointment.status === 'pending' && onConfirm;
  const canComplete = appointment.status === 'confirmed' && onComplete;
  const canCancel =
    (appointment.status === 'pending' || appointment.status === 'confirmed') &&
    onCancel;
  const isAnyLoading = isConfirming || isCompleting || isCancelling;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Info Section */}
        <div className="flex-1 space-y-3">
          {/* Date and Time */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-4 h-4 text-[#EEBA2B]" />
              <span className="font-medium">{formatDate(appointment.booking_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {formatTime(appointment.booking_time)} -{' '}
                {getEndTime(appointment.booking_time, appointment.duration_minutes)}
                <span className="text-gray-400 ml-1">
                  ({appointment.duration_minutes} min)
                </span>
              </span>
            </div>
          </div>

          {/* Client Info */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{clientName}</span>
            </div>
            {clientEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-sm">{clientEmail}</span>
              </div>
            )}
          </div>

          {/* Service */}
          {serviceName && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 text-sm">{serviceName}</span>
            </div>
          )}
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {getStatusBadge()}

          {(canConfirm || canComplete || canCancel) && (
            <div className="flex items-center gap-2">
              {canConfirm && (
                <button
                  onClick={() => onConfirm?.(appointment.id)}
                  disabled={isAnyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Conferma
                </button>
              )}

              {canComplete && (
                <button
                  onClick={() => onComplete?.(appointment.id)}
                  disabled={isAnyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Completa
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => onCancel?.(appointment.id)}
                  disabled={isAnyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-red-50 text-red-500 border border-red-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancella
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
