import { Calendar } from 'lucide-react';

export default function CalendarioPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendario</h1>
      <p className="text-gray-500">Gestisci la tua disponibilità</p>
      
      <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Funzionalità in arrivo...</p>
      </div>
    </div>
  );
}

