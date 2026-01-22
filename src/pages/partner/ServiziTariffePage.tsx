// src/pages/partner/ServiziTariffePage.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Briefcase, FileText, Settings, Euro, Monitor, Home, RefreshCw, Info, ChevronDown } from 'lucide-react';
import { ServiceCard } from '@/components/partner/services/ServiceCard';
import { ServiceFormModal } from '@/components/partner/services/ServiceFormModal';
import { 
  ProfessionalService, 
  createService, 
  updateService, 
  deleteService 
} from '@/services/professionalServicesService';

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_online: boolean;
  is_in_person: boolean;
  color: string;
  is_active: boolean;
}

interface ProfessionalSettings {
  prezzo_seduta: number | null;
  modalita: 'online' | 'presenza' | 'entrambi';
}

export default function ServiziTariffePage() {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalSettings, setProfessionalSettings] = useState<ProfessionalSettings>({
    prezzo_seduta: null,
    modalita: 'entrambi'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showModalityDropdown, setShowModalityDropdown] = useState(false);
  const modalityDropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<ProfessionalService | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProfessionalService | null>(null);
  const [saving, setSaving] = useState(false);

  const modalityOptions = [
    { value: 'online' as const, label: 'Solo Online', icon: Monitor },
    { value: 'presenza' as const, label: 'Solo In Presenza', icon: Home },
    { value: 'entrambi' as const, label: 'Entrambi', icon: RefreshCw }
  ];

  const selectedModality = modalityOptions.find(opt => opt.value === professionalSettings.modalita) || modalityOptions[2];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalityDropdownRef.current && !modalityDropdownRef.current.contains(event.target as Node)) {
        setShowModalityDropdown(false);
      }
    };

    if (showModalityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModalityDropdown]);

  useEffect(() => {
    fetchProfessionalAndServices();
  }, []);

  const fetchProfessionalAndServices = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Non autenticato');
        return;
      }

      // Get professional ID and settings
      const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('id, prezzo_seduta, modalita')
        .eq('user_id', user.id)
        .single();

      if (profError) throw profError;
      if (!professional) {
        toast.error('Profilo professionista non trovato');
        return;
      }

      setProfessionalId(professional.id);
      setProfessionalSettings({
        prezzo_seduta: professional.prezzo_seduta,
        modalita: (professional.modalita as 'online' | 'presenza' | 'entrambi') || 'entrambi'
      });

      // Fetch services (tutti, non solo attivi, per gestione completa)
      const { data: servicesData, error: servicesError } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', professional.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Errore caricamento servizi:', error);
      toast.error('Errore nel caricamento dei servizi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (data: ServiceFormData) => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    setSaving(true);
    try {
      const newService = await createService({
        professional_id: professionalId,
        name: data.name,
        description: data.description || undefined,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_online: data.is_online,
        is_in_person: data.is_in_person,
        is_active: data.is_active,
        color: data.color,
      });

      if (!newService) {
        throw new Error('Errore durante la creazione');
      }
      
      toast.success('Servizio creato con successo!');
      setShowFormModal(false);
      fetchProfessionalAndServices();
    } catch (error: any) {
      console.error('Errore creazione servizio:', error);
      toast.error(error.message || 'Errore durante la creazione del servizio');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateService = async (data: ServiceFormData) => {
    if (!editingService) {
      toast.error('Errore: servizio non selezionato');
      return;
    }

    setSaving(true);
    try {
      const updatedService = await updateService(editingService.id, {
        name: data.name,
        description: data.description || undefined,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_online: data.is_online,
        is_in_person: data.is_in_person,
        is_active: data.is_active,
        color: data.color,
      });

      if (!updatedService) {
        throw new Error('Errore durante l\'aggiornamento');
      }
      
      toast.success('Servizio aggiornato!');
      setEditingService(null);
      setShowFormModal(false);
      fetchProfessionalAndServices();
    } catch (error: any) {
      console.error('Errore aggiornamento servizio:', error);
      toast.error(error.message || 'Errore durante l\'aggiornamento');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (service: ProfessionalService) => {
    try {
      const success = await deleteService(service.id);
      
      if (!success) {
        throw new Error('Errore durante l\'eliminazione');
      }
      
      toast.success('Servizio eliminato');
      setShowDeleteConfirm(null);
      fetchProfessionalAndServices();
    } catch (error: any) {
      console.error('Errore eliminazione servizio:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione');
    }
  };

  const handleToggleActive = async (service: ProfessionalService) => {
    try {
      const updatedService = await updateService(service.id, {
        is_active: !service.is_active,
      });

      if (!updatedService) {
        throw new Error('Errore durante l\'aggiornamento');
      }
      
      toast.success(service.is_active ? 'Servizio disattivato' : 'Servizio attivato');
      fetchProfessionalAndServices();
    } catch (error: any) {
      console.error('Errore toggle attivo:', error);
      toast.error(error.message || 'Errore durante l\'aggiornamento');
    }
  };

  const handleEdit = (service: ProfessionalService) => {
    setEditingService(service);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingService(null);
  };

  const handleNewService = () => {
    setEditingService(null);
    setShowFormModal(true);
  };

  const handleSaveSettings = async () => {
    if (!professionalId) {
      toast.error('Errore: professionista non trovato');
      return;
    }

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          prezzo_seduta: professionalSettings.prezzo_seduta || null,
          modalita: professionalSettings.modalita
        })
        .eq('id', professionalId);

      if (error) throw error;

      toast.success('Impostazioni salvate con successo!');
    } catch (error: any) {
      console.error('Errore salvataggio impostazioni:', error);
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-[#EEBA2B]" />
          Servizi e Tariffe
        </h1>
        <p className="text-gray-600">
          Gestisci i servizi che offri ai tuoi clienti. I servizi attivi saranno visibili durante la prenotazione.
        </p>
      </div>

      {/* Impostazioni Generali */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#EEBA2B]" />
          <h2 className="text-lg font-semibold text-gray-900">Impostazioni Generali</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Queste impostazioni vengono usate quando non hai servizi specifici attivi o come riferimento generale.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Prezzo Seduta Generale */}
          <div className="flex flex-col min-w-0">
            <label htmlFor="prezzo_seduta" className="block text-sm font-medium text-gray-700 mb-2">
              Prezzo seduta generale (€)
            </label>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                <Euro className="w-5 h-5" />
              </div>
              <input
                type="number"
                id="prezzo_seduta"
                min="0"
                max="1000"
                value={professionalSettings.prezzo_seduta || ''}
                onChange={(e) => setProfessionalSettings(prev => ({
                  ...prev,
                  prezzo_seduta: e.target.value ? parseInt(e.target.value) : null
                }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent outline-none"
                placeholder="Es: 50, 80, 100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usato quando non hai servizi attivi
            </p>
          </div>

          {/* Modalità Generale */}
          <div className="flex flex-col min-w-0">
            <label htmlFor="modalita_generale" className="block text-sm font-medium text-gray-700 mb-2">
              Modalità di lavoro generale
            </label>
            <div className="relative w-full" ref={modalityDropdownRef}>
              <button
                type="button"
                onClick={() => setShowModalityDropdown(!showModalityDropdown)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent outline-none bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <selectedModality.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{selectedModality.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showModalityDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showModalityDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                  {modalityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setProfessionalSettings(prev => ({
                            ...prev,
                            modalita: option.value
                          }));
                          setShowModalityDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                          professionalSettings.modalita === option.value ? 'bg-[#EEBA2B]/10' : ''
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${professionalSettings.modalita === option.value ? 'text-[#EEBA2B]' : 'text-gray-600'}`} />
                        <span className={professionalSettings.modalita === option.value ? 'text-[#EEBA2B] font-medium' : 'text-gray-900'}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Modalità predefinita per i tuoi servizi
            </p>
          </div>
        </div>

        {/* Info Box */}
        {services.filter(s => s.is_active).length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Hai {services.filter(s => s.is_active).length} servizio/i attivo/i. 
              I servizi attivi hanno priorità sul prezzo generale nella visualizzazione pubblica.
            </p>
          </div>
        )}

        {/* Bottone Salva */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="bg-[#EEBA2B] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d4a827] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva Impostazioni'
            )}
          </button>
        </div>
      </div>

      {/* Bottone nuovo servizio */}
      <div className="mb-6">
        <button
          onClick={handleNewService}
          className="bg-[#EEBA2B] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#d4a827] transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuovo Servizio
        </button>
      </div>

      {/* Lista servizi */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Caricamento servizi...
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nessun servizio ancora
          </h3>
          <p className="text-gray-500 mb-6">
            Crea il tuo primo servizio per iniziare a ricevere prenotazioni!
          </p>
          <button
            onClick={handleNewService}
            className="bg-[#EEBA2B] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#d4a827] transition"
          >
            + Crea il primo servizio
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
              onDelete={(s) => setShowDeleteConfirm(s)}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {services.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-sm text-gray-500">Servizi totali</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {services.filter(s => s.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Attivi</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">
                {services.filter(s => !s.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Inattivi</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <ServiceFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        onSave={editingService ? handleUpdateService : handleCreateService}
        service={editingService}
      />

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Eliminare questo servizio?
              </h3>
              <p className="text-gray-600 text-sm">
                Stai per eliminare "<strong>{showDeleteConfirm.name}</strong>". 
                Questa azione non può essere annullata.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeleteService(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
