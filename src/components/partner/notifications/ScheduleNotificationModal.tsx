// Modal per creare notifiche programmate
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { createScheduledNotification } from '@/services/scheduledNotificationService';
import { useProfessionalId } from '@/hooks/useProfessionalId';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTitle?: string;
  defaultMessage?: string;
}

export function ScheduleNotificationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTitle = '',
  defaultMessage = ''
}: ScheduleNotificationModalProps) {
  const professionalId = useProfessionalId();
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calcola data/ora di default (domani alle 10:00)
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = tomorrow.toTimeString().split(' ')[0].substring(0, 5);
    
    return { date: dateStr, time: timeStr };
  };

  // Inizializza con valori di default quando si apre
  useEffect(() => {
    if (isOpen && !scheduledDate && !scheduledTime) {
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
    }
    // Reset form quando si chiude
    if (!isOpen) {
      setTitle(defaultTitle);
      setMessage(defaultMessage);
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- init only when modal opens; scheduledDate/scheduledTime intentionally omitted
  }, [isOpen, defaultTitle, defaultMessage]);

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

    setIsSaving(true);

    try {
      // Combina data e ora
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Verifica che sia nel futuro
      if (scheduledDateTime <= new Date()) {
        toast.error('La data e ora devono essere nel futuro');
        setIsSaving(false);
        return;
      }

      // Crea notifica programmata
      await createScheduledNotification({
        professional_id: professionalId,
        type: 'custom',
        title: title.trim(),
        message: message.trim(),
        scheduled_for: scheduledDateTime
      });

      toast.success('Notifica programmata creata con successo!');
      
      // Reset form
      setTitle('');
      setMessage('');
      const { date, time } = getDefaultDateTime();
      setScheduledDate(date);
      setScheduledTime(time);
      
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Errore creazione notifica programmata:', error);
      toast.error((error as Error)?.message || 'Errore nella creazione della notifica programmata');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        style={{ 
          width: '100%',
          maxWidth: '32rem',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: '24px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
              <Clock className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Crea Promemoria</h2>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Titolo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titolo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Ricorda di chiamare il cliente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
              required
              disabled={isSaving}
            />
          </div>

          {/* Messaggio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Messaggio *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es. Chiama Mario Rossi per follow-up"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none resize-none"
              required
              disabled={isSaving}
            />
          </div>

          {/* Data e Ora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ora *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 La notifica verrà inviata automaticamente alla data e ora specificata.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-[#EEBA2B] text-black font-semibold rounded-lg hover:bg-[#EEBA2B]/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Salvataggio...' : 'Crea Promemoria'}
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
