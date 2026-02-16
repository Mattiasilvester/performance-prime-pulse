import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  /** Etichetta per il conteggio (es. "certificazioni" o "titoli") */
  countLabel?: string;
}

export function TagsInput({ tags, onChange, placeholder = 'Es. Laurea in Scienze Motorie', maxTags = 10, countLabel = 'certificazioni' }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const newTag = inputValue.trim();
    if (!newTag || tags.length >= maxTags) return;
    if (!tags.includes(newTag)) {
      onChange([...tags, newTag]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus-within:ring-2 focus-within:ring-[var(--partner-accent)] focus-within:border-transparent transition-all duration-200">
        <div className="flex flex-wrap gap-2 min-h-[24px] items-center">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-orange-500 hover:text-orange-700 hover:bg-orange-200 transition-colors"
                aria-label="Rimuovi"
              >
                <X className="w-3 h-3 flex-shrink-0" />
              </button>
            </span>
          ))}
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) handleAdd();
              }}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-white placeholder:text-gray-400"
              disabled={tags.length >= maxTags}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inputValue.trim() || tags.length >= maxTags}
              className="px-3 py-2 bg-[#EEBA2B] text-black rounded-lg font-medium hover:bg-[#d4a826] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Scrivi e premi &quot;Aggiungi&quot; o Enter per inserire
      </p>
      {tags.length > 0 && (
        <p className="text-xs text-gray-500 -mt-1">
          {tags.length}/{maxTags} {countLabel} aggiunt{countLabel === 'certificazioni' ? 'e' : 'i'}
        </p>
      )}
    </div>
  );
}

