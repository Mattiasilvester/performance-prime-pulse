import { useState, useEffect } from 'react';
import { Dumbbell, UtensilsCrossed, HeartPulse, Brain, Bone, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryCard } from './CategoryCard';

const categories = [
  { value: 'pt', label: 'Personal Trainer', icon: <Dumbbell /> },
  { value: 'nutrizionista', label: 'Nutrizionista', icon: <UtensilsCrossed /> },
  { value: 'fisioterapista', label: 'Fisioterapista', icon: <HeartPulse /> },
  { value: 'mental_coach', label: 'Mental Coach', icon: <Brain /> },
  { value: 'osteopata', label: 'Osteopata', icon: <Bone /> },
  { value: 'altro', label: 'Altro', icon: <Plus /> }
] as const;

interface StepCategoryProps {
  selectedCategories: string[];
  onToggle: (category: string) => void;
  customCategory?: string;
  onCustomCategoryChange?: (value: string) => void;
  error?: string;
  customCategoryError?: string;
}

export function StepCategory({ 
  selectedCategories, 
  onToggle, 
  customCategory = '',
  onCustomCategoryChange,
  error,
  customCategoryError
}: StepCategoryProps) {
  const [localCustomCategory, setLocalCustomCategory] = useState(customCategory);

  // Sincronizza con prop quando cambia dall'esterno
  useEffect(() => {
    setLocalCustomCategory(customCategory);
  }, [customCategory]);

  // Reset customCategory quando "altro" non è più selezionato
  useEffect(() => {
    if (!selectedCategories.includes('altro')) {
      setLocalCustomCategory('');
      onCustomCategoryChange?.('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories]);

  const handleCardClick = (value: string) => {
    if (selectedCategories.includes(value)) {
      if (selectedCategories.length <= 1) return;
      onToggle(value);
    } else {
      onToggle(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">La tua professione</h2>
        <p className="text-gray-600">Seleziona una o più professioni</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.value}
            icon={category.icon}
            label={category.label}
            value={category.value}
            selected={selectedCategories.includes(category.value)}
            onClick={() => handleCardClick(category.value)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedCategories.includes('altro') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <label htmlFor="custom_category" className="block text-gray-700 font-medium mb-2">
              Specifica la tua professione *
            </label>
            <input
              type="text"
              id="custom_category"
              value={localCustomCategory}
              onChange={(e) => {
                const value = e.target.value;
                setLocalCustomCategory(value);
                onCustomCategoryChange?.(value);
              }}
              placeholder="Es: Preparatore atletico, Chinesiologo, Massoterapista..."
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition ${
                customCategoryError ? 'border-red-300' : 'border-gray-600'
              }`}
            />
            {customCategoryError && (
              <p className="mt-1 text-sm text-red-600">{customCategoryError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

