// src/components/partner/clients/AddClientModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, User, Mail, Phone, FileText, Star, Loader2, FolderOpen, Target, Calendar } from 'lucide-react';

interface AddClientModalProps {
  professionalId: string;
  onClose: () => void;
  onSuccess: () => void;
  onClientCreated?: (client: { id: string; full_name: string }) => void; // Callback con cliente creato
  initialName?: string; // Nome pre-compilato se fornito
}

export default function AddClientModal({ 
  professionalId, 
  onClose, 
  onSuccess,
  onClientCreated,
  initialName
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    full_name: initialName || '',
    email: '',
    phone: '',
    notes: '',
    is_pp_subscriber: false
  });
  const [createProject, setCreateProject] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    objective: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-compila il nome se initialName cambia
  useEffect(() => {
    if (initialName && !formData.full_name) {
      setFormData(prev => ({ ...prev, full_name: initialName }));
    }
  }, [initialName]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Il nome è obbligatorio';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    // Validazione progetto (solo se checkbox attivo)
    if (createProject && !projectData.name.trim()) {
      newErrors.project_name = 'Il nome del progetto è obbligatorio';
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
      // 1. Crea il cliente
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          professional_id: professionalId,
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
          is_pp_subscriber: formData.is_pp_subscriber
        })
        .select()
        .single();
      
      if (clientError) throw clientError;
      
      // 2. Se checkbox attivo, crea anche il progetto
      if (createProject && projectData.name.trim()) {
        const { error: projectError } = await supabase
          .from('projects')
          .insert({
            professional_id: professionalId,
            client_id: newClient.id, // Collega al cliente appena creato
            name: projectData.name.trim(),
            objective: projectData.objective.trim() || null,
            start_date: projectData.start_date,
            notes: projectData.notes.trim() || null,
            status: 'active'
          });

        if (projectError) {
          // Cliente creato ma progetto fallito
          console.error('Errore creazione progetto:', projectError);
          toast.warning(`Cliente creato. Errore nella creazione del progetto: ${projectError.message || 'Errore sconosciuto'}`);
        } else {
          // Entrambi creati con successo
          toast.success('Cliente e progetto creati con successo!');
        }
      } else {
        // Solo cliente creato
        toast.success('Cliente aggiunto con successo!');
      }
      
      // Chiama callback con cliente creato (se fornito)
      if (onClientCreated && newClient) {
        onClientCreated({
          id: newClient.id,
          full_name: newClient.full_name
        });
      }
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
        is_pp_subscriber: false
      });
      setCreateProject(false);
      setProjectData({
        name: '',
        objective: '',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore creazione cliente:', err);
      
      // Errori specifici
      if (err.code === '23505') {
        toast.error('Un cliente con questa email esiste già');
      } else if (err.code === 'PGRST116' || err.message?.includes('does not exist')) {
        toast.error('Tabella clients non disponibile. Esegui la migrazione SQL.');
      } else if (err.code === '42501' || err.code === 'PGRST301' || (typeof err === 'object' && 'status' in err && err.status === 403)) {
        // Errore permessi RLS
        console.error('Dettagli errore RLS:', {
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint,
          professionalId
        });
        toast.error('Errore permessi: verifica che la tabella clients esista e che le RLS policies siano configurate correttamente');
      } else {
        toast.error(`Errore nella creazione del cliente: ${err.message || 'Errore sconosciuto'}`);
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

  const handleProjectChange = (field: string, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
    // Rimuovi errore quando l'utente modifica il campo
    if (errors[`project_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`project_${field}`];
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    // Reset form quando si chiude
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      notes: '',
      is_pp_subscriber: false
    });
    setCreateProject(false);
    setProjectData({
      name: '',
      objective: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Nuovo Cliente</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Container - scrollabile */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
          
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          {/* Checkbox PP Subscriber */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <input
              type="checkbox"
              id="pp_subscriber"
              checked={formData.is_pp_subscriber}
              onChange={(e) => handleChange('is_pp_subscriber', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B] cursor-pointer disabled:opacity-50"
              disabled={loading}
            />
            <label htmlFor="pp_subscriber" className="flex items-center gap-2 cursor-pointer">
              <Star className="w-5 h-5 text-[#EEBA2B]" />
              <span className="font-medium text-gray-900">Abbonato Performance Prime</span>
            </label>
          </div>

          {/* Separatore */}
          <div className="border-t border-gray-200 my-6" />

          {/* Checkbox crea progetto */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={createProject}
              onChange={(e) => setCreateProject(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B] cursor-pointer disabled:opacity-50"
              disabled={loading}
            />
            <span className="font-medium text-gray-700">
              Crea anche un progetto per questo cliente
            </span>
          </label>

          {/* Sezione progetto (visibile solo se checkbox attivo) */}
          {createProject && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-[#EEBA2B]" />
                Dati Progetto
              </h3>
              
              {/* Nome progetto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome progetto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={projectData.name}
                    onChange={(e) => handleProjectChange('name', e.target.value)}
                    placeholder="Es: Dimagrimento Estate 2026"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                      errors.project_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.project_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.project_name}</p>
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
                    value={projectData.objective}
                    onChange={(e) => handleProjectChange('objective', e.target.value)}
                    placeholder="Es: Perdere 5kg entro giugno"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
                    disabled={loading}
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
                    value={projectData.start_date}
                    onChange={(e) => handleProjectChange('start_date', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Note progetto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={projectData.notes}
                    onChange={(e) => handleProjectChange('notes', e.target.value)}
                    placeholder="Dettagli aggiuntivi sul progetto..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.full_name.trim() || (createProject && !projectData.name.trim())}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#d4a826] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Salvataggio...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">+ Aggiungi Cliente</span>
                <span className="sm:hidden">Aggiungi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

