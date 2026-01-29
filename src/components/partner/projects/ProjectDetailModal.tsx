// src/components/partner/projects/ProjectDetailModal.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  X, FolderOpen, User, Target, Calendar, 
  FileText, Edit, Trash2, CheckCircle, 
  PauseCircle, PlayCircle, Star
} from 'lucide-react';
import EditProjectModal from './EditProjectModal';

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

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectDetailModal({ 
  project, 
  onClose, 
  onUpdate,
  onDelete 
}: ProjectDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-4 h-4" />;
      case 'paused': return <PauseCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'paused': return 'In Pausa';
      case 'completed': return 'Completato';
      default: return status;
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed') => {
    if (newStatus === project.status) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(`Progetto ${getStatusLabel(newStatus).toLowerCase()} con successo!`);
      onUpdate();
      onClose();
    } catch (error: unknown) {
      console.error('Errore cambio stato progetto:', error);
      toast.error('Errore nel cambio stato del progetto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Progetto eliminato con successo!');
      onDelete(project.id);
      onClose();
    } catch (error: unknown) {
      console.error('Errore eliminazione progetto:', error);
      toast.error('Errore nell\'eliminazione del progetto');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Modal conferma eliminazione
  const deleteConfirmModal = showDeleteConfirm && (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={() => setShowDeleteConfirm(false)}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
          Elimina progetto
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Sei sicuro di voler eliminare il progetto "{project.name}"? Questa azione è irreversibile.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );

  // Usa Portal per renderizzare fuori dal DOM della pagina
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
          maxWidth: '32rem', // max-w-2xl
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
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 
              className="text-xl font-semibold text-gray-900 truncate"
              style={{ fontSize: '1.25rem', fontWeight: '600' }}
            >
              {project.name}
            </h2>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap border ${getStatusColor(project.status)}`}>
            {getStatusIcon(project.status)}
            {getStatusLabel(project.status)}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0
            }}
            disabled={loading}
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
          <div className="space-y-6">
            
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Cliente
              </label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">
                    {project.client?.full_name || 'Cliente non assegnato'}
                  </span>
                  {project.client?.is_pp_subscriber && (
                    <Star className="w-4 h-4 text-[#EEBA2B] flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Obiettivo */}
            {project.objective && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  Obiettivo
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900">{project.objective}</p>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-500">Inizio:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-500">Fine:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(project.end_date)}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            {project.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Note
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{project.notes}</p>
                </div>
              </div>
            )}

            {/* Cambio Stato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stato progetto
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={loading || project.status === 'active'}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    project.status === 'active'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <PlayCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Attivo</span>
                </button>
                <button
                  onClick={() => handleStatusChange('paused')}
                  disabled={loading || project.status === 'paused'}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    project.status === 'paused'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <PauseCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">In Pausa</span>
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={loading || project.status === 'completed'}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    project.status === 'completed'
                      ? 'border-gray-500 bg-gray-100 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Completato</span>
                </button>
              </div>
            </div>

          </div>
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
            onClick={() => setShowEditModal(true)}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Edit className="w-4 h-4" />
            Modifica
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 className="w-4 h-4" />
            Elimina
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizza usando Portal direttamente nel body
  return (
    <>
      {typeof document !== 'undefined' 
        ? createPortal(modalContent, document.body)
        : modalContent}
      {typeof document !== 'undefined' && showDeleteConfirm
        ? createPortal(deleteConfirmModal, document.body)
        : showDeleteConfirm && deleteConfirmModal}
      
      {/* Modal Modifica Progetto */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            onUpdate();
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

