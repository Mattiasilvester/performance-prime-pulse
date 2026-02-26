/* eslint-disable react-hooks/exhaustive-deps -- sync store intenzionale */
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle,
  Shield,
  CheckCircle,
  X,
  Info,
  Lock
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { Button } from '@/components/ui/button';

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
      if (!isEditMode) {
        trackStepStarted(5);
      }
    }, [trackStepStarted, isEditMode]);

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
          limitazioniFisiche: null,
          zoneEvitare: [],
          condizioniMediche: null,
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
            limitazioniFisiche: hasLimitations === true ? limitationsText : null,
            zoneEvitare: hasLimitations === true ? selectedZones : [],
            condizioniMediche: medicalConditions || null,
          };

          console.log('📦 Step 5 Payload:', payload);

          // 1. Aggiorna dati nello store
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
        className="max-w-2xl mx-auto w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-5xl mb-4"
          >
            🏥
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white mb-3"
          >
            Ultima cosa! 🏥
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-400"
          >
            Hai limitazioni fisiche o dolori da considerare?
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-6"
        >
          {/* Domanda iniziale - Radio buttons */}
          <div className="space-y-4">
            <Label className="text-white text-lg font-semibold mb-4 block">
              Seleziona un'opzione:
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opzione "No" */}
              <motion.button
                onClick={() => setHasLimitations(false)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  hasLimitations === false
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    hasLimitations === false ? 'bg-[#EEBA2B]' : 'bg-white/10'
                  }`}>
                    <CheckCircle className={`w-6 h-6 ${
                      hasLimitations === false ? 'text-black' : 'text-white'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-lg">
                      ✅ No, nessuna limitazione
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Sto bene e posso fare qualsiasi esercizio
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Opzione "Sì" */}
              <motion.button
                onClick={() => setHasLimitations(true)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  hasLimitations === true
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    hasLimitations === true ? 'bg-[#EEBA2B]' : 'bg-white/10'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      hasLimitations === true ? 'text-black' : 'text-white'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-lg">
                      ⚠️ Sì, ho alcune limitazioni
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Ho dolori o infortuni da considerare
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Form espanso quando seleziona "Sì" */}
          <AnimatePresence>
            {hasLimitations === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-4 border-t border-white/10"
              >
                {/* Campo descrizione limitazioni */}
                <div className="space-y-2">
                  <Label htmlFor="limitations" className="text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EEBA2B]" />
                    Descrivi le tue limitazioni o dolori
                  </Label>
                  <Textarea
                    id="limitations"
                    value={limitationsText}
                    onChange={(e) => setLimitationsText(e.target.value)}
                    placeholder="Es. mal di schiena da 6 mesi, ginocchio operato 2 anni fa, spalla dolorante dopo infortunio..."
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* Multiselect zone del corpo */}
                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EEBA2B]" />
                    Seleziona le zone del corpo interessate
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BODY_ZONES.map((zone) => {
                      const isSelected = selectedZones.includes(zone.id);
                      return (
                        <motion.button
                          key={zone.id}
                          onClick={() => toggleZone(zone.id)}
                          className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-[#EEBA2B] bg-[#EEBA2B]/20 text-white'
                              : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-lg">{zone.icon}</span>
                          <span className="text-sm font-medium">{zone.label}</span>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-[#EEBA2B]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Campo condizioni mediche opzionale */}
                <div className="space-y-2">
                  <Label htmlFor="medical" className="text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#EEBA2B]" />
                    Altre informazioni mediche (opzionale)
                  </Label>
                  <Textarea
                    id="medical"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="Es. asma, pressione alta, diabete..."
                    rows={2}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                  />
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      🔒 Queste info sono private e servono solo per personalizzare i tuoi allenamenti
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Privacy */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <p className="text-xs text-gray-300">
                Queste informazioni ci aiutano a creare allenamenti sicuri e personalizzati per te. 
                Ti consigliamo sempre di consultare un professionista per valutazioni mediche specifiche.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

Step5HealthLimitations.displayName = 'Step5HealthLimitations';

export default Step5HealthLimitations;

