// Modal per creare o modificare notifiche programmate (promemoria)
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  createScheduledNotification,
  updateScheduledNotification,
  type ScheduledNotification,
} from '@/services/scheduledNotificationService';
import { createNotification } from '@/services/notificationService';
import { useProfessionalId } from '@/hooks/useProfessionalId';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTitle?: string;
  defaultMessage?: string;
  /** Se presente: modal in modalità modifica (precompila e bottone "Aggiorna promemoria") */
  existingNotification?: ScheduledNotification | null;
}

export function ScheduleNotificationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTitle = '',
  defaultMessage = '',
  existingNotification = null,
}: ScheduleNotificationModalProps) {
  const professionalId = useProfessionalId();
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = !!existingNotification?.id;

  // Calcola data/ora di default (domani alle 10:00)
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = tomorrow.toTimeString().split(' ')[0].substring(0, 5);
    return { date: dateStr, time: timeStr };
  };

  // Inizializza: in modifica precompila da existingNotification, altrimenti default
  useEffect(() => {
    if (!isOpen) return;
    if (existingNotification?.id) {
      setTitle(existingNotification.title);
      setMessage(existingNotification.message);
      const d = new Date(existingNotification.scheduled_for);
      setScheduledDate(d.toISOString().split('T')[0]);
      setScheduledTime(d.toTimeString().split(' ')[0].substring(0, 5));
    } else {
      setTitle(defaultTitle);
      setMessage(defaultMessage);
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
    }
  }, [isOpen, existingNotification?.id, existingNotification?.title, existingNotification?.message, existingNotification?.scheduled_for, defaultTitle, defaultMessage]);

  // Reset form quando si chiude
  useEffect(() => {
    if (!isOpen) {
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Seleziona data e ora per la notifica');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      toast.error('La data e ora devono essere nel futuro');
      return;
    }

    setIsSaving(true);

    try {
      if (isEdit && existingNotification?.id) {
        await updateScheduledNotification(existingNotification.id, {
          title: title.trim(),
          message: message.trim(),
          scheduled_for: scheduledDateTime,
        });
        await createNotification({
          professionalId,
          type: 'custom',
          title: 'Promemoria aggiornato',
          message: `Promemoria "${title.trim()}" aggiornato per il ${scheduledDate} alle ${scheduledTime}`,
        });
        toast.success('Promemoria aggiornato');
      } else {
        await createScheduledNotification({
          professional_id: professionalId,
          type: 'custom',
          title: title.trim(),
          message: message.trim(),
          scheduled_for: scheduledDateTime,
        });
        await createNotification({
          professionalId,
          type: 'custom',
          title: 'Promemoria creato',
          message: `Promemoria "${title.trim()}" programmato per il ${scheduledDate} alle ${scheduledTime}`,
        });
        toast.success('Promemoria creato con successo');
      }

      setTitle('');
      setMessage('');
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Errore salvataggio promemoria:', error);
      toast.error((error as Error)?.message || 'Errore nel salvataggio del promemoria');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[32rem] max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
              <Clock className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Modifica Promemoria' : 'Crea Promemoria'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Titolo */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titolo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Ricorda di chiamare il cliente"
              className="w-full min-w-0 px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
              required
              disabled={isSaving}
            />
          </div>

          {/* Messaggio */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Messaggio *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es. Chiama Mario Rossi per follow-up"
              rows={3}
              className="w-full min-w-0 px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none resize-none"
              required
              disabled={isSaving}
            />
          </div>

          {/* Data e Ora — stack su mobile, affiancati da sm */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                Data *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full min-w-0 px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
                required
                disabled={isSaving}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                Ora *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full min-w-0 px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-w-0">
            <p className="text-sm text-blue-800">
              💡 La notifica verrà inviata automaticamente alla data e ora specificata.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-w-[100px] flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-w-[100px] flex-1 px-4 py-2.5 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#EEBA2B]/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Salvataggio...' : isEdit ? 'Aggiorna promemoria' : 'Crea Promemoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}
