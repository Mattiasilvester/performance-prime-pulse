import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Dumbbell, Home, Building2 } from 'lucide-react';
import type { Equipment } from '@/types/plan';

const EQUIPMENT_OPTIONS: Array<{
  value: Equipment;
  label: string;
  icon: typeof Dumbbell;
  description: string;
}> = [
  {
    value: 'Corpo libero',
    label: 'Corpo libero',
    icon: Home,
    description: 'Nessuna attrezzatura necessaria',
  },
  {
    value: 'Manubri/Pesi',
    label: 'Manubri/Pesi',
    icon: Dumbbell,
    description: 'Pesi portatili o manubri',
  },
  {
    value: 'Palestra completa',
    label: 'Palestra completa',
    icon: Building2,
    description: 'Accesso a macchine e attrezzature',
  },
];

export function DailyPlanStep3() {
  const { dailyEquipment, setDailyEquipment, nextStep } = usePlanCreationStore();
  const [selectedValue, setSelectedValue] = useState<Equipment | null>(null);

  const handleSelect = (equipment: Equipment) => {
    // 1. Mostra feedback visivo immediato
    setSelectedValue(equipment);

    // 2. Salva nello store
    setDailyEquipment(equipment);

    // 3. Delay 600ms prima di cambiare step
    setTimeout(() => {
      nextStep();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Cosa hai a disposizione?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli l'attrezzatura disponibile
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {EQUIPMENT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = dailyEquipment === option.value;
          const isJustSelected = selectedValue === option.value;

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                p-6 rounded-xl text-left
                border-2 transition-all duration-300
                hover:scale-105
                ${isSelected || isJustSelected
                  ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20 scale-105'
                  : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                }
              `}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`
                  p-4 rounded-lg mb-4
                  ${isSelected ? 'bg-[#EEBA2B]' : 'bg-white/10'}
              `}
                >
                  <Icon
                    className={`
                    h-8 w-8
                    ${isSelected ? 'text-black' : 'text-white'}
                  `}
                  />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">
                  {option.label}
                </h3>
                <p className="text-sm text-gray-400">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

