// src/components/partner/clients/EditClientModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { X, User, Mail, Phone, FileText, Star, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_pp_subscriber: boolean;
}

interface EditClientModalProps {
  client: Client;
  professionalId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditClientModal({ 
  client,
  professionalId, 
  onClose, 
  onSuccess 
}: EditClientModalProps) {
  const [formData, setFormData] = useState({
    full_name: client.full_name || '',
    email: client.email || '',
    phone: client.phone || '',
    notes: client.notes || '',
    is_pp_subscriber: client.is_pp_subscriber || false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // RIMOSSO: Blocco scroll body - potrebbe interferire con lo scroll del modal

  // Aggiorna formData quando client cambia (per mock clients con note in localStorage)
  useEffect(() => {
    if (client.id.startsWith('mock-')) {
      const savedNotes = localStorage.getItem(`client_notes_${client.id}`);
      setFormData(prev => ({
        ...prev,
        full_name: client.full_name || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: savedNotes || client.notes || '',
        is_pp_subscriber: client.is_pp_subscriber || false
      }));
    } else {
      setFormData({
        full_name: client.full_name || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
        is_pp_subscriber: client.is_pp_subscriber || false
      });
    }
  }, [client]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Il nome è obbligatorio';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Se è un cliente mock, salva solo in localStorage
      if (client.id.startsWith('mock-')) {
        localStorage.setItem(`client_notes_${client.id}`, formData.notes.trim());
        toast.success('Modifiche salvate (solo in locale - cliente di prova)');
        onSuccess();
        onClose();
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
          is_pp_subscriber: formData.is_pp_subscriber,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)
        .eq('professional_id', professionalId);
      
      if (error) throw error;
      
      toast.success('Cliente modificato con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore modifica cliente:', err);
      const e = err as { code?: string; message?: string; status?: number };
      // Errori specifici
      if (e.code === '23505') {
        toast.error('Un cliente con questa email esiste già');
      } else if (e.code === 'PGRST116' || e.message?.includes('does not exist')) {
        toast.error('Tabella clients non disponibile. Esegui la migrazione SQL.');
      } else if (e.code === '42501' || e.code === 'PGRST301' || (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 403)) {
        toast.error('Permessi insufficienti per modificare il cliente. Controlla le RLS policies.');
      } else {
        toast.error(`Errore nella modifica del cliente: ${e.message || 'Errore sconosciuto'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Rimuovi errore quando l'utente modifica il campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Usa Portal per renderizzare fuori dal DOM del modal padre (ClientDetailModal)
  // Questo risolve il problema di scroll bloccato da overflow-hidden del padre
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      {/* Modal - STRUTTURA IDENTICA AL TEST CHE FUNZIONA */}
      <div 
        style={{ 
          width: '100%',
          maxWidth: '28rem', // equivalente a max-w-md
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - altezza fissa */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Modifica Cliente</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Container - scrollabile - stessa struttura del test */}
        <div 
          style={{ 
            flex: 1,
            overflowY: 'scroll',
            minHeight: 0,
            padding: '24px'
          }}
        >
          <form 
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
          
          {/* Nome completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Mario Rossi"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="mario.rossi@email.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Telefono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+39 333 1234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Note <span className="text-gray-400 font-normal">(opzionale)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Obiettivi, preferenze, note importanti..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Checkbox PP Subscriber */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <input
              type="checkbox"
              id="pp_subscriber_edit"
              checked={formData.is_pp_subscriber}
              onChange={(e) => handleChange('is_pp_subscriber', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B] cursor-pointer"
            />
            <label htmlFor="pp_subscriber_edit" className="flex items-center gap-2 cursor-pointer">
              <Star className="w-5 h-5 text-[#EEBA2B]" />
              <span className="font-medium text-gray-900">Abbonato Performance Prime</span>
            </label>
          </div>

          </form>
        </div>

        {/* Footer - stessa struttura del test */}
        <div 
          style={{ 
            padding: '24px',
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
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.full_name.trim()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: loading || !formData.full_name.trim() ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: loading || !formData.full_name.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.full_name.trim() ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>Salva Modifiche</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizza usando Portal direttamente nel body, fuori dal modal padre
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}

