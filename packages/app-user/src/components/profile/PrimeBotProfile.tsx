import { useState, useEffect } from 'react';
import { Bot, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/onboardingService';
import {
  updateAllergies,
  updateHealthLimitations,
  updateOnboardingPreference,
  getAllergies,
  getSmartLimitationsCheck,
} from '@/services/primebotUserContextService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const OBIETTIVO_OPTIONS = [
  { value: 'massa', label: 'Aumentare massa muscolare' },
  { value: 'dimagrire', label: 'Dimagrire' },
  { value: 'resistenza', label: 'Migliorare resistenza' },
  { value: 'tonificare', label: 'Tonificare' },
];

const ALLERGIE_OPTIONS = [
  'Glutine', 'Lattosio', 'Uova', 'Frutta a guscio',
  'Arachidi', 'Pesce', 'Crostacei', 'Soia',
  'Sesamo', 'Sedano', 'Senape', 'Nichel',
];

const ZONE_EVITARE_OPTIONS = [
  'Schiena', 'Lombare', 'Cervicale', 'Spalla destra',
  'Spalla sinistra', 'Ginocchio destro', 'Ginocchio sinistro',
  'Anca', 'Caviglia', 'Polso', 'Gomito', 'Collo',
];

const borderClass = 'border-[rgba(255,255,255,0.06)]';
const cardBg = 'bg-[#16161A]';
const textMuted = 'text-[#8A8A96]';
const textPrimary = 'text-[#F0EDE8]';
const accent = '#EEBA2B';

export function PrimeBotProfile() {
  const { user } = useAuth();

  const [obiettivo, setObiettivo] = useState('');
  const [limitazioniFisiche, setLimitazioniFisiche] = useState('');
  const [zoneEvitare, setZoneEvitare] = useState<string[]>([]);
  const [allergie, setAllergie] = useState<string[]>([]);
  const [noteMediche, setNoteMediche] = useState('');
  const [lastModified, setLastModified] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [tempObiettivo, setTempObiettivo] = useState('');
  const [tempLimitazioni, setTempLimitazioni] = useState('');
  const [tempZone, setTempZone] = useState<string[]>([]);
  const [tempAllergie, setTempAllergie] = useState<string[]>([]);
  const [tempNote, setTempNote] = useState('');

  const [showZonaInput, setShowZonaInput] = useState(false);
  const [zonaInputValue, setZonaInputValue] = useState('');
  const [showAllergiaInput, setShowAllergiaInput] = useState(false);
  const [allergiaInputValue, setAllergiaInputValue] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [onboardingData, allergieData, limitCheck] = await Promise.all([
          onboardingService.loadOnboardingData(user.id),
          getAllergies(user.id),
          getSmartLimitationsCheck(user.id),
        ]);
        setObiettivo(onboardingData?.obiettivo ?? '');
        setLimitazioniFisiche(limitCheck.limitations ?? '');
        setZoneEvitare(limitCheck.zones ?? []);
        setAllergie(allergieData ?? []);
        setNoteMediche(limitCheck.medicalConditions ?? '');
        setLastModified(
          limitCheck.lastUpdated
            ? limitCheck.lastUpdated.toISOString()
            : null
        );
      } catch (err) {
        console.error('PrimeBotProfile load error:', err);
        toast.error('Errore nel caricamento del profilo PrimeBot.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleStartEdit = () => {
    setTempObiettivo(obiettivo);
    setTempLimitazioni(limitazioniFisiche);
    setTempZone([...zoneEvitare]);
    setTempAllergie([...allergie]);
    setTempNote(noteMediche);
    setShowZonaInput(false);
    setZonaInputValue('');
    setShowAllergiaInput(false);
    setAllergiaInputValue('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setShowZonaInput(false);
    setZonaInputValue('');
    setShowAllergiaInput(false);
    setAllergiaInputValue('');
    setIsEditing(false);
  };

  const removeChip = (value: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.filter((v) => v !== value));
  };

  const commitZonaInput = () => {
    const trimmed = zonaInputValue.trim();
    if (trimmed && !tempZone.includes(trimmed)) {
      setTempZone((prev) => [...prev, trimmed]);
    }
    setZonaInputValue('');
    setShowZonaInput(false);
  };

  const commitAllergiaInput = () => {
    const trimmed = allergiaInputValue.trim();
    if (trimmed && !tempAllergie.includes(trimmed)) {
      setTempAllergie((prev) => [...prev, trimmed]);
    }
    setAllergiaInputValue('');
    setShowAllergiaInput(false);
  };

  const handleSave = async () => {
    if (!user?.id || isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all([
        updateAllergies(user.id, tempAllergie),
        updateHealthLimitations(
          user.id,
          tempLimitazioni.trim().length > 0,
          tempLimitazioni.trim() || undefined,
          tempZone.length > 0 ? tempZone : undefined,
          tempNote.trim() || null
        ),
        updateOnboardingPreference(user.id, 'obiettivo', tempObiettivo),
      ]);
      setObiettivo(tempObiettivo);
      setLimitazioniFisiche(tempLimitazioni);
      setZoneEvitare(tempZone);
      setAllergie(tempAllergie);
      setNoteMediche(tempNote);
      setLastModified(new Date().toISOString());
      setIsEditing(false);
      toast.success('Profilo PrimeBot aggiornato! 🤖');
    } catch (err) {
      console.error('PrimeBotProfile save error:', err);
      toast.error('Errore nel salvataggio. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChip = (
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const formatLastModified = (iso: string | null): string => {
    if (!iso) return 'Mai aggiornato';
    const days = Math.floor(
      (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Aggiornato oggi';
    if (days === 1) return 'Aggiornato ieri';
    return `Aggiornato ${days} giorni fa`;
  };

  if (isLoading) {
    return (
      <div className={cn(cardBg, 'border rounded-2xl border-white/10 p-6')}>
        <div className={cn('text-center', textMuted)}>Caricamento profilo PrimeBot...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(cardBg, 'border rounded-2xl border-white/10 overflow-hidden p-6 font-[\'Outfit\',sans-serif]')}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: accent }} aria-hidden />
          <h3 className="text-base font-bold text-white">Profilo PrimeBot</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs', textMuted)}>
            {formatLastModified(lastModified)}
          </span>
          {!isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className={cn('text-sm gap-1.5', textPrimary)}
              aria-label="Modifica profilo PrimeBot"
            >
              <Pencil className="w-4 h-4" />
              Modifica
            </Button>
          )}
        </div>
      </div>

      {/* Disclaimer sempre visibile */}
      <div
        className={cn(
          'rounded-xl border border-white/10 bg-white/5 p-3 mb-4 text-xs',
          textMuted
        )}
      >
        ℹ️ Le informazioni qui salvate vengono usate da PrimeBot per personalizzare i tuoi piani di allenamento e nutrizione. Non sostituiscono il parere di un medico o professionista.
      </div>

      {/* Obiettivo */}
      <div className="mb-4">
        <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>
          Obiettivo fitness
        </label>
        {isEditing ? (
          <select
            value={tempObiettivo}
            onChange={(e) => setTempObiettivo(e.target.value)}
            className={cn(
              'w-full rounded-lg border bg-[#1E1E24] px-3 py-2 text-sm',
              textPrimary,
              borderClass
            )}
          >
            <option value="">Non specificato</option>
            {OBIETTIVO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <p className={cn('text-sm', obiettivo ? textPrimary : textMuted)}>
            {obiettivo
              ? OBIETTIVO_OPTIONS.find((o) => o.value === obiettivo)?.label ?? obiettivo
              : 'Non specificato'}
          </p>
        )}
      </div>

      {/* Limitazioni fisiche */}
      <div className="mb-4">
        <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>
          Limitazioni fisiche
        </label>
        {isEditing ? (
          <textarea
            value={tempLimitazioni}
            onChange={(e) => setTempLimitazioni(e.target.value)}
            placeholder="Es. dolore al ginocchio sinistro, ernia lombare"
            rows={2}
            className={cn(
              'w-full rounded-lg border bg-[#1E1E24] px-3 py-2 text-sm resize-none',
              textPrimary,
              borderClass
            )}
          />
        ) : (
          <p className={cn('text-sm', limitazioniFisiche ? textPrimary : textMuted)}>
            {limitazioniFisiche || 'Nessuna limitazione indicata'}
          </p>
        )}
      </div>

      {/* Zone da evitare */}
      <div className="mb-4">
        <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>
          Zone da evitare
        </label>
        {isEditing ? (
          <div className="flex flex-wrap gap-2 items-center">
            {ZONE_EVITARE_OPTIONS.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => toggleChip(zone, tempZone, setTempZone)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  tempZone.includes(zone)
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]'
                    : cn('border-white/10', textMuted, 'hover:bg-white/5')
                )}
              >
                {zone}
              </button>
            ))}
            {tempZone.filter((z) => !ZONE_EVITARE_OPTIONS.includes(z)).map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => removeChip(zone, tempZone, setTempZone)}
                aria-label={`Rimuovi ${zone}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]"
              >
                {zone}
                <span className="ml-1.5 hover:text-red-400" aria-hidden>×</span>
              </button>
            ))}
            {showZonaInput ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border-2 border-[#EEBA2B] bg-[#1E1E24]">
                <input
                  type="text"
                  value={zonaInputValue}
                  onChange={(e) => setZonaInputValue(e.target.value)}
                  onBlur={commitZonaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitZonaInput();
                    }
                  }}
                  placeholder="Specifica zona..."
                  className="bg-transparent border-none outline-none w-28 text-[#F0EDE8] placeholder:text-[#8A8A96] text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setZonaInputValue('');
                    setShowZonaInput(false);
                  }}
                  className="hover:opacity-80 p-0.5 rounded"
                  aria-label="Annulla"
                >
                  <X className="w-3 h-3 text-[#8A8A96]" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowZonaInput(true)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-dashed border-white/30 text-[#8A8A96] hover:bg-white/5'
                )}
              >
                ✏️ Altro
              </button>
            )}
          </div>
        ) : (
          <p className={cn('text-sm', zoneEvitare.length ? textPrimary : textMuted)}>
            {zoneEvitare.length ? zoneEvitare.join(', ') : 'Nessuna zona da evitare'}
          </p>
        )}
      </div>

      {/* Allergie */}
      <div className="mb-4">
        <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>
          Allergie e intolleranze
        </label>
        {isEditing ? (
          <div className="flex flex-wrap gap-2 items-center">
            {ALLERGIE_OPTIONS.map((allergia) => (
              <button
                key={allergia}
                type="button"
                onClick={() => toggleChip(allergia, tempAllergie, setTempAllergie)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  tempAllergie.includes(allergia)
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]'
                    : cn('border-white/10', textMuted, 'hover:bg-white/5')
                )}
              >
                {allergia}
              </button>
            ))}
            {tempAllergie.filter((a) => !ALLERGIE_OPTIONS.includes(a)).map((allergia) => (
              <button
                key={allergia}
                type="button"
                onClick={() => removeChip(allergia, tempAllergie, setTempAllergie)}
                aria-label={`Rimuovi ${allergia}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]"
              >
                {allergia}
                <span className="ml-1.5 hover:text-red-400" aria-hidden>×</span>
              </button>
            ))}
            {showAllergiaInput ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border-2 border-[#EEBA2B] bg-[#1E1E24]">
                <input
                  type="text"
                  value={allergiaInputValue}
                  onChange={(e) => setAllergiaInputValue(e.target.value)}
                  onBlur={commitAllergiaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitAllergiaInput();
                    }
                  }}
                  placeholder="Specifica allergia..."
                  className="bg-transparent border-none outline-none w-32 text-[#F0EDE8] placeholder:text-[#8A8A96] text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setAllergiaInputValue('');
                    setShowAllergiaInput(false);
                  }}
                  className="hover:opacity-80 p-0.5 rounded"
                  aria-label="Annulla"
                >
                  <X className="w-3 h-3 text-[#8A8A96]" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowAllergiaInput(true)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-dashed border-white/30 text-[#8A8A96] hover:bg-white/5'
                )}
              >
                ✏️ Altro
              </button>
            )}
          </div>
        ) : (
          <p className={cn('text-sm', allergie.length ? textPrimary : textMuted)}>
            {allergie.length ? allergie.join(', ') : 'Nessuna allergia indicata'}
          </p>
        )}
      </div>

      {/* Note mediche */}
      <div className="mb-4">
        <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>
          Note mediche
        </label>
        {isEditing ? (
          <>
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="Es. ipertensione, diabete, operazioni recenti"
              rows={2}
              className={cn(
                'w-full rounded-lg border bg-[#1E1E24] px-3 py-2 text-sm resize-none',
                textPrimary,
                borderClass
              )}
            />
            <div
              className={cn(
                'mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90'
              )}
            >
              ⚠️ Queste informazioni vengono usate da PrimeBot per adattare i tuoi piani. Non inserire dati clinici sensibili. Consulta sempre il tuo medico per condizioni specifiche.
            </div>
          </>
        ) : (
          <p className={cn('text-sm', noteMediche ? textPrimary : textMuted)}>
            {noteMediche || 'Nessuna nota medica'}
          </p>
        )}
      </div>

      {/* Azioni editing */}
      {isEditing && (
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className={cn('border-white/10', textPrimary)}
          >
            <X className="w-4 h-4 mr-1" />
            Annulla
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#EEBA2B] text-[#0A0A0C] hover:bg-[#EEBA2B]/90"
          >
            {isSaving ? (
              <span className="animate-pulse">Salvataggio...</span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Salva tutto
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
