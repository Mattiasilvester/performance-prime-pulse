export type FilterType = 'all' | 'saved' | 'completed';

interface DiaryFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const DiaryFilters = ({ activeFilter, onFilterChange }: DiaryFiltersProps) => {
  return (
    <div className="flex justify-center gap-2 py-3 px-4">
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
          activeFilter === 'all'
            ? 'bg-[#EEBA2B] border border-[#EEBA2B] text-black font-semibold'
            : 'bg-[#16161A] border border-[#2a2a2e] text-[#8A8A96] hover:border-[#EEBA2B]/50'
        }`}
      >
        Tutti
      </button>
      <button
        type="button"
        onClick={() => onFilterChange('saved')}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
          activeFilter === 'saved'
            ? 'bg-[#EEBA2B] border border-[#EEBA2B] text-black font-semibold'
            : 'bg-[#16161A] border border-[#2a2a2e] text-[#8A8A96] hover:border-[#EEBA2B]/50'
        }`}
      >
        Salvati
      </button>
      <button
        type="button"
        onClick={() => onFilterChange('completed')}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
          activeFilter === 'completed'
            ? 'bg-[#EEBA2B] border border-[#EEBA2B] text-black font-semibold'
            : 'bg-[#16161A] border border-[#2a2a2e] text-[#8A8A96] hover:border-[#EEBA2B]/50'
        }`}
      >
        Completati
      </button>
    </div>
  );
};
