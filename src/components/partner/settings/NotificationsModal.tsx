// src/components/partner/settings/NotificationsModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Bell, Loader2, Calendar, AlertCircle, Clock, MessageSquare, Star, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface NotificationsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NOTIFICATION_FIELDS = [
  {
    key: 'notify_new_booking',
    label: 'Nuove prenotazioni',
    description: 'Ricevi una notifica quando un cliente prenota',
    icon: Calendar,
    defaultValue: true
  },
  {
    key: 'notify_booking_cancelled',
    label: 'Cancellazioni',
    description: 'Ricevi una notifica quando una prenotazione viene cancellata',
    icon: AlertCircle,
    defaultValue: true
  },
  {
    key: 'notify_booking_reminder',
    label: 'Promemoria appuntamenti',
    description: 'Ricevi un promemoria prima degli appuntamenti',
    icon: Clock,
    defaultValue: true
  },
  {
    key: 'notify_messages',
    label: 'Messaggi',
    description: 'Ricevi una notifica quando ricevi un messaggio',
    icon: MessageSquare,
    defaultValue: true
  },
  {
    key: 'notify_reviews',
    label: 'Nuove recensioni',
    description: 'Ricevi una notifica quando ricevi una recensione',
    icon: Star,
    defaultValue: false
  },
  {
    key: 'notify_weekly_summary',
    label: 'Riepilogo settimanale',
    description: 'Ricevi un riepilogo settimanale delle tue attività',
    icon: BarChart3,
    defaultValue: true
  },
] as const;

export default function NotificationsModal({ onClose, onSuccess }: NotificationsModalProps) {
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
      fetchNotifications();
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
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      if (error.code !== 'PGRST116') { // Ignora se non trovato
        toast.error('Errore nel caricamento dei dati');
      }
    }
  };

  const fetchNotifications = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_settings')
        .select('notify_new_booking, notify_booking_cancelled, notify_booking_reminder, notify_messages, notify_reviews, notify_weekly_summary')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;

      // Inizializza con valori dal database o default
      const initialData: Record<string, boolean> = {};
      NOTIFICATION_FIELDS.forEach(field => {
        initialData[field.key] = data?.[field.key as keyof typeof data] ?? field.defaultValue;
      });

      setFormData(initialData);
    } catch (err: any) {
      console.error('Errore fetch notifiche:', err);
      if (err.code !== 'PGRST116') { // Ignora se non trovato
        toast.error('Errore nel caricamento delle preferenze');
      }
      // Usa valori default se errore
      const defaultData: Record<string, boolean> = {};
      NOTIFICATION_FIELDS.forEach(field => {
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
          notify_new_booking: formData.notify_new_booking,
          notify_booking_cancelled: formData.notify_booking_cancelled,
          notify_booking_reminder: formData.notify_booking_reminder,
          notify_messages: formData.notify_messages,
          notify_reviews: formData.notify_reviews,
          notify_weekly_summary: formData.notify_weekly_summary,
          updated_at: new Date().toISOString()
        }, { onConflict: 'professional_id' });

      if (error) throw error;

      toast.success('Preferenze notifiche salvate con successo!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore salvataggio notifiche:', err);
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
              <Bell className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Preferenze Notifiche</h2>
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
                Scegli quali notifiche vuoi ricevere.
              </p>

              <div className="space-y-0">
                {NOTIFICATION_FIELDS.map((field, index) => (
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
