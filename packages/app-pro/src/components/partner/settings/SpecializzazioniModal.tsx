// src/components/partner/settings/SpecializzazioniModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { X, Tag, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@pp/shared';

interface SpecializzazioniModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SUGGESTIONS = [
  'Personal Training', 'Functional Training', 'Yoga', 'Pilates', 
  'CrossFit', 'Calisthenics', 'Powerlifting', 'Bodybuilding',
  'HIIT', 'Boxe / Kickboxing', 'Riabilitazione', 'Posturale',
  'Nutrizione sportiva', 'Preparazione atletica', 'Stretching',
  'Allenamento over 50', 'Allenamento pre/post parto', 'Mental coaching',
  'Dimagrimento', 'Tonificazione', 'Massa muscolare'
];

export default function SpecializzazioniModal({ onClose, onSuccess }: SpecializzazioniModalProps) {
  const { user } = useAuth();
  const [specializzazioni, setSpecializzazioni] = useState<string[]>([]);
  const [newSpecializzazione, setNewSpecializzazione] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch specializzazioni iniziali
  useEffect(() => {
    fetchSpecializzazioni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchSpecializzazioni = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('specializzazioni')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setSpecializzazioni(data?.specializzazioni || []);
    } catch (err: unknown) {
      console.error('Errore fetch specializzazioni:', err);
      if ((err as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento delle specializzazioni');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromInput = () => {
    const trimmed = newSpecializzazione.trim();
    if (!trimmed) {
      toast.error('Inserisci una specializzazione');
      return;
    }

    if (specializzazioni.includes(trimmed)) {
      toast.error('Specializzazione già presente');
      setNewSpecializzazione('');
      return;
    }

    setSpecializzazioni(prev => [...prev, trimmed]);
    setNewSpecializzazione('');
  };

  const handleAddFromSuggestion = (suggestion: string) => {
    if (specializzazioni.includes(suggestion)) {
      return; // Già presente, non fare nulla
    }

    setSpecializzazioni(prev => [...prev, suggestion]);
  };

  const handleRemove = (index: number) => {
    setSpecializzazioni(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Utente non autenticato');
      return;
    }

    setSaving(true);

    try {
      // Rimuovi duplicati e ordina
      const uniqueSpecializzazioni = [...new Set(specializzazioni)].filter(s => s.trim());

      const { error } = await supabase
        .from('professionals')
        .update({ specializzazioni: uniqueSpecializzazioni })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Specializzazioni salvate con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore salvataggio specializzazioni:', err);
      toast.error('Errore nel salvataggio delle specializzazioni');
    } finally {
      setSaving(false);
    }
  };

  const availableSuggestions = SUGGESTIONS.filter(s => !specializzazioni.includes(s));

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        style={{ 
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: '24px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
              <Tag className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Specializzazioni</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - scrollabile */}
        <div 
          style={{ 
            flex: 1,
            overflowY: 'scroll',
            minHeight: 0,
            padding: '24px'
          }}
          className="space-y-6"
        >
          {/* Specializzazioni attuali */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Le tue specializzazioni</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : specializzazioni.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nessuna specializzazione aggiunta</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {specializzazioni.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#EEBA2B]/20 text-[#EEBA2B] rounded-full px-3 py-1.5 font-medium"
                  >
                    <span>{spec}</span>
                    <button
                      onClick={() => handleRemove(index)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-[#EEBA2B]/30 rounded-full transition-colors flex-shrink-0"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aggiungi da input */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Aggiungi specializzazione</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpecializzazione}
                onChange={(e) => setNewSpecializzazione(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFromInput();
                  }
                }}
                placeholder="Es: Preparazione atletica..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddFromInput}
                className="px-6 py-2.5 bg-[#EEBA2B] text-black rounded-xl font-medium hover:bg-[#d4a826] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newSpecializzazione.trim() || saving}
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Suggerimenti */}
          {availableSuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggerimenti</h3>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddFromSuggestion(suggestion)}
                    className="flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 font-medium hover:bg-gray-200 transition-colors"
                    type="button"
                    disabled={saving}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{ 
            padding: '24px',
            borderTop: '1px solid #f3f4f6',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#EEBA2B] text-black rounded-xl font-medium hover:bg-[#d4a826] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
}

