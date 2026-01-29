// src/components/partner/settings/CoverageAreaModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, MapPin, Loader2, Home, Building2, Mail, Globe, Navigation } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CoverageAreaModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CoverageFormData {
  coverage_address: string;
  coverage_city: string;
  coverage_postal_code: string;
  coverage_country: string;
  coverage_latitude: number | null;
  coverage_longitude: number | null;
  coverage_radius_km: number;
}

const DEFAULT_VALUES: CoverageFormData = {
  coverage_address: '',
  coverage_city: '',
  coverage_postal_code: '',
  coverage_country: 'Italia',
  coverage_latitude: null,
  coverage_longitude: null,
  coverage_radius_km: 10,
};

const COUNTRIES = [
  { value: 'Italia', label: 'Italia' },
  { value: 'Svizzera', label: 'Svizzera' },
  { value: 'Francia', label: 'Francia' },
  { value: 'Germania', label: 'Germania' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Spagna', label: 'Spagna' },
  { value: 'Regno Unito', label: 'Regno Unito' },
  { value: 'Altro', label: 'Altro' },
];

export default function CoverageAreaModal({ onClose, onSuccess }: CoverageAreaModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoverageFormData>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  // Carica impostazioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchCoverageSettings();
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
      if (error.code !== 'PGRST116') {
        toast.error('Errore nel caricamento dei dati');
      }
    }
  };

  const fetchCoverageSettings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_settings')
        .select('coverage_address, coverage_city, coverage_postal_code, coverage_country, coverage_latitude, coverage_longitude, coverage_radius_km')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          coverage_address: data.coverage_address || '',
          coverage_city: data.coverage_city || '',
          coverage_postal_code: data.coverage_postal_code || '',
          coverage_country: data.coverage_country || 'Italia',
          coverage_latitude: data.coverage_latitude || null,
          coverage_longitude: data.coverage_longitude || null,
          coverage_radius_km: data.coverage_radius_km || 10,
        });
      }
    } catch (err: any) {
      console.error('Errore fetch area copertura:', err);
      if (err.code !== 'PGRST116') {
        toast.error('Errore nel caricamento delle impostazioni');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CoverageFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          coverage_latitude: parseFloat(position.coords.latitude.toFixed(6)),
          coverage_longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        setLoadingLocation(false);
        toast.success('Posizione rilevata con successo!');
      },
      (error) => {
        setLoadingLocation(false);
        let errorMessage = 'Impossibile rilevare la posizione';
        if (error.code === 1) {
          errorMessage = 'Permesso geolocalizzazione negato';
        } else if (error.code === 2) {
          errorMessage = 'Posizione non disponibile';
        } else if (error.code === 3) {
          errorMessage = 'Timeout richiesta posizione';
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
          coverage_address: formData.coverage_address || null,
          coverage_city: formData.coverage_city || null,
          coverage_postal_code: formData.coverage_postal_code || null,
          coverage_country: formData.coverage_country || 'Italia',
          coverage_latitude: formData.coverage_latitude || null,
          coverage_longitude: formData.coverage_longitude || null,
          coverage_radius_km: formData.coverage_radius_km || 10,
          updated_at: new Date().toISOString()
        }, { onConflict: 'professional_id' });

      if (error) throw error;

      toast.success('Area di copertura salvata con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore salvataggio area copertura:', err);
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
              <MapPin className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Area di Copertura</h2>
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
                Definisci la zona in cui offri i tuoi servizi.
              </p>

              {/* Indirizzo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Home className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>Indirizzo</span>
                </label>
                <input
                  type="text"
                  value={formData.coverage_address}
                  onChange={(e) => handleChange('coverage_address', e.target.value)}
                  placeholder="Via Roma 123"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all"
                />
              </div>

              {/* Città e CAP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Città</span>
                  </label>
                  <input
                    type="text"
                    value={formData.coverage_city}
                    onChange={(e) => handleChange('coverage_city', e.target.value)}
                    placeholder="Milano"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>CAP</span>
                  </label>
                  <input
                    type="text"
                    value={formData.coverage_postal_code}
                    onChange={(e) => handleChange('coverage_postal_code', e.target.value.slice(0, 10))}
                    placeholder="20121"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all"
                  />
                </div>
              </div>

              {/* Paese */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Globe className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>Paese</span>
                </label>
                <select
                  value={formData.coverage_country}
                  onChange={(e) => handleChange('coverage_country', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all appearance-none cursor-pointer text-gray-900"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-6">
                {/* Raggio di copertura */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-gray-600" />
                    <span>Raggio di copertura</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={formData.coverage_radius_km}
                    onChange={(e) => handleChange('coverage_radius_km', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-5
                               [&::-webkit-slider-thumb]:h-5
                               [&::-webkit-slider-thumb]:bg-[#EEBA2B]
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:shadow
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-moz-range-thumb]:w-5
                               [&::-moz-range-thumb]:h-5
                               [&::-moz-range-thumb]:bg-[#EEBA2B]
                               [&::-moz-range-thumb]:rounded-full
                               [&::-moz-range-thumb]:border-none
                               [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #EEBA2B 0%, #EEBA2B ${(formData.coverage_radius_km / 50) * 100}%, #e5e7eb ${(formData.coverage_radius_km / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#EEBA2B]">{formData.coverage_radius_km}</span>
                    <span className="text-gray-600 ml-1">km</span>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Copri un'area di {formData.coverage_radius_km} km dal tuo indirizzo.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                {/* Coordinate GPS */}
                <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-600" />
                  <span>Coordinate GPS (opzionale)</span>
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Latitudine</label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={formData.coverage_latitude || ''}
                      onChange={(e) => handleChange('coverage_latitude', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="45.4642"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Longitudine</label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={formData.coverage_longitude || ''}
                      onChange={(e) => handleChange('coverage_longitude', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="9.1900"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all text-gray-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loadingLocation || saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rilevamento...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Usa posizione attuale
                    </>
                  )}
                </button>
              </div>
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
