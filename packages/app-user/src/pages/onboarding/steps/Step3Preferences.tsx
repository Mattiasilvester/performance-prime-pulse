/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store/luoghi onboarding */
import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import {
  MapPin,
  Home,
  Building2,
  Sun,
  Briefcase,
  Check,
  X,
  Dumbbell,
  Zap,
  Clock,
  Flame,
  Save,
  Loader2,
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Step3PreferencesHandle {
  handleContinue: () => void;
}

interface Step3PreferencesProps {
  onComplete: () => void;
  isEditMode?: boolean;
}

interface LocationCard {
  id: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  tags: string[];
}

const locationCards: LocationCard[] = [
  { id: 'casa', icon: Home, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10B981', title: 'Casa', tags: ['Corpo libero', 'Elastici'] },
  { id: 'palestra', icon: Building2, iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3B82F6', title: 'Palestra', tags: ['Bilancieri', 'Macchinari'] },
  { id: 'outdoor', icon: Sun, iconBg: 'rgba(238,186,43,0.08)', iconColor: '#EEBA2B', title: 'Outdoor', tags: ['Parchi', 'Running'] },
];

const ATTREZZI_IDS = ['manubri', 'bilanciere', 'kettlebell', 'elastici', 'panca', 'altro'] as const;

const Step3Preferences = forwardRef<Step3PreferencesHandle, Step3PreferencesProps>(
  ({ onComplete, isEditMode = false }, ref) => {
    const { data, updateData } = useOnboardingStore();
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState<15 | 30 | 45 | 60>(30);
    const [possiedeAttrezzatura, setPossiedeAttrezzatura] = useState<boolean | undefined>(undefined);
    const [attrezzi, setAttrezzi] = useState<string[]>([]);
    const [altriAttrezzi, setAltriAttrezzi] = useState<string>('');
    const [isSavingAltri, setIsSavingAltri] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [canProceed, setCanProceed] = useState(false);
    const { saveAndContinue, trackStepStarted } = useOnboardingNavigation(isEditMode);
    const { toast } = useToast();
    
    const isManualLocationUpdate = useRef(false);
    const hasTrackedRef = useRef(false);

    useEffect(() => {
      if (!isEditMode && !hasTrackedRef.current) {
        trackStepStarted(3);
        hasTrackedRef.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    // ✅ FIX: Sincronizza stati con data usando useEffect invece di inizializzazione diretta
    useEffect(() => {
      // Solo se NON è un aggiornamento manuale (evita loop)
      if (data.luoghiAllenamento && !isManualLocationUpdate.current) {
        setSelectedLocations(data.luoghiAllenamento);
      }
    }, [data.luoghiAllenamento]);

    useEffect(() => {
      if (data.tempoSessione) {
        setSelectedTime(data.tempoSessione);
      }
    }, [data.tempoSessione]);

    useEffect(() => {
      if (data.possiedeAttrezzatura !== undefined) {
        setPossiedeAttrezzatura(data.possiedeAttrezzatura);
      }
    }, [data.possiedeAttrezzatura]);

    useEffect(() => {
      if (data.attrezzi) {
        setAttrezzi(data.attrezzi);
      }
    }, [data.attrezzi]);

    useEffect(() => {
      if (data.altriAttrezzi !== undefined) {
        setAltriAttrezzi(data.altriAttrezzi);
      }
    }, [data.altriAttrezzi]);

    // Determina se mostrare domanda attrezzatura
    const mostraAttrezzatura = selectedLocations.includes('casa') || selectedLocations.includes('outdoor');

    useEffect(() => {
      // Validazione completa
      const locationsValid = selectedLocations.length > 0;
      
      let attrezzaturaValid = true;
      if (mostraAttrezzatura) {
        // Se mostra attrezzatura, deve rispondere Sì/No
        if (possiedeAttrezzatura === undefined) {
          attrezzaturaValid = false;
        } else if (possiedeAttrezzatura === true) {
          // Se "Sì", deve selezionare almeno 1 attrezzo
          // ✅ RIMOSSO: validazione campo "Altro" perché ha bottone dedicato
          if (attrezzi.length === 0) {
            attrezzaturaValid = false;
          }
        }
      }
      
      setCanProceed(locationsValid && attrezzaturaValid);
    }, [selectedLocations, mostraAttrezzatura, possiedeAttrezzatura, attrezzi]);

    // ✅ FIX: Nuovo useEffect per sincronizzare selectedLocations → store
    useEffect(() => {
      // Solo se è un aggiornamento manuale (da toggleLocation)
      if (isManualLocationUpdate.current) {
        const newData: any = {
          luoghiAllenamento: selectedLocations
        };
        
        // Se rimuove Casa/Outdoor, resetta attrezzatura
        const hadCasaOrOutdoor = data.luoghiAllenamento?.some(l => l === 'casa' || l === 'outdoor');
        const hasCasaOrOutdoor = selectedLocations.some(l => l === 'casa' || l === 'outdoor');
        
        if (hadCasaOrOutdoor && !hasCasaOrOutdoor) {
          newData.possiedeAttrezzatura = undefined;
          newData.attrezzi = undefined;
          newData.altriAttrezzi = undefined;
          setPossiedeAttrezzatura(undefined);
          setAttrezzi([]);
          setAltriAttrezzi('');
        }
        
        updateData(newData);
        // Reset flag dopo aggiornamento store
        isManualLocationUpdate.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLocations]); // updateData è stabile, non serve nelle deps

    const toggleLocation = (locationId: string) => {
      // ✅ FIX: Marca come aggiornamento manuale PRIMA di chiamare setState
      isManualLocationUpdate.current = true;
      
      setSelectedLocations(prev => {
        const newLocations = prev.includes(locationId)
          ? prev.filter(id => id !== locationId)
          : [...prev, locationId];

        console.log('Luoghi aggiornati:', newLocations);

        // ✅ FIX: RIMOSSO updateData da qui - sarà gestito dal useEffect

        return newLocations;
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    const handleTimeSelect = (time: 15 | 30 | 45 | 60) => {
      setSelectedTime(time);
      console.log('Tempo aggiornato:', time);
      updateData({ tempoSessione: time });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    };

    const handleAttrezzaturaSelect = (value: boolean) => {
      setPossiedeAttrezzatura(value);
      console.log('Attrezzatura aggiornata:', value);
      
      const newData: any = { possiedeAttrezzatura: value };
      
      // Se risponde "No", resetta attrezzi
      if (value === false) {
        newData.attrezzi = [];
        newData.altriAttrezzi = '';
        setAttrezzi([]);
        setAltriAttrezzi('');
      }
      
      updateData(newData);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    };

    const toggleAttrezzo = (attrezzoId: string) => {
      setAttrezzi(prev => {
        const newAttrezzi = prev.includes(attrezzoId)
          ? prev.filter(id => id !== attrezzoId)
          : [...prev, attrezzoId];
        
        console.log('Attrezzi aggiornati:', newAttrezzi);
        
        // Se deseleziona "Altro", resetta campo testo
        if (!newAttrezzi.includes('altro')) {
          setAltriAttrezzi('');
          updateData({ attrezzi: newAttrezzi, altriAttrezzi: '' });
        } else {
          updateData({ attrezzi: newAttrezzi });
        }
        
        return newAttrezzi;
      });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    };

    const handleAltriAttrezziChange = (value: string) => {
      setAltriAttrezzi(value);
      updateData({ altriAttrezzi: value });
      // Reset stato "justSaved" quando modifica testo
      if (justSaved) {
        setJustSaved(false);
      }
    };

    const salvaAltriAttrezziDatabase = async (altriAttrezzi: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Salva in user_onboarding_responses
      const { error: error1 } = await supabase
        .from('user_onboarding_responses')
        .update({ altri_attrezzi: altriAttrezzi })
        .eq('user_id', user.id);

      if (error1) throw error1;

      // Salva anche in onboarding_preferenze se esiste
      const { error: error2 } = await supabase
        .from('onboarding_preferenze')
        .update({ altri_attrezzi: altriAttrezzi })
        .eq('user_id', user.id);

      // Non bloccare se tabella non esiste
      if (error2 && !error2.message.includes('does not exist')) {
        console.warn('Errore salvataggio onboarding_preferenze:', error2);
      }
    };

    const handleSalvaAltriAttrezzi = async () => {
      if (!altriAttrezzi?.trim() || altriAttrezzi.trim().length < 3) {
        return;
      }

      setIsSavingAltri(true);

      try {
        // 1. Salva in database SUBITO (non aspettare "Continua")
        await salvaAltriAttrezziDatabase(altriAttrezzi.trim());
        
        // 2. Mostra toast success
        toast({
          title: "✅ Attrezzi salvati!",
          description: "I tuoi attrezzi personalizzati sono stati salvati con successo",
          duration: 3000,
        });
        
        // 3. Feedback visivo bottone (2 sec)
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
        
      } catch (error) {
        // Toast errore
        toast({
          title: "❌ Errore",
          description: "Impossibile salvare gli attrezzi. Riprova.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsSavingAltri(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleContinue: () => {
        if (!canProceed) {
          console.log('⚠️ Step 3: validazione non passata');
          return;
        }

        console.log('✅ Step 3: validazione OK, procedo');

        const payload: any = {
          luoghiAllenamento: selectedLocations,
          tempoSessione: selectedTime
        };
        
        // Aggiungi attrezzatura solo se visibile
        if (mostraAttrezzatura && possiedeAttrezzatura !== undefined) {
          payload.possiedeAttrezzatura = possiedeAttrezzatura;
          
          if (possiedeAttrezzatura === true) {
            payload.attrezzi = attrezzi;
            payload.altriAttrezzi = attrezzi.includes('altro') ? altriAttrezzi.trim() : '';
          } else {
            payload.attrezzi = [];
            payload.altriAttrezzi = '';
          }
        } else {
          payload.possiedeAttrezzatura = undefined;
          payload.attrezzi = undefined;
          payload.altriAttrezzi = undefined;
        }

        updateData(payload);

        saveAndContinue(3, payload);

        trackOnboarding.stepCompleted(3, payload);

        onComplete();
      }
    }));

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-3xl mx-auto w-full px-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
          >
            <MapPin size={32} color="#EEBA2B" />
          </div>
          <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold text-[#F0EDE8] text-center leading-[1.15] tracking-[-0.5px] mb-[10px]">
            Dove preferisci allenarti?
          </h1>
          <p className="text-[15px] text-[#F0EDE8]/50 text-center">
            Puoi selezionare più opzioni per massima flessibilità
          </p>
        </div>

        {/* 3 card luoghi — multi-select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {locationCards.map((location) => {
            const Icon = location.icon;
            const isSelected = selectedLocations.includes(location.id);

            return (
              <motion.div
                key={location.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleLocation(location.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleLocation(location.id);
                  }
                }}
                whileHover={isSelected ? {} : { y: -3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                className={`
                  bg-[#16161A] border-[1.5px] rounded-[14px] p-5 cursor-pointer
                  transition-all duration-[220ms] relative overflow-hidden
                  ${isSelected
                    ? 'border-[#EEBA2B] shadow-[0_0_0_1px_#EEBA2B,0_8px_32px_rgba(238,186,43,0.12)]'
                    : 'border-white/[0.07] hover:border-white/[0.14]'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-[rgba(238,186,43,0.08)] pointer-events-none" />
                )}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-[22px] h-[22px] rounded-full bg-[#EEBA2B] flex items-center justify-center z-10"
                  >
                    <Check size={12} strokeWidth={2.5} color="#000" />
                  </div>
                )}
                <div
                  className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center mb-[14px] relative z-10"
                  style={{ backgroundColor: location.iconBg }}
                >
                  <Icon size={22} color={location.iconColor} />
                </div>
                <p className="text-[15px] font-bold mb-[6px] relative z-10 text-[#F0EDE8]">
                  {location.title}
                </p>
                <div className="flex flex-wrap gap-[6px] relative z-10">
                  {location.tags.map((t) => (
                    <span
                      key={t}
                      className="px-[9px] py-[3px] rounded-full border border-white/[0.07] text-[11px] font-medium text-[#F0EDE8]/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Possiedi attrezzatura? — expand motion.div */}
        {mostraAttrezzatura && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-[14px] bg-[#16161A] border border-white/[0.07] rounded-[14px] p-6 mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center"
              >
                <Briefcase size={18} color="#EEBA2B" />
              </div>
              <p className="text-[15px] font-semibold text-[#F0EDE8]">Possiedi attrezzatura?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => handleAttrezzaturaSelect(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAttrezzaturaSelect(true); } }}
                whileHover={possiedeAttrezzatura === true ? {} : { y: -3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                className={`rounded-[12px] p-4 border-[1.5px] cursor-pointer transition-all flex items-center gap-3
                  ${possiedeAttrezzatura === true
                    ? 'border-[#10B981] bg-[rgba(16,185,129,0.08)]'
                    : 'border-white/[0.07] bg-[#1E1E24] hover:border-white/[0.14]'
                  }`}
              >
                <div
                  className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center flex-shrink-0"
                >
                  <Check size={18} color="#10B981" />
                </div>
                <span className="font-semibold text-[15px] text-[#F0EDE8]">Sì</span>
              </motion.div>
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => handleAttrezzaturaSelect(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAttrezzaturaSelect(false); } }}
                whileHover={possiedeAttrezzatura === false ? {} : { y: -3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                className={`rounded-[12px] p-4 border-[1.5px] cursor-pointer transition-all flex items-center gap-3
                  ${possiedeAttrezzatura === false
                    ? 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]'
                    : 'border-white/[0.07] bg-[#1E1E24] hover:border-white/[0.14]'
                  }`}
              >
                <div
                  className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(239,68,68,0.1)] flex items-center justify-center flex-shrink-0"
                >
                  <X size={18} color="#EF4444" />
                </div>
                <span className="font-semibold text-[15px] text-[#F0EDE8]">No</span>
              </motion.div>
            </div>

            {possiedeAttrezzatura === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-5 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={16} color="#EEBA2B" />
                  <p className="text-[13px] font-semibold text-[#F0EDE8]/70 uppercase tracking-[0.5px]">
                    Quali attrezzi possiedi?
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-[10px]">
                  {ATTREZZI_IDS.map((attrezzo) => {
                    const isSelected = attrezzi.includes(attrezzo);
                    return (
                      <motion.div
                        key={attrezzo}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleAttrezzo(attrezzo)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleAttrezzo(attrezzo);
                          }
                        }}
                        whileHover={isSelected ? {} : { y: -2, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                        className={`rounded-[10px] p-[13px] border-[1.5px] cursor-pointer transition-all flex items-center gap-[10px]
                          ${isSelected
                            ? 'border-[#EEBA2B] bg-[rgba(238,186,43,0.08)]'
                            : 'border-white/[0.07] bg-[#1E1E24] hover:border-white/[0.14]'
                          }`}
                      >
                      <div
                        className={`w-[20px] h-[20px] rounded-[6px] border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all
                          ${attrezzi.includes(attrezzo)
                            ? 'bg-[#EEBA2B] border-[#EEBA2B]'
                            : 'border-white/[0.2] bg-transparent'
                          }`}
                      >
                        {attrezzi.includes(attrezzo) && <Check size={12} strokeWidth={2.5} color="#000" />}
                      </div>
                      <span className="text-[13px] font-medium text-[#F0EDE8] capitalize">
                        {attrezzo}
                      </span>
                    </motion.div>
                    );
                  })}
                </div>

                {attrezzi.includes('altro') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 overflow-hidden"
                  >
                    <textarea
                      value={altriAttrezzi}
                      onChange={(e) => handleAltriAttrezziChange(e.target.value)}
                      placeholder="Es: TRX, Corda per saltare, Palla medica..."
                      className="w-full bg-[#1E1E24] border border-white/[0.07] rounded-[10px] px-4 py-3 text-[16px] text-[#F0EDE8] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus:ring-2 focus:ring-[#EEBA2B]/10 outline-none resize-none min-h-[80px]"
                      maxLength={200}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[12px] text-[#F0EDE8]/30">
                        {altriAttrezzi?.length ?? 0}/200
                      </span>
                      <button
                        type="button"
                        onClick={handleSalvaAltriAttrezzi}
                        disabled={isSavingAltri || !altriAttrezzi?.trim() || altriAttrezzi.trim().length < 3}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-all
                          ${justSaved
                            ? 'bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10B981]'
                            : 'bg-[#EEBA2B] text-black hover:bg-[#f5c93a] disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                      >
                        {isSavingAltri ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Salvataggio...
                          </>
                        ) : justSaved ? (
                          <>
                            <Check size={14} />
                            Salvato!
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Conferma attrezzi
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {possiedeAttrezzatura === true && attrezzi.length === 0 && (
                  <p className="text-[12px] text-[#F0EDE8]/50 mt-3">Seleziona almeno un attrezzo</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Durata sessione */}
        {selectedLocations.length > 0 && (
          <div className="bg-[#16161A] border border-white/[0.07] rounded-[14px] p-6 mt-4">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center"
              >
                <Clock size={18} color="#EEBA2B" />
              </div>
              <p className="text-[15px] font-semibold text-[#F0EDE8]">
                Quanto tempo per ogni sessione?
              </p>
            </div>

            <div className="grid grid-cols-4 gap-[10px]">
              {(
                [
                  { value: 15 as const, label: '15 min', sub: 'Express', icon: Zap, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                  { value: 30 as const, label: '30 min', sub: 'Standard', icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
                  { value: 45 as const, label: '45 min', sub: 'Completo', icon: Dumbbell, color: '#EEBA2B', bg: 'rgba(238,186,43,0.08)' },
                  { value: 60 as const, label: '60+ min', sub: 'Intensivo', icon: Flame, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
                ] as const
              ).map(({ value, label, sub, icon: Icon, color, bg }) => {
                const isSelected = selectedTime === value;
                return (
                  <motion.div
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTimeSelect(value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTimeSelect(value);
                      }
                    }}
                    whileHover={isSelected ? {} : { y: -3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    className={`rounded-[12px] p-4 border-[1.5px] cursor-pointer transition-all text-center
                      ${isSelected
                        ? 'border-[#EEBA2B] bg-[rgba(238,186,43,0.08)] shadow-[0_0_0_1px_#EEBA2B]'
                        : 'border-white/[0.07] bg-[#1E1E24] hover:border-white/[0.14]'
                      }`}
                  >
                    <div className="flex flex-col items-center text-center w-full md:contents">
                      <div
                        className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center mx-auto mb-2 md:mx-auto"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon size={18} color={color} />
                      </div>
                      <p className="text-[14px] font-bold text-[#F0EDE8] text-center">{label}</p>
                      <p className="text-[11px] text-[#F0EDE8]/50 mt-[2px] text-center">{sub}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

Step3Preferences.displayName = 'Step3Preferences';

export default Step3Preferences;


