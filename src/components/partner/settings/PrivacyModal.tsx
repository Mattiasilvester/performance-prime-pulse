// src/components/partner/settings/PrivacyModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Lock, Loader2, User, Star, Euro, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface PrivacyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PRIVACY_FIELDS = [
  {
    key: 'profile_public',
    label: 'Profilo pubblico',
    description: 'Il tuo profilo è visibile nella ricerca pubblica',
    icon: User,
    defaultValue: true
  },
  {
    key: 'show_reviews',
    label: 'Mostra recensioni',
    description: 'Le recensioni dei clienti sono visibili sul tuo profilo',
    icon: Star,
    defaultValue: true
  },
  {
    key: 'show_price',
    label: 'Mostra prezzi',
    description: 'I prezzi dei tuoi servizi sono visibili pubblicamente',
    icon: Euro,
    defaultValue: true
  },
  {
    key: 'allow_direct_contact',
    label: 'Consenti contatto diretto',
    description: 'I clienti possono contattarti direttamente senza prenotare',
    icon: Phone,
    defaultValue: true
  },
] as const;

export default function PrivacyModal({ onClose, onSuccess }: PrivacyModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  // Carica impostazioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchPrivacySettings();
    }
  }, [professionalId]);

  const loadProfessionalId = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      if (error.code !== 'PGRST116') { // Ignora se non trovato
        toast.error('Errore nel caricamento dei dati');
      }
    }
  };

  const fetchPrivacySettings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_settings')
        .select('profile_public, show_reviews, show_price, allow_direct_contact')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;

      // Inizializza con valori dal database o default
      const initialData: Record<string, boolean> = {};
      PRIVACY_FIELDS.forEach(field => {
        initialData[field.key] = data?.[field.key as keyof typeof data] ?? field.defaultValue;
      });

      setFormData(initialData);
    } catch (err: any) {
      console.error('Errore fetch privacy:', err);
      if (err.code !== 'PGRST116') { // Ignora se non trovato
        toast.error('Errore nel caricamento delle preferenze');
      }
      // Usa valori default se errore
      const defaultData: Record<string, boolean> = {};
      PRIVACY_FIELDS.forEach(field => {
        defaultData[field.key] = field.defaultValue;
      });
      setFormData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('professional_settings')
        .upsert({
          professional_id: professionalId,
          profile_public: formData.profile_public,
          show_reviews: formData.show_reviews,
          show_price: formData.show_price,
          allow_direct_contact: formData.allow_direct_contact,
          updated_at: new Date().toISOString()
        }, { onConflict: 'professional_id' });

      if (error) throw error;

      toast.success('Impostazioni privacy salvate con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore salvataggio privacy:', err);
      toast.error('Errore nel salvataggio delle preferenze');
    } finally {
      setSaving(false);
    }
  };

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
              <Lock className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Impostazioni Privacy</h2>
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
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Controlla la visibilità del tuo profilo e delle tue informazioni.
              </p>

              <div className="space-y-0">
                {PRIVACY_FIELDS.map((field, index) => (
                  <React.Fragment key={field.key}>
                    {index > 0 && (
                      <div className="border-t border-gray-100 my-0" />
                    )}
                    
                    <div className="flex justify-between items-start py-4">
                      {/* Left: Icon + Content */}
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                        <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded-lg">
                          {React.createElement(field.icon, { className: 'w-5 h-5 text-gray-600' })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-0.5">
                            {field.label}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {field.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Toggle Switch - Stile iOS/Apple */}
                      <div className="flex-shrink-0">
                        <ToggleSwitch
                          checked={formData[field.key] ?? field.defaultValue}
                          onChange={(checked) => handleToggle(field.key)}
                          disabled={saving}
                          aria-label={`Toggle ${field.label}`}
                        />
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb',
            flexShrink: 0,
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: saving || loading ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              opacity: saving || loading ? 0.5 : 1
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>Salva</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizza usando Portal direttamente nel body
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}
