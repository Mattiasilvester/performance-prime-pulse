// src/components/partner/projects/EditProjectModal.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, FolderOpen, Target, Calendar, FileText, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  client_id: string;
  name: string;
  objective: string | null;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  client?: {
    full_name: string;
    is_pp_subscriber: boolean;
  };
}

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProjectModal({ 
  project,
  onClose, 
  onSuccess 
}: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project.name || '',
    objective: project.objective || '',
    start_date: project.start_date ? project.start_date.split('T')[0] : '',
    end_date: project.end_date ? project.end_date.split('T')[0] : '',
    notes: project.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Il nome del progetto è obbligatorio';
    }

    // Validazione date: data fine non può essere prima della data inizio
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        newErrors.end_date = 'La data fine non può essere prima della data inizio';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData: Record<string, string | null> = {
        name: formData.name.trim(),
        objective: formData.objective.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes.trim() || null
      };

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Progetto modificato con successo!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Errore modifica progetto:', error);
      toast.error('Errore nella modifica del progetto');
    } finally {
      setLoading(false);
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Modifica Progetto</h2>
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
              Data inizio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
            )}
          </div>

          {/* Data fine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data fine <span className="text-gray-400 font-normal">(opzionale)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                min={formData.start_date || undefined}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
            )}
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

          </form>
        </div>

        {/* Footer - altezza fissa */}
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
            disabled={loading || !formData.name.trim()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: loading || !formData.name.trim() ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: loading || !formData.name.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.name.trim() ? 0.5 : 1
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

  // Renderizza usando Portal direttamente nel body
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
}

