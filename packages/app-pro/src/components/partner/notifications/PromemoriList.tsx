import { useState, useEffect, useCallback } from 'react';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getUpcomingScheduledNotifications,
  removeScheduledNotification,
  type ScheduledNotification,
} from '@/services/scheduledNotificationService';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import { ScheduleNotificationModal } from '@/components/partner/notifications/ScheduleNotificationModal';

function formatScheduledAt(scheduledFor: string | Date): string {
  const d = new Date(scheduledFor);
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PromemoriListProps {
  /** Incrementare per forzare refetch (es. dopo creazione da Overview) */
  refreshTrigger?: number;
}

export function PromemoriList({ refreshTrigger = 0 }: PromemoriListProps) {
  const professionalId = useProfessionalId();
  const [list, setList] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!professionalId) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getUpcomingScheduledNotifications(professionalId);
      setList(data);
    } catch (err) {
      console.error('Errore caricamento promemoria:', err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    fetchList();
  }, [fetchList, refreshTrigger]);

  const handleEdit = (item: ScheduledNotification) => {
    setEditingNotification(item);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Eliminare questo promemoria?');
    if (!ok) return;
    setDeletingId(id);
    try {
      await removeScheduledNotification(id);
      setList((prev) => prev.filter((o) => o.id !== id));
      toast.success('Promemoria eliminato');
    } catch (err) {
      console.error('Errore eliminazione promemoria:', err);
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    fetchList();
    setEditingNotification(null);
  };

  if (!professionalId) return null;

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Promemoria in programma
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Nessun promemoria in programma.</p>
        ) : (
          <div className="space-y-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100"
              >
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#EEBA2B]/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#EEBA2B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                  <p className="text-sm text-gray-600 truncate">{item.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatScheduledAt(item.scheduled_for)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="flex items-center justify-center w-9 h-9 shrink-0 text-gray-500 hover:text-[#EEBA2B] hover:bg-[#EEBA2B]/10 rounded-lg transition-colors"
                    title="Modifica"
                    aria-label="Modifica"
                  >
                    <Pencil className="w-4 h-4 flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id!)}
                    disabled={deletingId === item.id}
                    className="flex items-center justify-center w-9 h-9 shrink-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Elimina"
                    aria-label="Elimina"
                  >
                    {deletingId === item.id ? (
                      <span className="w-4 h-4 block rounded-full border-2 border-red-500 border-t-transparent animate-spin flex-shrink-0" />
                    ) : (
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScheduleNotificationModal
        isOpen={!!editingNotification}
        onClose={() => setEditingNotification(null)}
        onSuccess={handleEditSuccess}
        existingNotification={editingNotification ?? undefined}
      />
    </>
  );
}
