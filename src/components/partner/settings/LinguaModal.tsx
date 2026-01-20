// src/components/partner/settings/LinguaModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Globe, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LinguaModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageLevel {
  value: string;
  label: string;
  dbValue: string; // Valore per il database (italiano)
}

interface SavedLanguage {
  id: string;
  language_code: string;
  language_name: string;
  proficiency_level: string;
}

const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'Inglese', flag: '🇬🇧' },
  { code: 'es', name: 'Spagnolo', flag: '🇪🇸' },
  { code: 'fr', name: 'Francese', flag: '🇫🇷' },
  { code: 'de', name: 'Tedesco', flag: '🇩🇪' },
  { code: 'pt', name: 'Portoghese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russo', flag: '🇷🇺' },
  { code: 'zh', name: 'Cinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Giapponese', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabo', flag: '🇸🇦' },
  { code: 'nl', name: 'Olandese', flag: '🇳🇱' },
  { code: 'pl', name: 'Polacco', flag: '🇵🇱' },
  { code: 'ro', name: 'Rumeno', flag: '🇷🇴' },
  { code: 'uk', name: 'Ucraino', flag: '🇺🇦' },
];

const LEVELS: LanguageLevel[] = [
  { value: 'native', label: 'Madrelingua', dbValue: 'madrelingua' },
  { value: 'fluent', label: 'Fluente', dbValue: 'fluente' },
  { value: 'intermediate', label: 'Intermedio', dbValue: 'intermedio' },
  { value: 'basic', label: 'Base', dbValue: 'base' },
];

export default function LinguaModal({ onClose, onSuccess }: LinguaModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [languages, setLanguages] = useState<SavedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('native');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user?.id]);

  // Fetch lingue quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchLanguages();
    }
  }, [professionalId]);

  const loadProfessionalId = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (err: any) {
      console.error('Errore caricamento professional_id:', err);
      toast.error('Errore nel caricamento dei dati');
    }
  };

  const fetchLanguages = async () => {
    if (!professionalId) return;

    try {
      const { data, error } = await supabase
        .from('professional_languages')
        .select('*')
        .eq('professional_id', professionalId)
        .order('language_name', { ascending: true });

      if (error) throw error;
      
      setLanguages(data || []);
    } catch (err: any) {
      console.error('Errore fetch lingue:', err);
      if (err.code !== 'PGRST116') {
        toast.error('Errore nel caricamento delle lingue');
      }
    } finally {
      setLoading(false);
    }
  };

  const getLevelLabel = (dbValue: string): string => {
    const level = LEVELS.find(l => l.dbValue === dbValue);
    return level?.label || dbValue;
  };

  const getLevelBadgeClass = (dbValue: string): string => {
    switch (dbValue) {
      case 'madrelingua':
        return 'bg-[#EEBA2B]/20 text-[#EEBA2B]';
      case 'fluente':
        return 'bg-green-100 text-green-700';
      case 'intermedio':
        return 'bg-blue-100 text-blue-700';
      case 'base':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddLanguage = () => {
    if (!selectedLanguage) {
      toast.error('Seleziona una lingua');
      return;
    }

    if (!selectedLevel) {
      toast.error('Seleziona un livello');
      return;
    }

    // Verifica se la lingua è già stata aggiunta
    if (languages.some(l => l.language_code === selectedLanguage)) {
      toast.error('Lingua già presente');
      return;
    }

    const language = LANGUAGES.find(l => l.code === selectedLanguage);
    if (!language) return;

    const level = LEVELS.find(l => l.value === selectedLevel);
    if (!level) return;

    const newLanguage: SavedLanguage = {
      id: `temp-${Date.now()}`,
      language_code: language.code,
      language_name: language.name,
      proficiency_level: level.dbValue
    };

    setLanguages(prev => [...prev, newLanguage]);
    setSelectedLanguage('');
    setSelectedLevel('native');
  };

  const handleRemove = (id: string) => {
    setLanguages(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = async () => {
    if (!professionalId) {
      toast.error('Errore: professional_id non disponibile');
      return;
    }

    setSaving(true);

    try {
      // Delete tutte le lingue esistenti
      const { error: deleteError } = await supabase
        .from('professional_languages')
        .delete()
        .eq('professional_id', professionalId);

      if (deleteError) throw deleteError;

      // Insert nuove lingue
      if (languages.length > 0) {
        const languagesToInsert = languages.map(l => ({
          professional_id: professionalId,
          language_code: l.language_code,
          language_name: l.language_name,
          proficiency_level: l.proficiency_level
        }));

        const { error: insertError } = await supabase
          .from('professional_languages')
          .insert(languagesToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Lingue salvate con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore salvataggio lingue:', err);
      toast.error('Errore nel salvataggio delle lingue');
    } finally {
      setSaving(false);
    }
  };

  const availableLanguages = LANGUAGES.filter(
    lang => !languages.some(l => l.language_code === lang.code)
  );

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
              <Globe className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Lingue parlate</h2>
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
          {/* Lingue attuali */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Le tue lingue</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : languages.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nessuna lingua aggiunta</p>
            ) : (
              <div className="space-y-2">
                {languages.map((lang) => {
                  const language = LANGUAGES.find(l => l.code === lang.language_code);
                  return (
                    <div
                      key={lang.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">
                          {language?.flag || '🌍'}
                        </span>
                        <span className="font-medium text-gray-900 flex-1 min-w-0">
                          {lang.language_name}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(lang.proficiency_level)}`}
                        >
                          {getLevelLabel(lang.proficiency_level)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(lang.id)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-3"
                        type="button"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aggiungi lingua */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Aggiungi lingua</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Dropdown lingua */}
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all cursor-pointer pr-10"
                  >
                    <option value="">Seleziona lingua...</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Dropdown livello */}
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all cursor-pointer pr-10"
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={handleAddLanguage}
                disabled={!selectedLanguage || saving || availableLanguages.length === 0}
                className="w-full px-6 py-2.5 bg-[#EEBA2B] text-black rounded-xl font-medium hover:bg-[#d4a826] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Aggiungi lingua</span>
              </button>
            </div>
          </div>
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
            disabled={saving || !professionalId}
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

