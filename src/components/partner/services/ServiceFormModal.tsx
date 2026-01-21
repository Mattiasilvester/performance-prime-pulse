// src/components/partner/services/ServiceFormModal.tsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { ProfessionalService } from '@/services/professionalServicesService';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_online: boolean;
  is_in_person: boolean;
  color: string;
  is_active: boolean;
}

const DEFAULT_SERVICE: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: 0,
  is_online: false,
  is_in_person: true,
  color: '#EEBA2B',
  is_active: true,
};

const SERVICE_COLORS = [
  { value: '#EEBA2B', label: 'Oro', emoji: '🟡' },
  { value: '#3B82F6', label: 'Blu', emoji: '🔵' },
  { value: '#22C55E', label: 'Verde', emoji: '🟢' },
  { value: '#EF4444', label: 'Rosso', emoji: '🔴' },
  { value: '#A855F7', label: 'Viola', emoji: '🟣' },
  { value: '#F97316', label: 'Arancione', emoji: '🟠' },
  { value: '#1F2937', label: 'Nero', emoji: '⚫' },
];

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => Promise<void>;
  service?: ProfessionalService | null; // Se presente, è in modalità modifica
}

export const ServiceFormModal = ({ isOpen, onClose, onSave, service }: ServiceFormModalProps) => {
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_SERVICE);
  const [saving, setSaving] = useState(false);
  // Stati locali per input numerici (permettono campo vuoto durante digitazione)
  const [durationInput, setDurationInput] = useState<string>('60');
  const [priceInput, setPriceInput] = useState<string>('0');

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_online: service.is_online,
        is_in_person: service.is_in_person ?? true, // Usa is_in_person dal database, default true
        color: service.color,
        is_active: service.is_active,
      });
      // Aggiorna anche gli input locali
      setDurationInput(service.duration_minutes.toString());
      setPriceInput(service.price.toString());
    } else {
      setFormData(DEFAULT_SERVICE);
      setDurationInput('60');
      setPriceInput('0');
    }
  }, [service, isOpen]);

  const validate = (): string | null => {
    if (!formData.name.trim()) return 'Inserisci il nome del servizio';
    
    // Converti input stringhe a numeri per validazione
    const duration = parseFloat(durationInput) || 0;
    const price = parseFloat(priceInput) || 0;
    
    if (duration < 5) return 'La durata deve essere almeno 5 minuti';
    if (price < 0) return 'Il prezzo non può essere negativo';
    if (!formData.is_online && !formData.is_in_person) return 'Seleziona almeno una modalità';
    return null;
  };

  const handleSubmit = async () => {
    // Converti input stringhe a numeri prima di salvare
    const duration = parseFloat(durationInput) || 0;
    const price = parseFloat(priceInput) || 0;
    
    const dataToSave: ServiceFormData = {
      ...formData,
      duration_minutes: duration,
      price: price,
    };
    
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      // Errore gestito nel parent
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? '✏️ Modifica Servizio' : '✨ Nuovo Servizio'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome servizio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="es. Seduta Personal Training"
              disabled={saving}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrivi il servizio offerto..."
              rows={3}
              disabled={saving}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none resize-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Durata e Prezzo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏱️ Durata (minuti) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={durationInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permetti solo numeri e campo vuoto
                  if (value === '' || /^\d+$/.test(value)) {
                    setDurationInput(value);
                    // Aggiorna formData solo se è un numero valido
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                      setFormData(prev => ({ ...prev, duration_minutes: num }));
                    }
                  }
                }}
                onBlur={(e) => {
                  // Se campo vuoto, ripristina valore precedente o default
                  if (e.target.value === '' || parseFloat(e.target.value) < 5) {
                    const currentValue = formData.duration_minutes || 60;
                    setDurationInput(currentValue.toString());
                    setFormData(prev => ({ ...prev, duration_minutes: currentValue }));
                  }
                }}
                placeholder="60"
                disabled={saving}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💰 Prezzo (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permetti numeri, punto decimale e campo vuoto
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setPriceInput(value);
                    // Aggiorna formData solo se è un numero valido
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                      setFormData(prev => ({ ...prev, price: num }));
                    } else if (value === '') {
                      // Se campo vuoto, imposta a 0 nel formData ma mantieni input vuoto
                      setFormData(prev => ({ ...prev, price: 0 }));
                    }
                  }
                }}
                onBlur={(e) => {
                  // Se campo vuoto o non valido, ripristina valore precedente o 0
                  const num = parseFloat(e.target.value);
                  if (isNaN(num) || num < 0) {
                    const currentValue = formData.price || 0;
                    setPriceInput(currentValue.toString());
                    setFormData(prev => ({ ...prev, price: currentValue }));
                  } else {
                    // Normalizza il valore (es. "5." -> "5.0")
                    setPriceInput(num.toString());
                    setFormData(prev => ({ ...prev, price: num }));
                  }
                }}
                placeholder="0.00"
                disabled={saving}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Modalità */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalità <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_in_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_in_person: e.target.checked }))}
                  disabled={saving}
                  className="w-5 h-5 rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">🏠 In presenza</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_online}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_online: e.target.checked }))}
                  disabled={saving}
                  className="w-5 h-5 rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">💻 Online</span>
              </label>
            </div>
          </div>

          {/* Colore */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore (per calendario)
            </label>
            <div className="flex gap-2 flex-wrap">
              {SERVICE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  disabled={saving}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-[#EEBA2B] scale-110'
                      : 'hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.value + '20' }}
                  title={color.label}
                >
                  {color.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Attivo */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Servizio attivo</p>
              <p className="text-sm text-gray-500">Il servizio sarà visibile durante la prenotazione</p>
            </div>
            <ToggleSwitch
              checked={formData.is_active}
              onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              disabled={saving}
              aria-label="Servizio attivo"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#EEBA2B] text-black font-semibold py-3 rounded-xl hover:bg-[#d4a827] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
};
