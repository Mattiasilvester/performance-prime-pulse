// src/components/partner/settings/SocialLinksModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { X, Link as LinkIcon, Loader2, Camera, Briefcase, Youtube, Music, Share2, Globe } from 'lucide-react';
import { useAuth } from '@pp/shared';

interface SocialLinksModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SocialField {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}

const SOCIAL_FIELDS: SocialField[] = [
  { 
    key: 'instagram_url', 
    label: 'Instagram', 
    icon: Camera,
    placeholder: '@username o https://instagram.com/username'
  },
  { 
    key: 'linkedin_url', 
    label: 'LinkedIn', 
    icon: Briefcase,
    placeholder: 'https://linkedin.com/in/nome-cognome'
  },
  { 
    key: 'youtube_url', 
    label: 'YouTube', 
    icon: Youtube,
    placeholder: 'https://youtube.com/@canale'
  },
  { 
    key: 'tiktok_url', 
    label: 'TikTok', 
    icon: Music,
    placeholder: '@username'
  },
  { 
    key: 'facebook_url', 
    label: 'Facebook', 
    icon: Share2,
    placeholder: 'https://facebook.com/pagina'
  },
  { 
    key: 'website_url', 
    label: 'Sito Web', 
    icon: Globe,
    placeholder: 'https://tuosito.it'
  },
];

export default function SocialLinksModal({ onClose, onSuccess }: SocialLinksModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    instagram_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: '',
    facebook_url: '',
    website_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch dati quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchSocialLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (err: unknown) {
      console.error('Errore caricamento professional_id:', err);
      toast.error('Errore nel caricamento dei dati');
    }
  };

  const fetchSocialLinks = async () => {
    if (!professionalId) return;

    try {
      const { data, error } = await supabase
        .from('professional_settings')
        .select('instagram_url, linkedin_url, youtube_url, tiktok_url, facebook_url, website_url')
        .eq('professional_id', professionalId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFormData({
          instagram_url: data.instagram_url || '',
          linkedin_url: data.linkedin_url || '',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          facebook_url: data.facebook_url || '',
          website_url: data.website_url || '',
        });
      }
    } catch (err: unknown) {
      console.error('Errore fetch link social:', err);
      if ((err as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento dei link social');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Campo vuoto è valido (opzionale)
    
    // Accetta URL o handle social (es: @username)
    if (url.startsWith('@')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) return true;
    
    // Per link senza protocollo, prova ad aggiungere https://
    return url.includes('.');
  };

  const handleSave = async () => {
    if (!professionalId) {
      toast.error('Errore: professional_id non disponibile');
      return;
    }

    // Validazione URL (opzionale)
    for (const field of SOCIAL_FIELDS) {
      const value = formData[field.key];
      if (value && !validateUrl(value)) {
        toast.error(`Formato non valido per ${field.label}`);
        return;
      }
    }

    setSaving(true);

    try {
      // Normalizza URL (aggiungi https:// se mancante, tranne per handle @)
      const normalizedData: Record<string, string | null> = {};
      for (const field of SOCIAL_FIELDS) {
        const value = formData[field.key]?.trim() || null;
        if (value) {
          // Se inizia con @, lascia così
          if (value.startsWith('@')) {
            normalizedData[field.key] = value;
          } 
          // Se è già un URL completo, lascia così
          else if (value.startsWith('http://') || value.startsWith('https://')) {
            normalizedData[field.key] = value;
          }
          // Altrimenti aggiungi https://
          else {
            normalizedData[field.key] = `https://${value}`;
          }
        } else {
          normalizedData[field.key] = null;
        }
      }

      const { error } = await supabase
        .from('professional_settings')
        .upsert({
          professional_id: professionalId,
          ...normalizedData,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'professional_id'
        });

      if (error) throw error;

      toast.success('Link social salvati con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore salvataggio link social:', err);
      toast.error('Errore nel salvataggio dei link social');
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
              <LinkIcon className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Link Social e Portfolio</h2>
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
          {/* Descrizione */}
          <p className="text-sm text-gray-600">
            Collega i tuoi profili social per aumentare la visibilità
          </p>

          {/* Form */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {SOCIAL_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded-lg">
                      {React.createElement(field.icon, { className: 'w-4 h-4 text-gray-600' })}
                    </div>
                    <span>{field.label}</span>
                  </label>
                  <input
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    {field.placeholder}
                  </p>
                </div>
              ))}
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
            disabled={saving || loading || !professionalId}
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

