import { FolderKanban } from 'lucide-react';

export default function ProgettiPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Progetti</h1>
      <p className="text-gray-500">Gestisci i tuoi progetti</p>
      
      <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Funzionalità in arrivo...</p>
      </div>
    </div>
  );
}

