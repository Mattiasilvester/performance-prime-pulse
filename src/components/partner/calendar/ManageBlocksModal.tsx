import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { 
  X, 
  Plus, 
  List, 
  Calendar, 
  Trash2, 
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { blockedPeriodsService } from '@/services/blockedPeriodsService';
import type { BlockedPeriod, BlockType } from '@/types/blocked-periods';

// =============================================
// COSTANTI
// =============================================

const BLOCK_REASONS = [
  { value: '', label: 'Seleziona motivo (opzionale)' },
  { value: 'ferie', label: 'Ferie' },
  { value: 'malattia', label: 'Malattia' },
  { value: 'impegno_personale', label: 'Impegno personale' },
  { value: 'formazione', label: 'Formazione/Corso' },
  { value: 'festivita', label: 'Festività' },
  { value: 'altro', label: 'Altro' },
];

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Converte Date in stringa YYYY-MM-DD senza problemi di timezone
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatta una data in italiano
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00'); // Aggiungi time per evitare problemi timezone
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formatta una data breve
 */
const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Ottieni il Lunedì di una settimana data una data qualsiasi
 */
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

/**
 * Genera lista di settimane future (per week picker)
 */
const generateWeekOptions = (weeksCount: number = 12): { start: Date; end: Date; label: string }[] => {
  const weeks = [];
  const today = new Date();
  let monday = getMondayOfWeek(today);

  for (let i = 0; i < weeksCount; i++) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    weeks.push({
      start: new Date(monday),
      end: new Date(sunday),
      label: `${formatDateShort(formatDateToString(monday))} - ${formatDateShort(formatDateToString(sunday))} ${sunday.getFullYear()}`,
    });

    monday = new Date(monday);
    monday.setDate(monday.getDate() + 7);
  }

  return weeks;
};

/**
 * Formatta il range di date per display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;
    }
    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)} ${end.getFullYear()}`;
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Ottieni label per il tipo di blocco
 */
const getBlockTypeLabel = (blockType: BlockType): string => {
  return blockType === 'day' ? 'Giorno singolo' : 'Settimana';
};

/**
 * Ottieni label per il motivo
 */
const getReasonLabel = (reason: string | null): string => {
  if (!reason) return '';
  const found = BLOCK_REASONS.find(r => r.value === reason);
  return found ? found.label : reason;
};

// =============================================
// COMPONENTI INTERNI
// =============================================

/**
 * Tab Button
 */
const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2
      ${active 
        ? 'bg-[#EEBA2B] text-black' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }
    `}
  >
    {children}
  </button>
);

/**
 * Date Picker semplice (per blocco giorno)
 */
const SimpleDatePicker = ({
  selectedDate,
  onSelect,
  minDate,
  blockedDates = [],
}: {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  minDate?: string;
  blockedDates?: string[];
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateToString(date);
    
    if (minDate && dateStr < minDate) return;
    
    onSelect(dateStr);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return formatDateToString(date) === selectedDate;
  };

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return formatDateToString(date) < minDate;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isBlocked = (day: number) => {
    if (blockedDates.length === 0) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateToString(date);
    return blockedDates.includes(dateStr);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-gray-800 capitalize">{monthYear}</span>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day && (
              <button
                onClick={() => handleDayClick(day)}
                disabled={isDisabled(day) || isBlocked(day)}
                className={`
                  w-full h-full rounded-lg text-sm font-medium transition-all
                  flex flex-col items-center justify-center gap-0.5
                  ${isSelected(day) 
                    ? 'bg-red-500 text-white' 
                    : isBlocked(day)
                      ? 'bg-red-100 text-red-600 cursor-not-allowed'
                      : isToday(day)
                        ? 'bg-[#EEBA2B]/20 text-[#EEBA2B] font-bold'
                        : isDisabled(day)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                <span>{day}</span>
                {isBlocked(day) && !isSelected(day) && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Week Picker (per blocco settimana)
 */
const WeekPicker = ({
  selectedWeek,
  onSelect,
}: {
  selectedWeek: { start: string; end: string } | null;
  onSelect: (start: string, end: string) => void;
}) => {
  const weeks = generateWeekOptions(12);

  return (
    <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
      <div className="space-y-2">
        {weeks.map((week, index) => {
          const startStr = formatDateToString(week.start);
          const endStr = formatDateToString(week.end);
          const isSelected = selectedWeek?.start === startStr && selectedWeek?.end === endStr;

          return (
            <button
              key={index}
              onClick={() => onSelect(startStr, endStr)}
              className={`
                w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3
                ${isSelected
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isSelected ? 'border-white' : 'border-gray-400'}
              `}>
                {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="font-medium">{week.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Blocked Period Card (lista blocchi attivi)
 */
const BlockedPeriodCard = ({
  block,
  onDelete,
  deleting,
}: {
  block: BlockedPeriod;
  onDelete: (id: string) => void;
  deleting: boolean;
}) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
    <div className="flex items-center gap-3">
      <Calendar className="w-5 h-5 text-gray-600" />
      <div>
        <p className="font-medium text-gray-800">
          {formatDateRange(block.start_date, block.end_date)}
        </p>
        <p className="text-sm text-gray-500">
          {getBlockTypeLabel(block.block_type)}
          {block.reason && ` • ${getReasonLabel(block.reason)}`}
        </p>
      </div>
    </div>
    <button
      onClick={() => onDelete(block.id)}
      disabled={deleting}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      title="Rimuovi blocco"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
);

// =============================================
// COMPONENTE PRINCIPALE
// =============================================

interface ManageBlocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  currentView: 'day' | 'week'; // Vista attuale del calendario (giorno o settimana)
  onBlocksChanged?: () => void; // Callback per aggiornare il calendario
}

export const ManageBlocksModal = ({
  isOpen,
  onClose,
  professionalId,
  currentView,
  onBlocksChanged,
}: ManageBlocksModalProps) => {
  // State
  const [activeTab, setActiveTab] = useState<'block' | 'list'>('block');
  const [blocks, setBlocks] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  // Form state per blocco giorno
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Form state per blocco settimana
  const [selectedWeek, setSelectedWeek] = useState<{ start: string; end: string } | null>(null);
  
  // Motivo comune
  const [reason, setReason] = useState('');

  // Fetch blocchi esistenti
  useEffect(() => {
    if (isOpen && professionalId) {
      fetchBlocks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchBlocks stable, avoid re-fetch on fn identity
  }, [isOpen, professionalId]);

  // Reset form quando si cambia tab o si apre modal
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(null);
      setSelectedWeek(null);
      setReason('');
    }
  }, [isOpen, activeTab]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await blockedPeriodsService.getByProfessional(professionalId);
      setBlocks(data);
    } catch (error) {
      console.error('Errore fetch blocchi:', error);
      toast.error('Errore nel caricamento dei blocchi');
    } finally {
      setLoading(false);
    }
  };

  // Espandi tutti i blocchi in un array di date bloccate
  const blockedDates = blocks.reduce((acc: string[], block) => {
    // Parsing sicuro: aggiungi 'T00:00:00' per evitare problemi timezone
    const start = new Date(block.start_date + 'T00:00:00');
    const end = new Date(block.end_date + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      acc.push(formatDateToString(d));
    }
    
    return acc;
  }, []);

  // Funzione helper per verificare se una data è bloccata
  const isDateBlocked = (date: string | Date): boolean => {
    const dateStr = typeof date === 'string' ? date : formatDateToString(date);
    return blockedDates.includes(dateStr);
  };

  const handleBlockDay = async () => {
    if (!selectedDate) {
      toast.error('Seleziona un giorno da bloccare');
      return;
    }

    setSaving(true);
    try {
      await blockedPeriodsService.blockDay(professionalId, selectedDate, reason || undefined);
      toast.success('Giorno bloccato con successo!');
      setSelectedDate(null);
      setReason('');
      await fetchBlocks();
      onBlocksChanged?.();
    } catch (error) {
      console.error('Errore blocco giorno:', error);
      toast.error('Errore durante il blocco del giorno');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockWeek = async () => {
    if (!selectedWeek) {
      toast.error('Seleziona una settimana da bloccare');
      return;
    }

    setSaving(true);
    try {
      await blockedPeriodsService.blockWeek(professionalId, selectedWeek.start, reason || undefined);
      toast.success('Settimana bloccata con successo!');
      setSelectedWeek(null);
      setReason('');
      await fetchBlocks();
      onBlocksChanged?.();
    } catch (error) {
      console.error('Errore blocco settimana:', error);
      toast.error('Errore durante il blocco della settimana');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setBlockToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blockToDelete) return;

    setDeleting(true);
    try {
      await blockedPeriodsService.delete(blockToDelete);
      toast.success('Blocco rimosso');
      await fetchBlocks();
      onBlocksChanged?.();
      setShowDeleteConfirm(false);
      setBlockToDelete(null);
    } catch (error) {
      console.error('Errore eliminazione blocco:', error);
      toast.error('Errore durante la rimozione del blocco');
    } finally {
      setDeleting(false);
    }
  };

  // Oggi come data minima selezionabile
  const today = formatDateToString(new Date());

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Ban className="w-6 h-6 text-red-500" />
            Gestisci Blocchi
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-100">
          <TabButton 
            active={activeTab === 'block'} 
            onClick={() => setActiveTab('block')}
          >
            <Plus className="w-4 h-4" />
            Blocca
          </TabButton>
          <TabButton 
            active={activeTab === 'list'} 
            onClick={() => setActiveTab('list')}
          >
            <List className="w-4 h-4" />
            Blocchi Attivi ({blocks.length})
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB: BLOCCA */}
          {activeTab === 'block' && (
            <div className="space-y-5">
              
              {/* Blocco Giorno */}
              {currentView === 'day' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Blocca un giorno
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Seleziona la data che vuoi rendere non disponibile per le prenotazioni.
                    </p>
                  </div>

                  <SimpleDatePicker
                    selectedDate={selectedDate}
                    onSelect={setSelectedDate}
                    minDate={today}
                    blockedDates={blockedDates}
                  />

                  {selectedDate && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-700">
                        <strong>Data selezionata:</strong> {formatDate(selectedDate)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo (opzionale)
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
                    >
                      {BLOCK_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleBlockDay}
                    disabled={!selectedDate || saving}
                    className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Ban className="w-5 h-5" />
                        Blocca Giorno Selezionato
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Blocco Settimana */}
              {currentView === 'week' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Blocca una settimana
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Seleziona la settimana che vuoi rendere non disponibile per le prenotazioni.
                    </p>
                  </div>

                  <WeekPicker
                    selectedWeek={selectedWeek}
                    onSelect={(start, end) => setSelectedWeek({ start, end })}
                  />

                  {selectedWeek && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-700">
                        <strong>Settimana selezionata:</strong> {formatDateShort(selectedWeek.start)} - {formatDateShort(selectedWeek.end)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo (opzionale)
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none bg-white text-gray-900"
                    >
                      {BLOCK_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleBlockWeek}
                    disabled={!selectedWeek || saving}
                    className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Ban className="w-5 h-5" />
                        Blocca Settimana Selezionata
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB: BLOCCHI ATTIVI */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  I tuoi blocchi attivi
                </h3>
                <p className="text-sm text-gray-500">
                  Questi periodi non sono disponibili per le prenotazioni.
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Caricamento...
                </div>
              ) : blocks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">Nessun blocco attivo</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Non hai ancora bloccato nessun giorno o settimana.<br />
                    Usa la tab "Blocca" per aggiungere un blocco.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map(block => (
                    <BlockedPeriodCard
                      key={block.id}
                      block={block}
                      onDelete={handleDeleteClick}
                      deleting={deleting}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Chiudi
          </button>
        </div>
      </div>

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 animate-fadeIn" />
          
          {/* Dialog */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icona */}
            <div className="pt-6 pb-2 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            {/* Contenuto */}
            <div className="px-6 pb-4 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rimuovere questo blocco?
              </h3>
              <p className="text-gray-500">
                Questa azione non può essere annullata. Il periodo bloccato verrà rimosso e sarà nuovamente disponibile per le prenotazioni.
              </p>
            </div>
            
            {/* Bottoni */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setBlockToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Eliminazione...
                  </>
                ) : (
                  'Rimuovi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ManageBlocksModal;
