// src/components/partner/bookings/ClientAutocomplete.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Search, Loader2, Plus, Check } from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
}

interface ClientAutocompleteProps {
  professionalId: string;
  value: string;
  onChange: (value: string) => void;
  onClientSelect: (client: Client | null) => void;
  onCreateNewClient: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ClientAutocomplete = ({
  professionalId,
  value,
  onChange,
  onClientSelect,
  onCreateNewClient,
  placeholder = 'Cerca o scrivi nome cliente...',
  disabled = false,
}: ClientAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clienti che corrispondono alla ricerca
  useEffect(() => {
    const searchClients = async () => {
      // Mostra dropdown solo dopo 2 caratteri
      if (value.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .eq('professional_id', professionalId)
          .ilike('full_name', `%${value}%`)
          .order('full_name', { ascending: true })
          .limit(7);

        if (error) throw error;
        
        setSuggestions(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Errore ricerca clienti:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce per evitare troppe richieste
    const debounceTimer = setTimeout(searchClients, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, professionalId]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestione selezione cliente
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    onChange(client.full_name);
    onClientSelect(client);
    setShowDropdown(false);
  };

  // Gestione input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Se l'utente modifica il testo dopo aver selezionato, resetta la selezione
    if (selectedClient && newValue !== selectedClient.full_name) {
      setSelectedClient(null);
      onClientSelect(null);
    }
  };

  // Gestione focus input
  const handleInputFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Gestione creazione nuovo cliente
  const handleCreateNew = () => {
    setShowDropdown(false);
    onCreateNewClient();
  };

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border rounded-xl px-4 py-3 pl-10 pr-10 outline-none transition
            ${selectedClient 
              ? 'border-green-300 bg-green-50 text-gray-900' 
              : 'border-gray-200 text-white placeholder:text-gray-400 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        {/* Icona sinistra */}
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {/* Icona destra */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : selectedClient ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </span>
      </div>

      {/* Dropdown suggerimenti */}
      {showDropdown && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {/* Risultati */}
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ricerca in corso...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-700">{client.full_name}</span>
                </button>
              ))}
            </div>
          ) : value.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Nessun cliente trovato per "{value}"
            </div>
          ) : null}

          {/* Separatore */}
          {(suggestions.length > 0 || (value.length >= 2 && !loading)) && (
            <div className="border-t border-gray-100" />
          )}

          {/* Bottone crea nuovo */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="w-full px-4 py-3 text-left hover:bg-[#EEBA2B]/10 flex items-center gap-3 transition-colors text-[#EEBA2B] font-medium"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Crea nuovo cliente</span>
          </button>
        </div>
      )}

      {/* Indicatore cliente selezionato */}
      {selectedClient && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>Cliente selezionato: {selectedClient.full_name}</span>
        </p>
      )}
    </div>
  );
};

export default ClientAutocomplete;
