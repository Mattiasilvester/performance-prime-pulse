// src/components/partner/settings/AcceptPaymentMethodsModal.tsx
// FASE B: Metodi di pagamento accettati dai CLIENTI

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { X, Wallet, Loader2, CircleDollarSign, CreditCard, Building2, Circle, Smartphone } from 'lucide-react';
import { useAuth } from '@pp/shared';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface AcceptPaymentMethodsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentMethodsSettings {
  accept_cash: boolean;
  accept_card: boolean;
  accept_bank_transfer: boolean;
  bank_iban: string | null;
  bank_account_holder: string | null;
  accept_paypal: boolean;
  paypal_email: string | null;
  accept_satispay: boolean;
  satispay_phone: string | null;
}

// Componente PaymentMethodToggle (riuso da PaymentsModal originale ma semplificato)
interface PaymentMethodToggleProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
}

const PaymentMethodToggle = ({ 
  icon, 
  label, 
  description, 
  enabled, 
  onToggle, 
  children 
}: PaymentMethodToggleProps) => (
  <div className={`border rounded-xl p-4 transition ${enabled ? 'border-[#EEBA2B] bg-[#EEBA2B]/5' : 'border-gray-200 bg-white'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{label}</p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <ToggleSwitch checked={enabled} onChange={onToggle} aria-label={`${label} ${enabled ? 'attivo' : 'disattivo'}`} />
      </div>
    </div>
    
    {/* Campi extra visibili solo quando abilitato */}
    {enabled && children && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

export default function AcceptPaymentMethodsModal({ onClose, onSuccess }: AcceptPaymentMethodsModalProps) {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentMethodsSettings>({
    accept_cash: true,
    accept_card: false,
    accept_bank_transfer: false,
    bank_iban: null,
    bank_account_holder: null,
    accept_paypal: false,
    paypal_email: null,
    accept_satispay: false,
    satispay_phone: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Carica impostazioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchSettings();
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

  const fetchSettings = async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_settings')
        .select(`
          accept_cash,
          accept_card,
          accept_bank_transfer,
          bank_iban,
          bank_account_holder,
          accept_paypal,
          paypal_email,
          accept_satispay,
          satispay_phone
        `)
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          accept_cash: data.accept_cash ?? true,
          accept_card: data.accept_card ?? false,
          accept_bank_transfer: data.accept_bank_transfer ?? false,
          bank_iban: data.bank_iban || null,
          bank_account_holder: data.bank_account_holder || null,
          accept_paypal: data.accept_paypal ?? false,
          paypal_email: data.paypal_email || null,
          accept_satispay: data.accept_satispay ?? false,
          satispay_phone: data.satispay_phone || null,
        });
      }
    } catch (err: unknown) {
      console.error('Errore fetch metodi pagamento accettati:', err);
      if ((err as { code?: string })?.code !== 'PGRST116') {
        toast.error('Errore nel caricamento delle impostazioni');
      }
    } finally {
      setLoading(false);
    }
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
          accept_cash: settings.accept_cash,
          accept_card: settings.accept_card,
          accept_bank_transfer: settings.accept_bank_transfer,
          bank_iban: settings.bank_iban || null,
          bank_account_holder: settings.bank_account_holder || null,
          accept_paypal: settings.accept_paypal,
          paypal_email: settings.paypal_email || null,
          accept_satispay: settings.accept_satispay,
          satispay_phone: settings.satispay_phone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'professional_id' });

      if (error) throw error;

      toast.success('Metodi di pagamento accettati salvati con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore salvataggio metodi pagamento accettati:', err);
      toast.error('Errore durante il salvataggio');
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
              <Wallet className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pagamenti Accettati</h2>
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
                Seleziona i metodi di pagamento che accetti dai tuoi clienti. Queste informazioni saranno visibili nella tua card pubblica.
              </p>

              <div className="space-y-3">
                {/* Contanti */}
                <PaymentMethodToggle
                  icon={<CircleDollarSign className="w-5 h-5 text-gray-600" />}
                  label="Contanti"
                  description="Pagamento in contanti di persona"
                  enabled={settings.accept_cash}
                  onToggle={(v) => setSettings(prev => ({ ...prev, accept_cash: v }))}
                />
                
                {/* Carta */}
                <PaymentMethodToggle
                  icon={<CreditCard className="w-5 h-5 text-gray-600" />}
                  label="Carta di credito/debito"
                  description="Visa, Mastercard, American Express"
                  enabled={settings.accept_card}
                  onToggle={(v) => setSettings(prev => ({ ...prev, accept_card: v }))}
                />
                
                {/* Bonifico */}
                <PaymentMethodToggle
                  icon={<Building2 className="w-5 h-5 text-gray-600" />}
                  label="Bonifico bancario"
                  enabled={settings.accept_bank_transfer}
                  onToggle={(v) => setSettings(prev => ({ ...prev, accept_bank_transfer: v }))}
                >
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Intestatario conto</label>
                      <input
                        type="text"
                        value={settings.bank_account_holder || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                        placeholder="Mario Rossi"
                        disabled={saving}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">IBAN</label>
                      <input
                        type="text"
                        value={settings.bank_iban || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, bank_iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                        placeholder="IT60X0542811101000000123456"
                        maxLength={34}
                        disabled={saving}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </PaymentMethodToggle>
                
                {/* PayPal */}
                <PaymentMethodToggle
                  icon={<Circle className="w-5 h-5 text-gray-600" />}
                  label="PayPal"
                  enabled={settings.accept_paypal}
                  onToggle={(v) => setSettings(prev => ({ ...prev, accept_paypal: v }))}
                >
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Email PayPal</label>
                    <input
                      type="email"
                      value={settings.paypal_email || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, paypal_email: e.target.value }))}
                      placeholder="mario.rossi@email.com"
                      disabled={saving}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </PaymentMethodToggle>
                
                {/* Satispay */}
                <PaymentMethodToggle
                  icon={<Smartphone className="w-5 h-5 text-gray-600" />}
                  label="Satispay"
                  enabled={settings.accept_satispay}
                  onToggle={(v) => setSettings(prev => ({ ...prev, accept_satispay: v }))}
                >
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Numero di telefono Satispay</label>
                    <input
                      type="tel"
                      value={settings.satispay_phone || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, satispay_phone: e.target.value }))}
                      placeholder="+39 333 1234567"
                      disabled={saving}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] outline-none text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </PaymentMethodToggle>
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
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: saving ? 0.5 : 1
            }}
            className="hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '12px 24px',
              backgroundColor: (saving || loading) ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: (saving || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (saving || loading) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
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
