// src/components/partner/bookings/AddBookingModal.tsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@pp/shared';
import { toast } from 'sonner';
import { useAuth } from '@pp/shared';
import { getServicesByProfessional, type ProfessionalService } from '@/services/professionalServicesService';
import { 
  X, Calendar, Clock, User, Briefcase, 
  Video, MapPin, FileText, Loader2
} from 'lucide-react';

interface AddBookingModalProps {
  professionalId: string;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClientId?: string; // ID cliente dalla tabella clients
  preselectedClientName?: string; // Nome cliente per display
  preselectedClientEmail?: string; // Email cliente (se disponibile)
  preselectedClientUserId?: string | null; // user_id se cliente è registrato
}

export default function AddBookingModal({ 
  professionalId,
  onClose,
  onSuccess,
  preselectedClientId,
  preselectedClientName,
  preselectedClientEmail,
  preselectedClientUserId
}: AddBookingModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    serviceId: '', // Cambiato da serviceType a serviceId
    modalita: 'presenza' as 'online' | 'presenza',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Carica servizi del professionista
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const fetchedServices = await getServicesByProfessional(professionalId);
        setServices(fetchedServices);
        
        // Se c'è solo un servizio, selezionalo automaticamente
        if (fetchedServices.length === 1) {
          setFormData(prev => ({ ...prev, serviceId: fetchedServices[0].id }));
        }
      } catch (error) {
        console.error('Errore caricamento servizi:', error);
        toast.error('Errore nel caricamento dei servizi');
      } finally {
        setLoadingServices(false);
      }
    };

    if (professionalId) {
      loadServices();
    }
  }, [professionalId]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Se cambia il servizio, aggiorna anche la durata e modalità se disponibili
      if (field === 'serviceId' && value) {
        const selectedService = services.find(s => s.id === value);
        if (selectedService) {
          updated.duration = selectedService.duration_minutes;
          updated.modalita = selectedService.is_online ? 'online' : 'presenza';
        }
      }
      
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'La data è obbligatoria';
    }
    
    if (!formData.time) {
      newErrors.time = 'L\'ora è obbligatoria';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'La durata deve essere maggiore di 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepara notes solo con note testuali (non più JSON completo)
      const notesContent = formData.notes || null;

      // Calcola ora fine in base a durata
      const [hours, minutes] = formData.time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + formData.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Prepara dati booking con colonne separate
      const bookingData: Record<string, unknown> = {
        professional_id: professionalId,
        booking_date: formData.date,
        booking_time: formData.time,
        duration_minutes: formData.duration,
        status: 'pending',
        notes: notesContent,
        modalita: formData.modalita,
        // Salva nelle colonne separate
        client_name: preselectedClientName || null,
        client_email: preselectedClientEmail || null,
        service_id: formData.serviceId || null, // Usa service_id invece di service_type
        // Manteniamo service_type per retrocompatibilità solo se non c'è service_id
        service_type: formData.serviceId ? null : null,
        color: formData.serviceId ? services.find(s => s.id === formData.serviceId)?.color || '#EEBA2B' : '#EEBA2B'
      };
      
      // Se abbiamo user_id del cliente, usa quello
      // Altrimenti usa l'ID del professionista come placeholder
      if (preselectedClientUserId) {
        bookingData.user_id = preselectedClientUserId;
      } else if (user?.id) {
        bookingData.user_id = user.id; // Placeholder: professionista
      } else {
        toast.error('Errore: utente non autenticato');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Prenotazione creata con successo!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Errore creazione prenotazione:', error);
      if ((error as { code?: string })?.code === '23505') {
        toast.error('Slot già occupato. Scegli un altro orario.');
      } else {
        toast.error('Errore nella creazione della prenotazione');
      }
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
              <Calendar className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Nuova Prenotazione</h2>
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
          
          {/* Cliente (se pre-selezionato) */}
          {preselectedClientName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cliente
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                  {preselectedClientName}
                  {preselectedClientEmail && (
                    <span className="text-sm text-gray-500 block mt-1">{preselectedClientEmail}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Ora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ora <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.time ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.time && (
              <p className="mt-1 text-sm text-red-500">{errors.time}</p>
            )}
          </div>

          {/* Durata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Durata (minuti) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all ${
                  errors.duration ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <option value={30}>30 minuti</option>
                <option value={45}>45 minuti</option>
                <option value={60}>60 minuti</option>
                <option value={90}>90 minuti</option>
              </select>
            </div>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
            )}
          </div>

          {/* Tipo servizio - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Servizio
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              {loadingServices ? (
                <div className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Caricamento servizi...</span>
                </div>
              ) : (
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleChange('serviceId', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all bg-white"
                >
                  <option value="">Seleziona un servizio...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - €{service.price} ({service.duration_minutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>
            {services.length === 0 && !loadingServices && (
              <p className="mt-1 text-sm text-gray-500">
                Nessun servizio disponibile. Configura i servizi nel tuo profilo.
              </p>
            )}
          </div>

          {/* Modalità */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Modalità <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('modalita', 'presenza')}
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl transition-all ${
                  formData.modalita === 'presenza'
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">In presenza</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('modalita', 'online')}
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl transition-all ${
                  formData.modalita === 'online'
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 text-[#EEBA2B]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </button>
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
                placeholder="Note aggiuntive..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent transition-all"
              />
            </div>
          </div>

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
            disabled={loading || !formData.date || !formData.time}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: loading || !formData.date || !formData.time ? '#d1d5db' : '#EEBA2B',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: loading || !formData.date || !formData.time ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.date || !formData.time ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creazione...
              </>
            ) : (
              <>Crea Prenotazione</>
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

