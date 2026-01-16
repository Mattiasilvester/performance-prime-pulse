import { useState } from 'react';
import DisponibilitaManager from '@/components/partner/calendario/DisponibilitaManager';
import AgendaView from '@/components/partner/calendario/AgendaView';

export default function CalendarioPage() {
  const [activeTab, setActiveTab] = useState<'disponibilita' | 'agenda'>('disponibilita');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendario</h1>
      <p className="text-gray-500 mb-6">Gestisci la tua disponibilità e visualizza gli appuntamenti</p>
      
      {/* Tab navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('disponibilita')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'disponibilita'
              ? 'text-[#EEBA2B] border-b-2 border-[#EEBA2B]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Disponibilità
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'agenda'
              ? 'text-[#EEBA2B] border-b-2 border-[#EEBA2B]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Agenda
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'disponibilita' && <DisponibilitaManager />}
      {activeTab === 'agenda' && <AgendaView />}
    </div>
  );
}

