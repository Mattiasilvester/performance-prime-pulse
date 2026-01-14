import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TagsInput } from './TagsInput';

interface StepProfessionalInfoProps {
  data: {
    city: string;
    titolo_studio: string;
    certificazioni: string[];
    studio_sede: string;
  };
  onChange: (field: string, value: string | string[]) => void;
  errors: Record<string, string>;
}

export function StepProfessionalInfo({ data, onChange, errors }: StepProfessionalInfoProps) {
  const [suggestions, setSuggestions] = useState<Array<{display_name: string; place_id: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Funzione per cercare indirizzi
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=it&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'it'
          }
        }
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Errore ricerca indirizzo:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler con debounce
  const handleStudioSedeChange = (value: string) => {
    onChange('studio_sede', value);
    
    // Cancella il timer precedente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Nuovo timer con debounce 400ms
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 400);
  };

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Click outside per chiudere suggerimenti
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informazioni professionali</h2>
        <p className="text-gray-600">Raccontaci di più sulla tua attività</p>
      </div>

      <div>
        <label htmlFor="city" className="block text-gray-700 font-medium mb-2">
          Città *
        </label>
        <input
          type="text"
          id="city"
          value={data.city}
          onChange={(e) => onChange('city', e.target.value)}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
            errors.city ? 'border-red-300' : 'border-gray-600'
          }`}
          placeholder="Milano"
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
        )}
      </div>

      <div>
        <label htmlFor="titolo_studio" className="block text-gray-700 font-medium mb-2">
          Titolo di studio *
        </label>
        <input
          type="text"
          id="titolo_studio"
          value={data.titolo_studio}
          onChange={(e) => onChange('titolo_studio', e.target.value)}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
            errors.titolo_studio ? 'border-red-300' : 'border-gray-600'
          }`}
          placeholder="Es: Laurea in Scienze Motorie"
        />
        {errors.titolo_studio && (
          <p className="mt-1 text-sm text-red-600">{errors.titolo_studio}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Certificazioni *
          <span className="text-gray-400 text-sm font-normal ml-1">(premi Enter per aggiungere)</span>
        </label>
        <TagsInput
          tags={data.certificazioni}
          onChange={(tags) => onChange('certificazioni', tags)}
          placeholder="Es: Personal Trainer ISSA, Nutrizionista Sportivo..."
          maxTags={10}
        />
        {errors.certificazioni && (
          <p className="mt-1 text-sm text-red-600">{errors.certificazioni}</p>
        )}
        {data.certificazioni.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Aggiungi almeno una certificazione
          </p>
        )}
      </div>

      <div className="relative" ref={suggestionsRef}>
        <label htmlFor="studio_sede" className="block text-gray-700 font-medium mb-2">
          Studio/Sede *
        </label>
        <div className="relative">
          <input
            type="text"
            id="studio_sede"
            value={data.studio_sede}
            onChange={(e) => handleStudioSedeChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.studio_sede ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Inserisci l'indirizzo del tuo studio..."
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Dropdown suggerimenti */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => {
                  onChange('studio_sede', suggestion.display_name);
                  setShowSuggestions(false);
                  setSuggestions([]);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-orange-50 border-b border-gray-100 last:border-0 text-sm transition-colors duration-150"
              >
                📍 {suggestion.display_name}
              </button>
            ))}
          </div>
        )}
        
        {errors.studio_sede && (
          <p className="mt-1 text-sm text-red-600">{errors.studio_sede}</p>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Oppure scrivi "Freelance" se lavori a domicilio
        </p>
      </div>
    </motion.div>
  );
}

