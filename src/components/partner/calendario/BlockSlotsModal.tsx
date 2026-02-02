import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { availabilityOverrideService } from '@/services/availabilityOverrideService';

const BLOCK_REASONS = [
  { value: '', label: 'Motivo (opzionale)' },
  { value: 'visita_medica', label: 'Visita medica' },
  { value: 'ferie', label: 'Ferie' },
  { value: 'impegno_personale', label: 'Impegno personale' },
  { value: 'formazione', label: 'Formazione/Corso' },
  { value: 'altro', label: 'Altro' },
];

function formatDateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface BlockSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  /** Data preselezionata (es. dal click sul calendario) */
  initialDate?: Date | null;
  onBlockCreated?: () => void;
}

export function BlockSlotsModal({
  isOpen,
  onClose,
  professionalId,
  initialDate = null,
  onBlockCreated,
}: BlockSlotsModalProps) {
  const today = formatDateToString(new Date());
  const [overrideDate, setOverrideDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialDate) {
      setOverrideDate(formatDateToString(initialDate));
    } else if (isOpen) {
      setOverrideDate(today);
    }
  }, [isOpen, initialDate, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error('L\'orario di fine deve essere dopo l\'orario di inizio');
      return;
    }
    setSaving(true);
    try {
      await availabilityOverrideService.blockSlots(professionalId, {
        override_date: overrideDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason || undefined,
      });
      toast.success('Fascia oraria bloccata');
      onBlockCreated?.();
      onClose();
    } catch (err) {
      console.error('Errore blocco ore:', err);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/80">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#EEBA2B]" />
            Blocca ore
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Indica data e fascia oraria da rendere non disponibile per le prenotazioni.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={overrideDate}
                min={today}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ora inizio
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ora fine
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo (opzionale)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
            >
              {BLOCK_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#EEBA2B] text-black rounded-xl font-medium hover:bg-[#EEBA2B]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : 'Blocca ore'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
