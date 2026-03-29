import type { CSSProperties } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pencil, Star, Trash2 } from 'lucide-react';
import type { DiaryNote, NoteCategory } from '@/services/notesService';

const ACTION_BTN_STYLE: CSSProperties = {
  background: '#0A0A0C',
  border: '1px solid #2a2a2e',
  borderRadius: '8px',
  padding: '4px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CATEGORY_META: Record<
  NoteCategory,
  { emoji: string; bg: string; text: string; label: string }
> = {
  allenamento: { emoji: '💪', bg: 'bg-[#EEBA2B22]', text: 'text-[#EEBA2B]', label: 'Allenamento' },
  nutrizione: { emoji: '🥗', bg: 'bg-[#10B98122]', text: 'text-[#10B981]', label: 'Nutrizione' },
  mentale: { emoji: '🧠', bg: 'bg-[#8B5CF622]', text: 'text-[#A78BFA]', label: 'Mentale' },
  generale: { emoji: '📝', bg: 'bg-[#3B82F622]', text: 'text-[#60A5FA]', label: 'Generale' },
};

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const t = format(d, 'HH:mm');
  if (isToday(d)) return `Oggi ${t}`;
  if (isYesterday(d)) return `Ieri ${t}`;
  return format(d, 'd MMM HH:mm', { locale: it });
}

export interface NoteCardProps {
  note: DiaryNote;
  busy?: boolean;
  onEdit: () => void;
  onToggleHighlight: () => void;
  onDelete: () => void;
  onTogglePrimebot: () => void;
}

export function NoteCard({
  note,
  busy,
  onEdit,
  onToggleHighlight,
  onDelete,
  onTogglePrimebot,
}: NoteCardProps) {
  const cat = CATEGORY_META[note.category];
  const borderPrime = note.primebot_visible ? 'border-[#EEBA2B44]' : 'border-[#2a2a2e]';
  const borderLeft = note.is_highlighted ? 'border-l-[3px] border-l-[#EEBA2B]' : '';

  const primebotPillStyle: CSSProperties = {
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 600,
    borderRadius: '20px',
    border: note.primebot_visible ? '1px solid #EEBA2B33' : '1px solid #2a2a2e',
    background: note.primebot_visible ? '#EEBA2B15' : '#16161A',
    color: note.primebot_visible ? '#EEBA2B' : '#8A8A96',
    cursor: busy ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      className={`bg-[#16161A] border rounded-[14px] p-4 ${borderPrime} ${borderLeft}`}
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.bg} ${cat.text}`}
        >
          {cat.emoji} {cat.label}
        </span>
        <span className="text-[10px] text-[#8A8A96] whitespace-nowrap shrink-0">
          {formatNoteDate(note.updated_at || note.created_at)}
        </span>
      </div>
      <p
        className="text-[15px] line-clamp-3 mb-3 leading-relaxed"
        style={{ color: '#D1D1D6' }}
      >
        {note.content}
      </p>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <button
          type="button"
          disabled={busy}
          onClick={onTogglePrimebot}
          className="inline-flex items-center gap-1.5 shrink-0"
          style={primebotPillStyle}
        >
          <span
            className="rounded-full shrink-0"
            style={{
              width: 6,
              height: 6,
              background: note.primebot_visible ? '#EEBA2B' : '#8A8A96',
            }}
          />
          {note.primebot_visible ? 'Visibile a PrimeBot' : 'Privata'}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            style={{ ...ACTION_BTN_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
            className="disabled:opacity-50"
            aria-label="Modifica"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0 text-[#8A8A96]" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onToggleHighlight}
            style={{ ...ACTION_BTN_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
            className="disabled:opacity-50"
            aria-label="Evidenza"
          >
            <Star
              className={`w-3.5 h-3.5 shrink-0 ${note.is_highlighted ? 'text-[#EEBA2B]' : 'text-[#8A8A96]'}`}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            style={{ ...ACTION_BTN_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
            className="group disabled:opacity-50"
            aria-label="Elimina"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0 text-[#8A8A96] transition-colors group-hover:text-[#EF4444]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
