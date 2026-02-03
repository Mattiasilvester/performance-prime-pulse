import { Button } from "@/components/ui/button";

export type FilterType = 'all' | 'saved' | 'completed';

interface DiaryFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const DiaryFilters = ({ activeFilter, onFilterChange }: DiaryFiltersProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
        size="sm"
        className={`whitespace-nowrap ${
          activeFilter === 'all' 
            ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold' 
            : 'border-border text-foreground hover:bg-muted'
        }`}
      >
        Tutti
      </Button>
      <Button
        variant={activeFilter === 'saved' ? 'default' : 'outline'}
        onClick={() => onFilterChange('saved')}
        size="sm"
        className={`whitespace-nowrap ${
          activeFilter === 'saved' 
            ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold' 
            : 'border-border text-foreground hover:bg-muted'
        }`}
      >
        💾 Salvati
      </Button>
      <Button
        variant={activeFilter === 'completed' ? 'default' : 'outline'}
        onClick={() => onFilterChange('completed')}
        size="sm"
        className={`whitespace-nowrap ${
          activeFilter === 'completed' 
            ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold' 
            : 'border-border text-foreground hover:bg-muted'
        }`}
      >
        ✅ Completati
      </Button>
    </div>
  );
};
