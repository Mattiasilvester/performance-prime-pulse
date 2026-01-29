// src/components/partner/settings/CancellationPolicyModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, FileText, Loader2, Clock, Euro, Ban, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface CancellationPolicyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CancellationFormData {
  cancellation_policy_enabled: boolean;
  cancellation_min_hours: number;
  cancellation_penalty_percent: number;
  no_show_penalty_percent: number;
}

const DEFAULT_VALUES: CancellationFormData = {
  cancellation_policy_enabled: false,
  cancellation_min_hours: 24,
  cancellation_penalty_percent: 0,
  no_show_penalty_percent: 50,
};

interface NumberInputStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

const NumberInputStepper = ({ value, onChange, min, max, step, disabled = false }: NumberInputStepperProps) => {
  const decrease = () => {
    if (!disabled && value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const increase = () => {
    if (!disabled && value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    if (!disabled) {
      onChange(Math.min(max, Math.max(min, val)));
    }
  };

  return (
    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || value <= min}
        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-24 text-center text-xl font-semibold border-0 focus:ring-0 focus:outline-none bg-white text-gray-900 disabled:bg-gray-50"
      />
      <button
        type="button"
        onClick={increase}
        disabled={disabled || value >= max}
        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronUp className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};

const PolicySummary = ({ formData }: { formData: CancellationFormData }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <div className="font-medium text-gray-700 flex items-center gap-2">
        <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
          <Info className="w-4 h-4 text-gray-600" />
        </div>
        <span>Riepilogo politica</span>
      </div>
      <ul className="text-sm text-gray-600 space-y-1 ml-7">
        <li>• Cancellazione gratuita fino a {formData.cancellation_min_hours} ore prima</li>
        <li>• Cancellazione tardiva: {formData.cancellation_penalty_percent}% di penale</li>
        <li>• Mancata presenza: {formData.no_show_penalty_percent}% di penale</li>
      </ul>
    </div>
  );
};

export default function CancellationPolicyModal({ onClose, onSuccess }: CancellationPolicyModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CancellationFormData>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadProfessionalId depends on user, avoid re-run on fn identity
  }, [user]);

  // Carica impostazioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchCancellationSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch only when professionalId is set
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
    } catch (error: unknown) {
      console.error('Errore caricamento professional_id:', error);
      if ((error as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento dei dati');
      }
    }
  };

  const fetchCancellationSettings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_settings')
        .select('cancellation_policy_enabled, cancellation_min_hours, cancellation_penalty_percent, no_show_penalty_percent')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          cancellation_policy_enabled: data.cancellation_policy_enabled ?? DEFAULT_VALUES.cancellation_policy_enabled,
          cancellation_min_hours: data.cancellation_min_hours ?? DEFAULT_VALUES.cancellation_min_hours,
          cancellation_penalty_percent: data.cancellation_penalty_percent ?? DEFAULT_VALUES.cancellation_penalty_percent,
          no_show_penalty_percent: data.no_show_penalty_percent ?? DEFAULT_VALUES.no_show_penalty_percent,
        });
      }
    } catch (err: unknown) {
      console.error('Errore fetch politiche cancellazione:', err);
      if ((err as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento delle impostazioni');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CancellationFormData, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
          cancellation_policy_enabled: formData.cancellation_policy_enabled,
          cancellation_min_hours: formData.cancellation_min_hours,
          cancellation_penalty_percent: formData.cancellation_penalty_percent,
          no_show_penalty_percent: formData.no_show_penalty_percent,
          updated_at: new Date().toISOString()
        }, { onConflict: 'professional_id' });

      if (error) throw error;

      toast.success('Politiche di cancellazione salvate con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore salvataggio politiche cancellazione:', err);
      toast.error('Errore nel salvataggio delle impostazioni');
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
              <FileText className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Politiche di Cancellazione</h2>
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
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Definisci le regole per cancellazioni e mancate presenze.
              </p>

              {/* Toggle attiva/disattiva politiche */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Politiche di cancellazione attive</p>
                    <p className="text-xs text-gray-500 mt-0.5">Attiva o disattiva le politiche di cancellazione</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={formData.cancellation_policy_enabled}
                  onChange={(checked) => handleChange('cancellation_policy_enabled', checked)}
                  disabled={saving || loading}
                  aria-label="Politiche di cancellazione attive"
                />
              </div>

              {/* Preavviso minimo */}
              <div className="space-y-3 py-4 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>Preavviso minimo per cancellazione</span>
                </label>
                <p className="text-sm text-gray-500 ml-7">
                  Il cliente deve cancellare con almeno:
                </p>
                <div className="ml-7 flex items-center gap-4">
                  <NumberInputStepper
                    value={formData.cancellation_min_hours}
                    onChange={(value) => handleChange('cancellation_min_hours', value)}
                    min={0}
                    max={168}
                    step={1}
                    disabled={saving || loading || !formData.cancellation_policy_enabled}
                  />
                  <span className="text-sm text-gray-600">ore di anticipo</span>
                </div>
              </div>

              {/* Penale cancellazione tardiva */}
              <div className="space-y-3 py-4 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Euro className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>Penale per cancellazione tardiva</span>
                </label>
                <p className="text-sm text-gray-500 ml-7">
                  Se il cliente cancella dopo il termine:
                </p>
                <div className="ml-7 flex items-center gap-4">
                  <NumberInputStepper
                    value={formData.cancellation_penalty_percent}
                    onChange={(value) => handleChange('cancellation_penalty_percent', value)}
                    min={0}
                    max={100}
                    step={5}
                    disabled={saving || loading || !formData.cancellation_policy_enabled}
                  />
                  <span className="text-sm text-gray-600">% del prezzo della seduta</span>
                </div>
              </div>

              {/* Penale no-show */}
              <div className="space-y-3 py-4 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Ban className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>Penale per mancata presenza (no-show)</span>
                </label>
                <p className="text-sm text-gray-500 ml-7">
                  Se il cliente non si presenta:
                </p>
                <div className="ml-7 flex items-center gap-4">
                  <NumberInputStepper
                    value={formData.no_show_penalty_percent}
                    onChange={(value) => handleChange('no_show_penalty_percent', value)}
                    min={0}
                    max={100}
                    step={5}
                    disabled={saving || loading || !formData.cancellation_policy_enabled}
                  />
                  <span className="text-sm text-gray-600">% del prezzo della seduta</span>
                </div>
              </div>

              {/* Riepilogo */}
              <PolicySummary formData={formData} />
            </div>
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