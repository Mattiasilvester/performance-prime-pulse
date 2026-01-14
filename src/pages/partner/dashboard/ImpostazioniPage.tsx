import { Settings } from 'lucide-react';

export default function ImpostazioniPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Impostazioni</h1>
      <p className="text-gray-500">Configura le tue preferenze</p>
      
      <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Funzionalità in arrivo...</p>
      </div>
    </div>
  );
}

