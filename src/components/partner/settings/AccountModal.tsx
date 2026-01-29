// src/components/partner/settings/AccountModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, User, Loader2, Mail, Lock, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface AccountFormData {
  currentEmail: string;
  newEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showPassword: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
}

const PasswordInput = ({ value, onChange, placeholder, showPassword, onToggleShow, disabled = false }: PasswordInputProps) => (
  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
    />
    <button
      type="button"
      onClick={onToggleShow}
      disabled={disabled}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {showPassword ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  </div>
);

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, loading }: DeleteConfirmModalProps) => {
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-600">Elimina account</h3>
        </div>
        <p className="text-gray-600 mb-3">
          Questa azione è <strong>irreversibile</strong>. Tutti i tuoi dati, 
          prenotazioni, clienti e impostazioni verranno eliminati permanentemente.
        </p>
        <p className="text-gray-700 mb-3">
          Scrivi <strong>ELIMINA</strong> per confermare:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ELIMINA"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-gray-900"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'ELIMINA' || loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>Elimina definitivamente</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default function AccountModal({ onClose, onSuccess }: AccountModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AccountFormData>({
    currentEmail: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carica email attuale
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        currentEmail: user.email || ''
      }));
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);

    try {
      // Cambio email
      if (formData.newEmail && formData.newEmail !== formData.currentEmail) {
        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.newEmail)) {
          toast.error('Formato email non valido');
          setSaving(false);
          return;
        }

        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.newEmail,
        });
        
        if (emailError) throw emailError;
        
        toast.success('Email di conferma inviata al nuovo indirizzo');
        setFormData(prev => ({ ...prev, newEmail: '' }));
      }

      // Cambio password
      if (formData.newPassword) {
        if (formData.newPassword.length < 8) {
          toast.error('La password deve contenere almeno 8 caratteri');
          setSaving(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Le password non coincidono');
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });
        
        if (passwordError) throw passwordError;
        
        toast.success('Password aggiornata con successo');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      if (!formData.newEmail && !formData.newPassword) {
        toast.info('Nessuna modifica da salvare');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      console.error('Errore salvataggio account:', err);
      toast.error((err as Error)?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      // 1. Elimina professionista (cascade elimina bookings, clients, settings, etc.)
      if (user?.id) {
        const { error: profError } = await supabase
          .from('professionals')
          .delete()
          .eq('user_id', user.id);

        if (profError) throw profError;
      }

      // 2. Logout (l'utente auth viene eliminato da Supabase se configurato)
      await supabase.auth.signOut();

      toast.success('Account eliminato con successo');
      setShowDeleteConfirm(false);
      
      // 3. Redirect a landing page
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      console.error('Errore eliminazione account:', err);
      toast.error((err as Error)?.message || 'Errore durante l\'eliminazione dell\'account');
    } finally {
      setDeleting(false);
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
              <User className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Gestione Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={saving || deleting}
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
                Gestisci le impostazioni del tuo account e la sicurezza.
              </p>

              {/* EMAIL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email attuale
                  </label>
                  <input
                    type="email"
                    value={formData.currentEmail}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuova email (lascia vuoto per non modificare)
                  </label>
                  <input
                    type="email"
                    value={formData.newEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="nuova@email.com"
                    disabled={saving || deleting}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#EEBA2B] focus:ring-1 focus:ring-[#EEBA2B] transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* PASSWORD */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Password</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password attuale
                  </label>
                  <PasswordInput
                    value={formData.currentPassword}
                    onChange={(value) => setFormData(prev => ({ ...prev, currentPassword: value }))}
                    placeholder="Inserisci la password attuale"
                    showPassword={showCurrentPassword}
                    onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={saving || deleting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuova password
                  </label>
                  <PasswordInput
                    value={formData.newPassword}
                    onChange={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
                    placeholder="Inserisci la nuova password"
                    showPassword={showNewPassword}
                    onToggleShow={() => setShowNewPassword(!showNewPassword)}
                    disabled={saving || deleting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma nuova password
                  </label>
                  <PasswordInput
                    value={formData.confirmPassword}
                    onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
                    placeholder="Conferma la nuova password"
                    showPassword={showConfirmPassword}
                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={saving || deleting}
                  />
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="flex-shrink-0 p-1 bg-gray-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                  </div>
                  <span>La password deve contenere almeno 8 caratteri</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* ZONA PERICOLOSA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-shrink-0 p-1 bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Zona Pericolosa</h3>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">Elimina account</h4>
                      <p className="text-sm text-red-700">
                        Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={saving || deleting}
                    className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    Elimina il mio account
                  </button>
                </div>
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
            disabled={saving || deleting}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: (saving || deleting) ? 'not-allowed' : 'pointer',
              opacity: (saving || deleting) ? 0.5 : 1
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || deleting || loading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: (saving || deleting || loading) ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: (saving || deleting || loading) ? 'not-allowed' : 'pointer',
              opacity: (saving || deleting || loading) ? 0.5 : 1
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>Salva modifiche</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {typeof document !== 'undefined' 
        ? createPortal(modalContent, document.body)
        : modalContent}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
      />
    </>
  );
}
