import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  User,
  Calendar,
  Ruler,
  Weight,
  Info,
  Users
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

export interface Step4PersonalizationHandle {
  handleContinue: () => Promise<void> | void;
}

interface Step4PersonalizationProps {
  onComplete: () => void;
}

const Step4Personalization = forwardRef<Step4PersonalizationHandle, Step4PersonalizationProps>(
  ({ onComplete }, ref) => {
    const { data, updateData } = useOnboardingStore();
  
    const [nome, setNome] = useState(data.nome || '');
    const [eta, setEta] = useState(data.eta || 25);
    const [peso, setPeso] = useState(data.peso || 70);
    const [altezza, setAltezza] = useState(data.altezza || 170);
    const [isValid, setIsValid] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [consigliNutrizionali] = useState<boolean>(
      data.consigliNutrizionali ?? false
    );
    const { saveAndContinue, trackStepStarted } = useOnboardingNavigation();

    useEffect(() => {
      trackStepStarted(4);
    }, [trackStepStarted]);

  useEffect(() => {
    setIsValid(nome.trim().length > 0);
  }, [nome]);

  // Salva i dati nello store quando cambiano (solo se validi)
  useEffect(() => {
    if (nome.trim().length > 0) {
      updateData({
        nome,
        eta,
        peso,
        altezza,
        consigliNutrizionali
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, eta, peso, altezza, consigliNutrizionali]);

  useImperativeHandle(ref, () => ({
    handleContinue: async () => {
      if (!isValid || isGenerating) {
        console.log('⚠️ Step 4: validazione non passata o generazione in corso');
        return;
      }

      console.log('✅ Step 4: validazione OK, procedo');

      setIsGenerating(true);

      const payload = {
        nome,
        eta,
        peso,
        altezza,
        consigliNutrizionali
      };

      try {
        updateData(payload);

        await saveAndContinue(4, payload);

        trackOnboarding.stepCompleted(4, {
          nome: nome.trim().length,
          eta,
          peso,
          altezza,
          consigliNutrizionali
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        onComplete();
      } catch (error) {
        console.error('❌ Errore durante il completamento dello Step 4:', error);
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
          ✨
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Ultimo passo per il tuo piano personalizzato
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-400"
        >
          Questi dati mi aiutano a calibrare perfettamente i tuoi allenamenti
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-6"
      >
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#FFD700]" />
            Come ti chiami?
          </Label>
          <Input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Il tuo nome"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Età */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFD700]" />
            Età: <span className="text-2xl font-bold text-[#FFD700] ml-2">{eta}</span> anni
          </Label>
          <Slider
            value={[eta]}
            onValueChange={(value) => setEta(value[0])}
            min={16}
            max={80}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>16</span>
            <span>80</span>
          </div>
        </div>

        {/* Peso */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Weight className="w-4 h-4 text-[#FFD700]" />
            Peso: <span className="text-2xl font-bold text-[#FFD700] ml-2">{peso}</span> kg
          </Label>
          <Slider
            value={[peso]}
            onValueChange={(value) => setPeso(value[0])}
            min={40}
            max={150}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>40 kg</span>
            <span>150 kg</span>
          </div>
        </div>

        {/* Altezza */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#FFD700]" />
            Altezza: <span className="text-2xl font-bold text-[#FFD700] ml-2">{altezza}</span> cm
          </Label>
          <Slider
            value={[altezza]}
            onValueChange={(value) => setAltezza(value[0])}
            min={140}
            max={220}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>140 cm</span>
            <span>220 cm</span>
          </div>
        </div>

        {/* Sezione Professionisti */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 rounded-xl border border-[#FFD700]/30"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#FFD700]/20">
              <Users className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                Vuoi risultati ancora più veloci?
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Per massimizzare i tuoi risultati e raggiungere l'obiettivo che hai scelto, 
                mettiamo a tua disposizione i migliori professionisti del fitness certificati.
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-start">
                <span className="text-xs bg-white/10 text-[#FFD700] px-3 py-1 rounded-full">
                  ✓ Personal Trainer
                </span>
                <span className="text-xs bg-white/10 text-[#FFD700] px-3 py-1 rounded-full">
                  ✓ Nutrizionisti
                </span>
                <span className="text-xs bg-white/10 text-[#FFD700] px-3 py-1 rounded-full">
                  ✓ E molti altri
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Potrai scegliere se e quando attivarli direttamente dall'app
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Privacy */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-xs text-gray-300">
              I tuoi dati sono criptati e protetti. Utilizziamo queste informazioni 
              solo per personalizzare i tuoi allenamenti e non le condividiamo con terzi.
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
});

Step4Personalization.displayName = 'Step4Personalization';

export default Step4Personalization;


