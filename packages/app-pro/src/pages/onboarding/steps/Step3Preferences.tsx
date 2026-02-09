/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store/luoghi onboarding */
import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { 
  Home,
  Dumbbell,
  Trees,
  Clock,
  Info,
  CheckCircle,
  Sparkles,
  Package,
  Check,
  Loader2
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface Step3PreferencesHandle {
  handleContinue: () => void;
}

interface Step3PreferencesProps {
  onComplete: () => void;
  isEditMode?: boolean;
}

interface TrainingLocation {
  id: string;
  icon: any;
  title: string;
  description: string;
  equipment: string[];
  pros: string[];
  gradient: string;
}

interface TimeOption {
  value: 15 | 30 | 45 | 60;
  label: string;
  description: string;
  ideal: string;
  icon: string;
}

const locations: TrainingLocation[] = [
  {
    id: 'casa',
    icon: Home,
    title: 'Casa',
    description: 'Allenamenti a corpo libero o con attrezzatura minima',
    equipment: ['Corpo libero', 'Elastici', 'Manubri leggeri'],
    pros: ['Zero spostamenti', 'Massima flessibilità', 'Privacy totale'],
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'palestra',
    icon: Dumbbell,
    title: 'Palestra',
    description: 'Accesso completo a pesi e macchinari professionali',
    equipment: ['Bilancieri', 'Macchinari', 'Pesi completi'],
    pros: ['Attrezzatura pro', 'Ambiente motivante', 'Supporto staff'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'outdoor',
    icon: Trees,
    title: 'Outdoor',
    description: 'Allenamenti all\'aperto, parchi o percorsi urbani',
    equipment: ['Corpo libero', 'Panchine', 'Percorsi running'],
    pros: ['Aria fresca', 'Vitamina D', 'Varietà scenari'],
    gradient: 'from-green-500 to-teal-500'
  }
];

const timeOptions: TimeOption[] = [
  {
    value: 15,
    label: '15 min',
    description: 'Express',
    ideal: 'Perfetto per routine mattutine o pause pranzo',
    icon: '⚡'
  },
  {
    value: 30,
    label: '30 min',
    description: 'Standard',
    ideal: 'Bilanciato tra efficacia e praticità',
    icon: '🎯'
  },
  {
    value: 45,
    label: '45 min',
    description: 'Completo',
    ideal: 'Allenamento completo con warm-up e cool-down',
    icon: '💪'
  },
  {
    value: 60,
    label: '60+ min',
    description: 'Intensivo',
    ideal: 'Sessioni complete per risultati massimi',
    icon: '🔥'
  }
];

interface Attrezzo {
  id: string;
  label: string;
  icon: string;
}

const listaAttrezzi: Attrezzo[] = [
  { id: 'manubri', label: 'Manubri', icon: '🏋️' },
  { id: 'bilanciere', label: 'Bilanciere', icon: '💪' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { id: 'elastici', label: 'Elastici di resistenza', icon: '🎗️' },
  { id: 'panca', label: 'Panca', icon: '🪑' },
  { id: 'altro', label: 'Altro', icon: '➕' }
];

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
    
    // ✅ FIX: Ref per distinguere aggiornamenti manuali da automatici
    const isManualLocationUpdate = useRef(false);

    useEffect(() => {
      // ✅ FIX: Non trackare in edit mode (temporaneo per debug)
      if (!isEditMode) {
        trackStepStarted(3);
      }
    }, [trackStepStarted, isEditMode]);

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

    const getComboMessage = () => {
      if (selectedLocations.length === 3) {
        return {
          text: "Massima varietà! I tuoi allenamenti non saranno mai noiosi 🌟",
          color: "text-[#FFD700]"
        };
      } else if (selectedLocations.length === 2) {
        return {
          text: "Ottima flessibilità! Potrai adattarti a ogni situazione 💪",
          color: "text-blue-500"
        };
      } else if (selectedLocations.includes('palestra')) {
        return {
          text: "Focus sui risultati! Accesso a tutta l'attrezzatura professionale 🎯",
          color: "text-purple-500"
        };
      } else if (selectedLocations.includes('casa')) {
        return {
          text: "Comodità massima! Allenati quando vuoi senza vincoli 🏠",
          color: "text-cyan-500"
        };
      } else if (selectedLocations.includes('outdoor')) {
        return {
          text: "Natura e fitness! L'aria aperta aumenta energia e motivazione 🌳",
          color: "text-green-500"
        };
      }
      return null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl mx-auto w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-5xl mb-4"
          >
            📍
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white mb-3"
          >
            Dove preferisci allenarti?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-400"
          >
            Puoi selezionare più opzioni per massima flessibilità
          </motion.p>
        </div>

        {/* Location Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {locations.map((location, index) => {
            const Icon = location.icon;
            const isSelected = selectedLocations.includes(location.id);
            
            return (
              <motion.button
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLocation(location.id)}
                className={`
                  relative p-5 rounded-2xl border-2 transition-all duration-300
                  text-left group
                  ${isSelected 
                    ? 'bg-white/10 border-[#FFD700]/50 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2.5 rounded-xl transition-all
                      ${isSelected 
                        ? `bg-gradient-to-br ${location.gradient}` 
                        : 'bg-white/10'}
                    `}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="font-bold text-white text-lg">
                      {location.title}
                    </h3>
                  </div>
                  
                  {/* Checkbox */}
                  <div className={`
                    w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                    ${isSelected 
                      ? 'bg-[#FFD700] border-[#FFD700]' 
                      : 'border-white/30'}
                  `}>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-black" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3">
                  {location.description}
                </p>

                {/* Equipment */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {location.equipment.map((item, i) => (
                    <span
                      key={i}
                      className={`
                        text-xs px-2 py-1 rounded-full transition-all
                        ${isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/5 text-gray-500'}
                      `}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Pros (shown when selected) */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    {location.pros.map((pro, i) => (
                      <div key={i} className="text-xs text-[#FFD700] flex items-center gap-1">
                        <span>✓</span> {pro}
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Combo Message */}
        {selectedLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              <p className={`text-sm font-medium ${getComboMessage()?.color}`}>
                {getComboMessage()?.text}
              </p>
            </div>
          </motion.div>
        )}

        {/* Domanda Attrezzatura (Condizionale) */}
        {mostraAttrezzatura && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-white">
                Possiedi attrezzatura?
              </h3>
            </div>

            {/* Opzioni Sì/No */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAttrezzaturaSelect(true)}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${possiedeAttrezzatura === true
                    ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                <div className="text-2xl mb-1">✅</div>
                <div className={`font-bold ${possiedeAttrezzatura === true ? 'text-[#FFD700]' : 'text-white'}`}>
                  Sì
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAttrezzaturaSelect(false)}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${possiedeAttrezzatura === false
                    ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                <div className="text-2xl mb-1">❌</div>
                <div className={`font-bold ${possiedeAttrezzatura === false ? 'text-[#FFD700]' : 'text-white'}`}>
                  No
                </div>
              </motion.button>
            </div>

            {/* Messaggio validazione */}
            {mostraAttrezzatura && possiedeAttrezzatura === undefined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <p className="text-xs text-yellow-400">
                  ⚠️ Seleziona se possiedi attrezzatura per continuare
                </p>
              </motion.div>
            )}

            {/* Lista Attrezzi (mostra solo se "Sì") */}
            {possiedeAttrezzatura === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <h4 className="text-md font-semibold text-white mb-3">
                  Quali attrezzi possiedi?
                </h4>

                {/* Grid Attrezzi */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {listaAttrezzi.map((attrezzo) => {
                    const isSelected = attrezzi.includes(attrezzo.id);
                    
                    return (
                      <motion.button
                        key={attrezzo.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleAttrezzo(attrezzo.id)}
                        className={`
                          p-3 rounded-xl border-2 transition-all text-left
                          ${isSelected
                            ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-lg'
                            : 'bg-white/5 border-white/10 hover:border-white/20'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${isSelected
                              ? 'bg-[#FFD700] border-[#FFD700]'
                              : 'border-white/30 bg-transparent'}
                          `}>
                            {isSelected && (
                              <CheckCircle className="w-3 h-3 text-black" />
                            )}
                          </div>
                          <span className="text-lg">{attrezzo.icon}</span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
                            {attrezzo.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Campo "Altro" (condizionale) */}
                {attrezzi.includes('altro') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 space-y-3 overflow-hidden"
                  >
                    {/* Textarea */}
                    <Textarea
                      value={altriAttrezzi}
                      onChange={(e) => handleAltriAttrezziChange(e.target.value)}
                      placeholder="Es: TRX, Corda per saltare, Palla medica..."
                      maxLength={200}
                      rows={3}
                      className="bg-white/5 border-2 border-white/10 text-white placeholder-gray-500 focus:border-[#FFD700] focus-visible:ring-[#FFD700] resize-none"
                    />
                    
                    {/* Contatore caratteri */}
                    <p className="text-xs text-gray-500 text-right">
                      {altriAttrezzi.length}/200
                    </p>

                    {/* Bottone Conferma */}
                    <Button
                      type="button"
                      onClick={handleSalvaAltriAttrezzi}
                      disabled={!altriAttrezzi?.trim() || altriAttrezzi.trim().length < 3 || isSavingAltri}
                      className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                    >
                      {isSavingAltri ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : justSaved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          ✅ Salvato!
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Conferma attrezzi
                        </>
                      )}
                    </Button>

                    {/* Messaggio validazione (sotto bottone) */}
                    {altriAttrezzi && altriAttrezzi.trim().length < 3 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-yellow-500 mt-2"
                      >
                        ⚠️ Specifica almeno 3 caratteri
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Messaggi validazione attrezzi */}
                {possiedeAttrezzatura === true && attrezzi.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <p className="text-xs text-yellow-400">
                      ⚠️ Seleziona almeno un attrezzo
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Time Selection */}
        {selectedLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-white">
                Quanto tempo hai per ogni sessione?
              </h3>
            </div>

            {/* Time Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {timeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTimeSelect(option.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${selectedTime === option.value
                      ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/20'}
                  `}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className={`font-bold ${selectedTime === option.value ? 'text-[#FFD700]' : 'text-white'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Time Description */}
            <motion.div
              key={selectedTime}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-xs text-gray-300">
                  {timeOptions.find(t => t.value === selectedTime)?.ideal}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

      </motion.div>
    );
  }
);

Step3Preferences.displayName = 'Step3Preferences';

export default Step3Preferences;


