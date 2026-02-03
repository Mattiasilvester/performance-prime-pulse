import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Home, RefreshCw, Euro, Info } from 'lucide-react';

interface StepModalitaPrezziProps {
  data: {
    modalita: 'online' | 'presenza' | 'entrambi';
    prezzo_seduta: number | null;
    prezzo_fascia: '€' | '€€' | '€€€';
  };
  onChange: (field: string, value: string | number | null) => void;
  errors: Record<string, string>;
}

const modalitaOptions = [
  { value: 'online', label: 'Online', icon: <Monitor className="w-5 h-5" />, description: 'Solo sessioni virtuali' },
  { value: 'presenza', label: 'In presenza', icon: <Home className="w-5 h-5" />, description: 'Solo sessioni in studio' },
  { value: 'entrambi', label: 'Entrambi', icon: <RefreshCw className="w-5 h-5" />, description: 'Online e in presenza' }
] as const;

const prezzoFasciaOptions = [
  { value: '€', label: '€ Economico', description: 'Fino a 50€' },
  { value: '€€', label: '€€ Medio', description: '50€ - 100€' },
  { value: '€€€', label: '€€€ Premium', description: 'Oltre 100€' }
] as const;

export function StepModalitaPrezzi({ data, onChange, errors }: StepModalitaPrezziProps) {
  const [prezzoInput, setPrezzoInput] = useState<string>(data.prezzo_seduta?.toString() || '');

  // Calcola automaticamente prezzo_fascia da prezzo_seduta
  useEffect(() => {
    if (data.prezzo_seduta !== null && data.prezzo_seduta !== undefined) {
      let calculatedFascia: '€' | '€€' | '€€€' = '€€';
      if (data.prezzo_seduta < 50) {
        calculatedFascia = '€';
      } else if (data.prezzo_seduta >= 50 && data.prezzo_seduta < 100) {
        calculatedFascia = '€€';
      } else if (data.prezzo_seduta >= 100) {
        calculatedFascia = '€€€';
      }
      
      // Aggiorna solo se non è stato impostato manualmente o se è diverso
      if (data.prezzo_fascia !== calculatedFascia) {
        onChange('prezzo_fascia', calculatedFascia);
      }
    }
  }, [data.prezzo_seduta, data.prezzo_fascia, onChange]);

  const handlePrezzoChange = (value: string) => {
    setPrezzoInput(value);
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue === null || (!isNaN(numValue) && numValue >= 0 && numValue <= 1000)) {
      onChange('prezzo_seduta', numValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modalità e Prezzi</h2>
        <p className="text-gray-600">Come vuoi lavorare e quanto vuoi far pagare?</p>
      </div>

      {/* Modalità */}
      <div>
        <label className="block text-gray-700 font-medium mb-3">
          Modalità di lavoro *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modalitaOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('modalita', option.value)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center gap-2
                ${
                  data.modalita === option.value
                    ? 'border-[var(--partner-accent)] bg-[var(--partner-accent)]/10'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}
            >
              <div className={`${data.modalita === option.value ? 'text-[var(--partner-accent)]' : 'text-gray-600'}`}>
                {option.icon}
              </div>
              <div className="text-center">
                <p className={`font-semibold ${data.modalita === option.value ? 'text-gray-900' : 'text-gray-700'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.modalita && (
          <p className="mt-2 text-sm text-red-600">{errors.modalita}</p>
        )}
      </div>

      {/* Prezzo Seduta */}
      <div>
        <label htmlFor="prezzo_seduta" className="block text-gray-700 font-medium mb-2">
          Prezzo per seduta (€)
          <span className="text-gray-400 text-sm font-normal ml-1">(opzionale)</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <Euro className="w-5 h-5" />
          </div>
          <input
            type="number"
            id="prezzo_seduta"
            value={prezzoInput}
            onChange={(e) => handlePrezzoChange(e.target.value)}
            min="0"
            max="1000"
            step="5"
            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.prezzo_seduta ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Es: 50, 80, 100"
          />
        </div>
        {errors.prezzo_seduta && (
          <p className="mt-1 text-sm text-red-600">{errors.prezzo_seduta}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Se non specifichi un prezzo, verrà usata la fascia prezzo come riferimento
        </p>
      </div>

      {/* Fascia Prezzo */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Fascia prezzo
          {data.prezzo_seduta && (
            <span className="text-gray-400 text-sm font-normal ml-1">
              (calcolata automaticamente: {data.prezzo_fascia})
            </span>
          )}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {prezzoFasciaOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('prezzo_fascia', option.value)}
              disabled={!!data.prezzo_seduta}
              className={`
                p-3 rounded-xl border-2 transition-all duration-200 text-left
                ${
                  data.prezzo_fascia === option.value
                    ? 'border-[var(--partner-accent)] bg-[var(--partner-accent)]/10'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
                ${data.prezzo_seduta ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <p className={`font-semibold text-lg ${data.prezzo_fascia === option.value ? 'text-gray-900' : 'text-gray-700'}`}>
                {option.value}
              </p>
              <p className="text-sm text-gray-600 mt-1">{option.label}</p>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
        {data.prezzo_seduta && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              La fascia prezzo è stata calcolata automaticamente dal prezzo seduta. Puoi modificarla dopo la registrazione.
            </p>
          </div>
        )}
        {errors.prezzo_fascia && (
          <p className="mt-2 text-sm text-red-600">{errors.prezzo_fascia}</p>
        )}
      </div>
    </motion.div>
  );
}
