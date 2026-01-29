import { ArrowLeft } from 'lucide-react';

interface KPIViewHeaderProps {
  title: string;
  onBack: () => void;
}

export function KPIViewHeader({ title, onBack }: KPIViewHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Torna alla Dashboard</span>
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}
