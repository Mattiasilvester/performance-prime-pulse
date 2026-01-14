import { ClipboardList } from 'lucide-react';

export default function PrenotazioniPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prenotazioni</h1>
      <p className="text-gray-500">Visualizza e gestisci le prenotazioni</p>
      
      <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Funzionalità in arrivo...</p>
      </div>
    </div>
  );
}

