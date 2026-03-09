/* eslint-disable react-hooks/exhaustive-deps -- sync store intenzionale */
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Info,
  Lock,
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

export interface Step5HealthLimitationsHandle {
  handleContinue: () => Promise<void> | void;
}

interface Step5HealthLimitationsProps {
  onComplete: () => void;
  isEditMode?: boolean;
}

const BODY_ZONES = [
  { id: 'schiena', label: 'Schiena', icon: '🫁' },
  { id: 'ginocchia', label: 'Ginocchia', icon: '🦵' },
  { id: 'spalle', label: 'Spalle', icon: '💪' },
  { id: 'polsi', label: 'Polsi', icon: '✋' },
  { id: 'caviglie', label: 'Caviglie', icon: '🦶' },
  { id: 'collo', label: 'Collo', icon: '👤' },
  { id: 'anche', label: 'Anche', icon: '🦴' },
  { id: 'gomiti', label: 'Gomiti', icon: '🦾' },
  { id: 'altro', label: 'Altro', icon: '📍' },
];

const Step5HealthLimitations = forwardRef<Step5HealthLimitationsHandle, Step5HealthLimitationsProps>(
  ({ onComplete, isEditMode = false }, ref) => {
    const { data, updateData } = useOnboardingStore();
    const { saveAndContinue, trackStepStarted } = useOnboardingNavigation(isEditMode);
    const hasTrackedRef = useRef(false);

    const [hasLimitations, setHasLimitations] = useState<boolean | null>(
      data.haLimitazioni ?? null
    );
    const [limitationsText, setLimitationsText] = useState<string>(
      data.limitazioniFisiche || ''
    );
    const [selectedZones, setSelectedZones] = useState<string[]>(
      data.zoneEvitare || []
    );
    const [medicalConditions, setMedicalConditions] = useState<string>(
      data.condizioniMediche || ''
    );
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
      if (!isEditMode && !hasTrackedRef.current) {
        trackStepStarted(5);
        hasTrackedRef.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    // Sincronizza dati dallo store se esistono
    useEffect(() => {
      if (data.haLimitazioni !== undefined && hasLimitations === null) {
        setHasLimitations(data.haLimitazioni);
      }
      if (data.limitazioniFisiche && !limitationsText) {
        setLimitationsText(data.limitazioniFisiche);
      }
      if (data.zoneEvitare && selectedZones.length === 0) {
        setSelectedZones(data.zoneEvitare);
      }
      if (data.condizioniMediche && !medicalConditions) {
        setMedicalConditions(data.condizioniMediche);
      }
    }, [data]);

    // Salva dati nello store quando cambiano
    useEffect(() => {
      updateData({
        haLimitazioni: hasLimitations,
        limitazioniFisiche: limitationsText,
        zoneEvitare: selectedZones,
        condizioniMediche: medicalConditions,
      });
    }, [hasLimitations, limitationsText, selectedZones, medicalConditions, updateData]);

    const toggleZone = (zoneId: string) => {
      setSelectedZones(prev => 
        prev.includes(zoneId)
          ? prev.filter(z => z !== zoneId)
          : [...prev, zoneId]
      );
    };

    const handleSkip = async () => {
      // Salva "nessuna limitazione" e completa
      setIsGenerating(true);
      try {
        const payload = {
          haLimitazioni: false,
          limitazioniFisiche: undefined,
          zoneEvitare: [],
          condizioniMediche: undefined,
        };
        
        updateData(payload);
        await saveAndContinue(5, payload);
        trackOnboarding.stepCompleted(5, { skipped: true });
        onComplete();
      } catch (error) {
        console.error('❌ Errore salvataggio skip:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleContinue: async () => {
        if (isGenerating) return;

        setIsGenerating(true);

        try {
          const payload = {
            haLimitazioni: hasLimitations === true,
            limitazioniFisiche: hasLimitations === true ? limitationsText : undefined,
            zoneEvitare: hasLimitations === true ? selectedZones : [],
            condizioniMediche: medicalConditions || undefined,
          };

          updateData(payload);

          // 2. Salva nel database
          await saveAndContinue(5, payload);

          // 3. Analytics
          trackOnboarding.stepCompleted(5, {
            hasLimitations: hasLimitations === true,
            zonesCount: selectedZones.length,
            hasMedicalConditions: !!medicalConditions,
          });

          // 4. Completa onboarding
          onComplete();
        } catch (error) {
          console.error('❌ Errore in handleContinue:', error);
        } finally {
          setIsGenerating(false);
        }
      }
    }));

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-3xl mx-auto w-full px-4"
      >
        {/* Header — box icona gold + titolo + sottotitolo */}
        <div className="text-center mb-8">
          <div
            className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
          >
            <Shield size={32} color="#EEBA2B" />
          </div>
          <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold text-[#F0EDE8] text-center leading-[1.15] tracking-[-0.5px] mb-[10px]">
            Ultima cosa!
          </h1>
          <p className="text-[15px] text-[#F0EDE8]/50 text-center">
            Hai limitazioni fisiche o dolori da considerare?
          </p>
        </div>

        {/* Card principale — scelta No / Sì */}
        <div className="rounded-[14px] p-5 bg-[#16161A] border-[1.5px] border-[#2A2A2E] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
            {/* Opzione "No" */}
            <motion.button
              type="button"
              onClick={() => setHasLimitations(false)}
              whileHover={hasLimitations === false ? {} : { y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              className={`
                rounded-[14px] p-5 border-[1.5px] text-left transition-all
                flex items-center gap-3
                ${hasLimitations === false
                  ? 'border-[#EEBA2B] bg-[rgba(238,186,43,0.08)]'
                  : 'border-[#2A2A2E] bg-[#1C1C1F] hover:border-[#3A3A3E]'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                hasLimitations === false ? 'bg-[rgba(238,186,43,0.2)]' : 'bg-white/[0.06]'
              }`}>
                <CheckCircle size={20} className={hasLimitations === false ? 'text-[#EEBA2B]' : 'text-[#F0EDE8]/60'} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#F0EDE8]">
                  No, nessuna limitazione
                </div>
                <div className="text-[13px] text-[#F0EDE8]/50 mt-0.5">
                  Sto bene e posso fare qualsiasi esercizio
                </div>
              </div>
            </motion.button>

            {/* Opzione "Sì" */}
            <motion.button
              type="button"
              onClick={() => setHasLimitations(true)}
              whileHover={hasLimitations === true ? {} : { y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              className={`
                rounded-[14px] p-5 border-[1.5px] text-left transition-all
                flex items-center gap-3
                ${hasLimitations === true
                  ? 'border-[#EEBA2B] bg-[rgba(238,186,43,0.08)]'
                  : 'border-[#2A2A2E] bg-[#1C1C1F] hover:border-[#3A3A3E]'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                hasLimitations === true ? 'bg-[rgba(238,186,43,0.2)]' : 'bg-white/[0.06]'
              }`}>
                <AlertTriangle size={20} className={hasLimitations === true ? 'text-[#EEBA2B]' : 'text-[#F0EDE8]/60'} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#F0EDE8]">
                  Sì, ho alcune limitazioni
                </div>
                <div className="text-[13px] text-[#F0EDE8]/50 mt-0.5">
                  Ho dolori o infortuni da considerare
                </div>
              </div>
            </motion.button>
          </div>

          {/* Form espanso quando seleziona "Sì" */}
          <AnimatePresence>
            {hasLimitations === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-4 border-t border-[#2A2A2E] overflow-hidden"
              >
                {/* Campo descrizione limitazioni */}
                <div className="space-y-2">
                  <Label htmlFor="limitations" className="text-[#F0EDE8] text-[14px] font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EEBA2B]" />
                    Descrivi le tue limitazioni o dolori
                  </Label>
                  <Textarea
                    id="limitations"
                    value={limitationsText}
                    onChange={(e) => setLimitationsText(e.target.value)}
                    placeholder="Es. mal di schiena da 6 mesi, ginocchio operato 2 anni fa, spalla dolorante dopo infortunio..."
                    rows={4}
                    className="bg-[#1C1C1F] border-[#2A2A2E] text-[#F0EDE8] placeholder:text-[#F0EDE8]/40 rounded-[10px] resize-none"
                  />
                </div>

                {/* Multiselect zone del corpo */}
                <div className="space-y-3">
                  <Label className="text-[#F0EDE8] text-[14px] font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EEBA2B]" />
                    Seleziona le zone del corpo interessate
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BODY_ZONES.map((zone) => {
                      const isSelected = selectedZones.includes(zone.id);
                      return (
                        <motion.button
                          key={zone.id}
                          type="button"
                          onClick={() => toggleZone(zone.id)}
                          whileHover={isSelected ? {} : { y: -2, transition: { duration: 0.15 } }}
                          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                          className={`
                            px-4 py-2 rounded-full border-[1.5px] transition-all flex items-center gap-2 text-sm font-medium
                            ${isSelected
                              ? 'border-[#EEBA2B] bg-[rgba(238,186,43,0.12)] text-[#EEBA2B]'
                              : 'border-[#2A2A2E] bg-[#1C1C1F] text-[#F0EDE8]/70 hover:border-[#3A3A3E]'
                            }
                          `}
                        >
                          <span className="text-base">{zone.icon}</span>
                          <span>{zone.label}</span>
                          {isSelected && <CheckCircle className="w-4 h-4" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Campo condizioni mediche opzionale */}
                <div className="space-y-2">
                  <Label htmlFor="medical" className="text-[#F0EDE8] text-[14px] font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#EEBA2B]" />
                    Altre informazioni mediche (opzionale)
                  </Label>
                  <Textarea
                    id="medical"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="Es. asma, pressione alta, diabete..."
                    rows={2}
                    className="bg-[#1C1C1F] border-[#2A2A2E] text-[#F0EDE8] placeholder:text-[#F0EDE8]/40 rounded-[10px] resize-none"
                  />
                  <div className="flex items-start gap-2 text-[12px] text-[#F0EDE8]/50">
                    <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Queste info sono private e servono solo per personalizzare i tuoi allenamenti
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Privacy */}
        <div className="rounded-[10px] px-4 py-3 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] flex items-start gap-3 mt-6">
          <Info size={16} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#F0EDE8]/80 leading-relaxed">
            Queste informazioni ci aiutano a creare allenamenti sicuri e personalizzati per te.
            Ti consigliamo sempre di consultare un professionista per valutazioni mediche specifiche.
          </p>
        </div>
      </motion.div>
    );
  }
);

Step5HealthLimitations.displayName = 'Step5HealthLimitations';

export default Step5HealthLimitations;

