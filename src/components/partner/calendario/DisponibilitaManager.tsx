import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Clock } from 'lucide-react';

interface TimeSlot {
  id?: string;
  start_time: string; // "09:00"
  end_time: string;   // "13:00"
}

interface DayAvailability {
  day_of_week: number;  // 0 = Domenica, 1 = Lunedì, ... 6 = Sabato
  day_name: string;     // "Lunedì"
  is_available: boolean;
  slots: TimeSlot[];
}

const DAYS: { day_of_week: number; name: string }[] = [
  { day_of_week: 1, name: 'Lunedì' },
  { day_of_week: 2, name: 'Martedì' },
  { day_of_week: 3, name: 'Mercoledì' },
  { day_of_week: 4, name: 'Giovedì' },
  { day_of_week: 5, name: 'Venerdì' },
  { day_of_week: 6, name: 'Sabato' },
  { day_of_week: 0, name: 'Domenica' },
];

export default function DisponibilitaManager() {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [saveTimeout, setSaveTimeout] = useState<{ [key: number]: NodeJS.Timeout }>({});

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, []);

  // Carica disponibilità quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]);

  const loadProfessionalId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: unknown) {
      console.error('Errore caricamento professional_id:', error);
      toast.error('Errore nel caricamento dei dati');
    }
  };

  const loadAvailability = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professionalId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;

      // Inizializza giorni: un giorno senza slot = giorno disattivato
      const loadedDays = DAYS.map(day => {
        const daySlots = data?.filter(slot => slot.day_of_week === day.day_of_week) || [];
        return {
          day_of_week: day.day_of_week,
          day_name: day.name,
          is_available: daySlots.length > 0, // Se ci sono slot = attivo
          slots: daySlots.map(slot => ({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time
          }))
        };
      });

      setAvailability(loadedDays);
    } catch (error: unknown) {
      console.error('Errore caricamento disponibilità:', error);
      toast.error('Errore nel caricamento della disponibilità');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = async (dayOfWeek: number) => {
    if (!professionalId) {
      toast.error('Professional ID non disponibile');
      return;
    }

    const day = availability.find(d => d.day_of_week === dayOfWeek);
    if (!day) return;

    const newIsAvailable = !day.is_available;

    // Aggiorna UI immediatamente
    setAvailability(prev => prev.map(d => {
      if (d.day_of_week === dayOfWeek) {
        return {
          ...d,
          is_available: newIsAvailable,
          slots: newIsAvailable && d.slots.length === 0
            ? [{ start_time: '09:00', end_time: '18:00' }]
            : d.slots
        };
      }
      return d;
    }));

    try {
      setSaving(prev => ({ ...prev, [dayOfWeek]: true }));

      // Se toggle OFF, elimina TUTTI gli slot del giorno dal database IMMEDIATAMENTE
      if (!newIsAvailable) {
        const { error } = await supabase
          .from('professional_availability')
          .delete()
          .eq('professional_id', professionalId)
          .eq('day_of_week', dayOfWeek);

        if (error) throw error;
        toast.success('Giorno disattivato');
      } 
      // Se toggle ON, salva subito lo slot default
      else {
        const defaultSlot = { start_time: '09:00', end_time: '18:00' };
        
        // Se ci sono già slot, li mantieni (non inserire default)
        const currentDay = availability.find(d => d.day_of_week === dayOfWeek);
        if (currentDay && currentDay.slots.length === 0) {
          // Inserisci slot default solo se non ci sono slot esistenti
          const { error } = await supabase
            .from('professional_availability')
            .insert({
              professional_id: professionalId,
              day_of_week: dayOfWeek,
              start_time: defaultSlot.start_time,
              end_time: defaultSlot.end_time,
              is_available: true
            });

          if (error) throw error;

          // Aggiorna UI con ID del nuovo slot
          const { data: insertedData } = await supabase
            .from('professional_availability')
            .select('id')
            .eq('professional_id', professionalId)
            .eq('day_of_week', dayOfWeek)
            .eq('start_time', defaultSlot.start_time)
            .eq('end_time', defaultSlot.end_time)
            .single();

          if (insertedData) {
            setAvailability(prev => prev.map(d => {
              if (d.day_of_week === dayOfWeek) {
                return {
                  ...d,
                  slots: d.slots.map((slot, index) => 
                    index === 0 && !slot.id ? { ...slot, id: insertedData.id } : slot
                  )
                };
              }
              return d;
            }));
          }

          toast.success('Giorno attivato');
        }
      }
    } catch (error: unknown) {
      console.error('Errore salvataggio toggle:', error);
      toast.error('Errore nel salvataggio');
      
      // Rollback UI in caso di errore
      setAvailability(prev => prev.map(d => 
        d.day_of_week === dayOfWeek ? { ...d, is_available: !newIsAvailable } : d
      ));
    } finally {
      setSaving(prev => ({ ...prev, [dayOfWeek]: false }));
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setAvailability(prev => prev.map(day => {
      if (day.day_of_week === dayOfWeek) {
        const lastSlot = day.slots[day.slots.length - 1];
        let newStartTime = '09:00';
        
        if (lastSlot) {
          // Prendi l'orario fine dell'ultimo slot e aggiungi 1 ora
          const [hours, minutes] = lastSlot.end_time.split(':').map(Number);
          const newHour = (hours + 1) % 24;
          newStartTime = `${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        const newEndTime = (() => {
          const [hours] = newStartTime.split(':').map(Number);
          const endHour = (hours + 4) % 24; // Default 4 ore dopo
          return `${String(endHour).padStart(2, '0')}:00`;
        })();

        return {
          ...day,
          slots: [...day.slots, { start_time: newStartTime, end_time: newEndTime }]
        };
      }
      return day;
    }));

    scheduleSave(dayOfWeek);
  };

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => prev.map(day => {
      if (day.day_of_week === dayOfWeek) {
        const updatedSlots = [...day.slots];
        const slot = updatedSlots[slotIndex];
        
        // Validazione: end_time deve essere > start_time
        if (field === 'end_time' && value <= slot.start_time) {
          toast.error('L\'orario di fine deve essere maggiore dell\'orario di inizio');
          return day;
        }
        if (field === 'start_time' && value >= slot.end_time) {
          toast.error('L\'orario di inizio deve essere minore dell\'orario di fine');
          return day;
        }

        updatedSlots[slotIndex] = { ...slot, [field]: value };
        
        // Validazione sovrapposizioni
        if (hasOverlappingSlots(updatedSlots)) {
          toast.error('Le fasce orarie non possono sovrapporsi');
          return day;
        }

        return { ...day, slots: updatedSlots };
      }
      return day;
    }));

    scheduleSave(dayOfWeek);
  };

  const hasOverlappingSlots = (slots: TimeSlot[]): boolean => {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];
        
        // Controlla se si sovrappongono
        if (
          (slot1.start_time < slot2.end_time && slot1.end_time > slot2.start_time) ||
          (slot2.start_time < slot1.end_time && slot2.end_time > slot1.start_time)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setAvailability(prev => prev.map(day => {
      if (day.day_of_week === dayOfWeek) {
        return {
          ...day,
          slots: day.slots.filter((_, index) => index !== slotIndex)
        };
      }
      return day;
    }));

    scheduleSave(dayOfWeek);
  };

  const scheduleSave = (dayOfWeek: number) => {
    // Cancella timeout precedente se esiste
    if (saveTimeout[dayOfWeek]) {
      clearTimeout(saveTimeout[dayOfWeek]);
    }

    // Imposta nuovo timeout
    const timeout = setTimeout(() => {
      saveAvailability(dayOfWeek);
    }, 500);

    setSaveTimeout(prev => ({ ...prev, [dayOfWeek]: timeout }));
  };

  const saveAvailability = async (dayOfWeek: number) => {
    if (!professionalId) return;

    const day = availability.find(d => d.day_of_week === dayOfWeek);
    if (!day) return;

    try {
      setSaving(prev => ({ ...prev, [dayOfWeek]: true }));

      // Elimina vecchi slot del giorno
      await supabase
        .from('professional_availability')
        .delete()
        .eq('professional_id', professionalId)
        .eq('day_of_week', dayOfWeek);

      // Inserisci nuovi slot solo se il giorno è attivo e ha slot
      if (day.is_available && day.slots.length > 0) {
        const slotsToInsert = day.slots.map(slot => ({
          professional_id: professionalId,
          day_of_week: dayOfWeek,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true
        }));

        const { error: insertError } = await supabase
          .from('professional_availability')
          .insert(slotsToInsert);

        if (insertError) throw insertError;
      }

      // Aggiorna gli ID dei nuovi slot (per riferimento futuro)
      if (day.is_available && day.slots.length > 0) {
        const { data: insertedData } = await supabase
          .from('professional_availability')
          .select('id, start_time, end_time')
          .eq('professional_id', professionalId)
          .eq('day_of_week', dayOfWeek)
          .order('start_time');

        if (insertedData) {
          setAvailability(prev => prev.map(d => {
            if (d.day_of_week === dayOfWeek) {
              return {
                ...d,
                slots: d.slots.map((slot, index) => ({
                  ...slot,
                  id: insertedData[index]?.id
                }))
              };
            }
            return d;
          }));
        }
      }

      // Silenzioso, non mostrare toast per ogni save automatico
    } catch (error: unknown) {
      console.error('Errore salvataggio disponibilità:', error);
      toast.error('Errore nel salvataggio della disponibilità');
    } finally {
      setSaving(prev => ({ ...prev, [dayOfWeek]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEBA2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Disponibilità Settimanale</h2>
        <p className="text-gray-500 text-sm">
          Imposta quando sei disponibile per ricevere prenotazioni
        </p>
      </div>

      {availability.map(day => (
        <div
          key={day.day_of_week}
          className={`bg-white rounded-xl border ${
            day.is_available
              ? 'border-l-4 border-l-[#EEBA2B] border-gray-200'
              : 'border-gray-200 bg-gray-50 opacity-60'
          } p-4 transition-all`}
        >
          {/* Header giorno con toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">{day.day_name}</h3>
              {saving[day.day_of_week] && (
                <span className="text-xs text-gray-400">Salvataggio...</span>
              )}
            </div>
            {/* Toggle stile Apple - sottile */}
            <button
              onClick={() => toggleDay(day.day_of_week)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:ring-offset-2
                ${day.is_available ? 'bg-[#EEBA2B]' : 'bg-gray-300'}
              `}
              aria-label={`${day.is_available ? 'Disattiva' : 'Attiva'} ${day.day_name}`}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out
                  ${day.is_available ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Slot orari */}
          {day.is_available ? (
            <div className="space-y-3">
              {day.slots.length > 0 ? (
                day.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateTimeSlot(day.day_of_week, index, 'start_time', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateTimeSlot(day.day_of_week, index, 'end_time', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => removeTimeSlot(day.day_of_week, index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rimuovi fascia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">
                  Nessuna fascia oraria impostata
                </p>
              )}

              <button
                onClick={() => addTimeSlot(day.day_of_week)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-[#EEBA2B] hover:bg-[#EEBA2B]/10 rounded-lg border border-[#EEBA2B]/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Aggiungi fascia oraria
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Giorno non disponibile - attiva il toggle per impostare gli orari
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

