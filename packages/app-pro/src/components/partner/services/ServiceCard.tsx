// src/components/partner/services/ServiceCard.tsx

import { ProfessionalService } from '@/services/professionalServicesService';
import { Edit, Trash2 } from 'lucide-react';

interface ServiceCardProps {
  service: ProfessionalService;
  onEdit: (service: ProfessionalService) => void;
  onDelete: (service: ProfessionalService) => void;
  onToggleActive: (service: ProfessionalService) => void;
}

export const ServiceCard = ({ service, onEdit, onDelete, onToggleActive }: ServiceCardProps) => {
  const getColorEmoji = (color: string) => {
    const colors: Record<string, string> = {
      '#EEBA2B': '🟡',
      '#3B82F6': '🔵',
      '#22C55E': '🟢',
      '#EF4444': '🔴',
      '#A855F7': '🟣',
      '#F97316': '🟠',
      '#1F2937': '⚫',
    };
    return colors[color] || '⚪';
  };

  const getModalityText = () => {
    // Gestisce tutte le combinazioni possibili
    const isOnline = service.is_online;
    const isInPerson = service.is_in_person ?? !isOnline; // Fallback per compatibilità con dati esistenti
    
    if (isInPerson && isOnline) return 'In presenza e Online';
    if (isOnline) return 'Online';
    if (isInPerson) return 'In presenza';
    return 'Modalità non specificata';
  };

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-all ${
        service.is_active 
          ? 'border-gray-200 hover:border-[#EEBA2B] hover:shadow-md' 
          : 'border-gray-100 bg-gray-50 opacity-70'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{getColorEmoji(service.color)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5 flex-wrap">
              <span>{service.duration_minutes} min</span>
              <span>•</span>
              <span className="font-medium text-gray-700">€{service.price.toFixed(2)}</span>
              <span>•</span>
              <span>{getModalityText()}</span>
            </div>
          </div>
        </div>
        
        {/* Toggle attivo */}
        <button
          onClick={() => onToggleActive(service)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition flex-shrink-0 ${
            service.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {service.is_active ? '✅ Attivo' : '⚪ Inattivo'}
        </button>
      </div>

      {/* Descrizione */}
      {service.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Azioni */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(service)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#EEBA2B] hover:bg-gray-50 rounded-lg transition"
        >
          <Edit className="w-4 h-4" />
          Modifica
        </button>
        <button
          onClick={() => onDelete(service)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Elimina
        </button>
      </div>
    </div>
  );
};
