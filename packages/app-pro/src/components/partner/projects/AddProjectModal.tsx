// src/components/partner/projects/AddProjectModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, FolderOpen, User, Target, Calendar, FileText, Loader2, ChevronDown } from 'lucide-react';
import ProjectAttachmentsUpload from './ProjectAttachmentsUpload';
import { uploadAttachment } from '@/services/projectAttachmentsService';

interface Client {
  id: string;
  full_name: string;
  is_pp_subscriber: boolean;
}

interface AddProjectModalProps {
  professionalId: string;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClientId?: string; // Se aperto da dettaglio cliente
}

export default function AddProjectModal({ 
  professionalId, 
  onClose, 
  onSuccess,
  preselectedClientId 
}: AddProjectModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    client_id: preselectedClientId || '',
    objective: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingAttachmentFiles, setPendingAttachmentFiles] = useState<File[]>([]);

  // Fetch clienti per il dropdown
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  // Aggiorna formData quando preselectedClientId cambia
  useEffect(() => {
    if (preselectedClientId) {
      setFormData(prev => ({ ...prev, client_id: preselectedClientId }));
    }
  }, [preselectedClientId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, is_pp_subscriber')
        .eq('professional_id', professionalId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Errore fetch clienti:', err);
      toast.error('Errore nel caricamento dei clienti');
    } finally {
      setLoadingClients(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome del progetto è obbligatorio';
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Seleziona un cliente';
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
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          professional_id: professionalId,
          client_id: formData.client_id,
          name: formData.name.trim(),
          objective: formData.objective.trim() || null,
          start_date: formData.start_date,
          notes: formData.notes.trim() || null,
          status: 'active'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      if (!newProject?.id) throw new Error('Progetto non creato');

      for (const file of pendingAttachmentFiles) {
        try {
          await uploadAttachment({
            projectId: newProject.id,
            clientId: formData.client_id,
            professionalId,
            file
          });
        } catch (uploadErr) {
          console.error('Upload allegato:', uploadErr);
          toast.error(`Impossibile allegare "${file.name}". Progetto creato.`);
        }
      }
      
      toast.success('Progetto creato con successo!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Errore creazione progetto:', err);
      const e = err as { code?: string; message?: string; status?: number };
      if (e.code === 'PGRST116' || e.message?.includes('does not exist')) {
        toast.error('Tabella projects non disponibile. Esegui la migrazione SQL.');
      } else if (e.code === '42501' || e.code === 'PGRST301' || e.status === 403) {
        toast.error('Permessi insufficienti per creare il progetto. Controlla le RLS policies.');
      } else {
        toast.error('Errore nella creazione del progetto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Usa Portal per renderizzare fuori dal DOM del modal padre
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        style={{
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
              <FolderOpen className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Nuovo Progetto</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Container - scrollabile */}
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
          
          {/* Nome progetto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome progetto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Es: Dimagrimento Estate 2026"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cliente <span className="text-red-500">*</span>
            </label>
            {preselectedClientId ? (
              // Mostra il nome del cliente se pre-selezionato
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                  {clients.find(c => c.id === preselectedClientId)?.full_name || 'Cliente selezionato'}
                  {clients.find(c => c.id === preselectedClientId)?.is_pp_subscriber && ' ⭐'}
                </div>
              </div>
            ) : (
              // Dropdown normale se non c'è cliente pre-selezionato
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                  disabled={loadingClients}
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all cursor-pointer ${
                    errors.client_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } ${loadingClients ? 'opacity-50' : ''}`}
                >
                  <option value="">
                    {loadingClients ? 'Caricamento...' : 'Seleziona cliente'}
                  </option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} {client.is_pp_subscriber ? '⭐' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            )}
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-500">{errors.client_id}</p>
            )}
            {clients.length === 0 && !loadingClients && !preselectedClientId && (
              <p className="mt-1 text-sm text-amber-600">
                Nessun cliente trovato. Crea prima un cliente.
              </p>
            )}
          </div>

          {/* Obiettivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Obiettivo
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="Es: Perdere 5kg entro giugno"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Data inizio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data inizio
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
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
                placeholder="Dettagli aggiuntivi sul progetto..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Allegati (solo se cliente selezionato) */}
          {formData.client_id && (
            <ProjectAttachmentsUpload
              professionalId={professionalId}
              clientId={formData.client_id}
              projectId={null}
              existingAttachments={[]}
              pendingFiles={pendingAttachmentFiles}
              onPendingFilesChange={setPendingAttachmentFiles}
              disabled={loading}
            />
          )}

          </form>
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
            disabled={loading || !formData.name.trim() || !formData.client_id}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: loading || !formData.name.trim() || !formData.client_id ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: loading || !formData.name.trim() || !formData.client_id ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.name.trim() || !formData.client_id ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creazione...
              </>
            ) : (
              <>+ Crea Progetto</>
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

