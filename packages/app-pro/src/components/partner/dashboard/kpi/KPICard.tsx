import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: {
    value: number; // percentuale positiva o negativa
    isPositive: boolean;
  };
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  isActive,
  onClick,
  isLoading = false
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm border border-gray-100
        ${isActive
          ? 'border-2 border-[#EEBA2B] shadow-lg shadow-[#EEBA2B]/20'
          : 'hover:border-[#EEBA2B]/50'
        }
      `}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      ) : (
        <>
          {/* Header con icona e titolo */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">{title}</span>
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#EEBA2B]' : 'text-gray-500'}`} />
          </div>

          {/* Valore principale */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {trend !== undefined && (
              <span className={`text-sm font-medium flex items-center ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Sottotitolo */}
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </>
      )}
    </div>
  );
}
