import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  User,
  Calendar,
  Ruler,
  Weight,
  Info,
  Check,
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

export interface Step4PersonalizationHandle {
  handleContinue: () => Promise<void> | void;
}

interface Step4PersonalizationProps {
  onComplete: () => void;
  isEditMode?: boolean;
}

const Step4Personalization = forwardRef<Step4PersonalizationHandle, Step4PersonalizationProps>(
  ({ onComplete, isEditMode = false }, ref) => {
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
  const { saveAndContinue, trackStepStarted } = useOnboardingNavigation(isEditMode);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!isEditMode && !hasTrackedRef.current) {
      trackStepStarted(4);
      hasTrackedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // ✅ FIX CRITICO: Sincronizza nome dallo store se esiste ma il campo è vuoto (solo data.nome per evitare loop)
  useEffect(() => {
    if (data.nome && data.nome.trim().length > 0 && !nome.trim()) {
      console.log('🔄 Syncing nome from store:', data.nome);
      setNome(data.nome);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nome omesso intenzionalmente per sync one-way store -> campo
  }, [data.nome]);

  useEffect(() => {
    // ✅ FIX: Valida anche se nome è nello store ma non nel campo locale
    const nomeValue = nome.trim() || data.nome?.trim() || '';
    setIsValid(nomeValue.length > 0);
  }, [nome, data.nome]);

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
      const nomeToUse = nome.trim() || data.nome?.trim() || '';
      if (!nomeToUse || isGenerating) return;

      setIsGenerating(true);
      const payload = {
        nome: nomeToUse,
        eta,
        peso,
        altezza,
        consigliNutrizionali
      };

      try {
        updateData(payload);
        await saveAndContinue(4, payload);
        trackOnboarding.stepCompleted(4, {
          nome: nomeToUse.length,
          eta,
          peso,
          altezza,
          consigliNutrizionali
        });
        onComplete();
      } catch (error) {
        console.error('❌ ERROR in handleContinue:', error);
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
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
        >
          <User size={32} color="#EEBA2B" />
        </div>
        <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold text-[#F0EDE8] text-center leading-[1.15] tracking-[-0.5px] mb-[10px]">
          Ultimo passo per il tuo piano personalizzato
        </h1>
        <p className="text-[15px] text-[#F0EDE8]/50 text-center">
          Questi dati mi aiutano a calibrare perfettamente i tuoi allenamenti
        </p>
      </div>

      <div className="bg-[#16161A] border border-white/[0.07] rounded-[14px] p-6 space-y-6">
        {/* Nome */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center">
              <User size={18} color="#EEBA2B" />
            </div>
            <p className="text-[15px] font-semibold text-[#F0EDE8]">Come ti chiami?</p>
          </div>
          <Input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Il tuo nome"
            className="bg-[#1E1E24] border border-white/[0.07] rounded-[10px] text-[16px] text-[#F0EDE8] placeholder:text-[#F0EDE8]/30 focus:border-[#EEBA2B] focus-visible:ring-[#EEBA2B]/20 h-11"
          />
        </div>

        {/* Età */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center">
              <Calendar size={18} color="#EEBA2B" />
            </div>
            <p className="text-[15px] font-semibold text-[#F0EDE8]">
              Età: <span className="text-[#EEBA2B] font-bold">{eta}</span> anni
            </p>
          </div>
          <div className="px-2">
            <Slider
              value={[eta]}
              onValueChange={(v) => setEta(v[0])}
              min={16}
              max={80}
              step={1}
              className="[&_[role=slider]]:bg-[#EEBA2B] [&_[role=slider]]:border-[#EEBA2B] [&_[role=slider]]:w-[22px] [&_[role=slider]]:h-[22px] [&_[role=slider]]:shadow-[0_0_8px_rgba(238,186,43,0.4)] [&>.relative>span:first-child]:bg-white/10 [&>.relative>span:nth-child(2)]:bg-[#EEBA2B]"
            />
          </div>
          <div className="flex justify-between text-[12px] text-[#F0EDE8]/40 mt-1 px-1">
            <span>16</span>
            <span>80</span>
          </div>
        </div>

        {/* Peso */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center">
              <Weight size={18} color="#EEBA2B" />
            </div>
            <p className="text-[15px] font-semibold text-[#F0EDE8]">
              Peso: <span className="text-[#EEBA2B] font-bold">{peso}</span> kg
            </p>
          </div>
          <div className="px-2">
            <Slider
              value={[peso]}
              onValueChange={(v) => setPeso(v[0])}
              min={40}
              max={150}
              step={1}
              className="[&_[role=slider]]:bg-[#EEBA2B] [&_[role=slider]]:border-[#EEBA2B] [&_[role=slider]]:w-[22px] [&_[role=slider]]:h-[22px] [&_[role=slider]]:shadow-[0_0_8px_rgba(238,186,43,0.4)] [&>.relative>span:first-child]:bg-white/10 [&>.relative>span:nth-child(2)]:bg-[#EEBA2B]"
            />
          </div>
          <div className="flex justify-between text-[12px] text-[#F0EDE8]/40 mt-1 px-1">
            <span>40 kg</span>
            <span>150 kg</span>
          </div>
        </div>

        {/* Altezza */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center">
              <Ruler size={18} color="#EEBA2B" />
            </div>
            <p className="text-[15px] font-semibold text-[#F0EDE8]">
              Altezza: <span className="text-[#EEBA2B] font-bold">{altezza}</span> cm
            </p>
          </div>
          <div className="px-2">
            <Slider
              value={[altezza]}
              onValueChange={(v) => setAltezza(v[0])}
              min={140}
              max={220}
              step={1}
              className="[&_[role=slider]]:bg-[#EEBA2B] [&_[role=slider]]:border-[#EEBA2B] [&_[role=slider]]:w-[22px] [&_[role=slider]]:h-[22px] [&_[role=slider]]:shadow-[0_0_8px_rgba(238,186,43,0.4)] [&>.relative>span:first-child]:bg-white/10 [&>.relative>span:nth-child(2)]:bg-[#EEBA2B]"
            />
          </div>
          <div className="flex justify-between text-[12px] text-[#F0EDE8]/40 mt-1 px-1">
            <span>140 cm</span>
            <span>220 cm</span>
          </div>
        </div>

        {/* Sezione Professionisti */}
        <div className="rounded-[14px] p-5 bg-[rgba(238,186,43,0.06)] border border-[rgba(238,186,43,0.2)]">
          <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#F0EDE8] mb-2">
                Vuoi risultati ancora più veloci?
              </h3>
              <p className="text-[13px] text-[#F0EDE8]/70 mb-3 leading-relaxed">
                Per massimizzare i tuoi risultati e raggiungere l'obiettivo che hai scelto,
                mettiamo a tua disposizione i migliori professionisti del fitness certificati.
              </p>
              <div className="flex flex-wrap gap-[8px] mt-3 overflow-hidden">
                <div className="flex gap-[8px] flex-nowrap overflow-x-auto min-w-0 w-full md:w-auto md:overflow-visible">
                  <motion.span
                    className="flex md:hidden items-center gap-[6px] px-[12px] py-[6px] rounded-full border border-[rgba(238,186,43,0.3)] text-[#EEBA2B] text-[12px] font-medium whitespace-nowrap flex-shrink-0"
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                  >
                    <Check size={12} />
                    Personal Trainer
                  </motion.span>
                  <motion.span
                    className="flex md:hidden items-center gap-[6px] px-[12px] py-[6px] rounded-full border border-[rgba(238,186,43,0.3)] text-[#EEBA2B] text-[12px] font-medium whitespace-nowrap flex-shrink-0"
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                  >
                    <Check size={12} />
                    Nutrizionisti
                  </motion.span>
                  <span className="hidden md:inline-flex gap-2 flex-shrink-0">
                    <motion.span
                      className="text-[11px] bg-white/[0.08] text-[#EEBA2B] px-3 py-1.5 rounded-full border border-[rgba(238,186,43,0.2)]"
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    >
                      ✓ Personal Trainer
                    </motion.span>
                    <motion.span
                      className="text-[11px] bg-white/[0.08] text-[#EEBA2B] px-3 py-1.5 rounded-full border border-[rgba(238,186,43,0.2)]"
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    >
                      ✓ Nutrizionisti
                    </motion.span>
                  </span>
                </div>
                <motion.span
                  className="flex md:hidden items-center gap-[6px] px-[12px] py-[6px] rounded-full border border-[rgba(238,186,43,0.3)] text-[#EEBA2B] text-[12px] font-medium whitespace-nowrap"
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                >
                  <Check size={12} />
                  E molti altri
                </motion.span>
                <motion.span
                  className="hidden md:inline-block text-[11px] bg-white/[0.08] text-[#EEBA2B] px-3 py-1.5 rounded-full border border-[rgba(238,186,43,0.2)]"
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                >
                  ✓ E molti altri
                </motion.span>
              </div>
              <p className="text-[12px] text-[#F0EDE8]/50 mt-3">
                Potrai scegliere se e quando attivarli direttamente dall'app
              </p>
          </div>
        </div>

        {/* Info Privacy */}
        <div className="rounded-[10px] px-4 py-3 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] flex items-start gap-3">
          <Info size={16} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#F0EDE8]/80 leading-relaxed">
            I tuoi dati sono criptati e protetti. Utilizziamo queste informazioni
            solo per personalizzare i tuoi allenamenti e non le condividiamo con terzi.
          </p>
        </div>
      </div>
    </motion.div>
  );
});

Step4Personalization.displayName = 'Step4Personalization';

export default Step4Personalization;


