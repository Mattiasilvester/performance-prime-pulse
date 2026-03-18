import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryNote, NoteCategory } from '@/services/notesService';

const CATEGORY_META: Record<
  NoteCategory,
  { emoji: string; label: string; bg: string; text: string }
> = {
  allenamento: { emoji: '💪', label: 'Allenamento', bg: 'bg-[#EEBA2B22]', text: 'text-[#EEBA2B]' },
  nutrizione: { emoji: '🥗', label: 'Nutrizione', bg: 'bg-[#10B98122]', text: 'text-[#10B981]' },
  mentale: { emoji: '🧠', label: 'Mentale', bg: 'bg-[#8B5CF622]', text: 'text-[#A78BFA]' },
  generale: { emoji: '📝', label: 'Generale', bg: 'bg-[#3B82F622]', text: 'text-[#60A5FA]' },
};

const CATEGORIES = Object.keys(CATEGORY_META) as NoteCategory[];

function PrimebotToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: checked ? '#EEBA2B22' : '#2a2a2e',
          border: checked ? '1px solid #EEBA2B66' : '1px solid #3a3a3e',
          borderRadius: '10px',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '14px',
            height: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            left: checked ? '19px' : '3px',
            background: checked ? '#EEBA2B' : '#8A8A96',
            borderRadius: '50%',
            transition: 'left 0.2s, background 0.2s',
          }}
        />
      </div>
    </div>
  );
}

export interface EditNoteModalProps {
  open: boolean;
  note: DiaryNote | null;
  onClose: () => void;
  onSave: (data: {
    content: string;
    category: NoteCategory;
    primebot_visible: boolean;
  }) => Promise<void>;
}

export function EditNoteModal({ open, note, onClose, onSave }: EditNoteModalProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('generale');
  const [primebotVisible, setPrimebotVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && note) {
      setContent(note.content);
      setCategory(note.category);
      setPrimebotVisible(note.primebot_visible);
    }
  }, [open, note]);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent('pp-note-editor-modal', { detail: 1 }));
    return () => {
      window.dispatchEvent(new CustomEvent('pp-note-editor-modal', { detail: -1 }));
    };
  }, [open]);

  const handleSave = async () => {
    const t = content.trim();
    if (t.length < 3) return;
    setSaving(true);
    try {
      await onSave({ content: t, category, primebot_visible: primebotVisible });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && note && (
        <>
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
          />
          <div className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[96vh] items-end justify-center px-4 pt-4 pb-2 sm:items-center sm:p-6">
            <motion.div
              className="w-full max-w-lg mx-auto bg-[#16161A] border border-[#2a2a2e] rounded-[20px] px-5 pt-5 max-h-[min(92vh,900px)] overflow-y-auto"
              style={{
                paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))',
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-semibold text-white mb-4">Modifica nota</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                placeholder="Scrivi qui…"
                className="w-full bg-[#0A0A0C] border border-[#2a2a2e] rounded-xl p-3 text-sm text-white placeholder-[#8A8A96] h-28 resize-none focus:outline-none focus:border-[#EEBA2B66]"
              />
              <p className="text-xs text-[#8A8A96] text-right mt-1">{content.length}/500</p>
              <p className="text-xs text-[#8A8A96] mt-3 mb-2">Categoria</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const m = CATEGORY_META[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity ${
                        m.bg
                      } ${m.text} ${active ? 'ring-2 ring-white/30 opacity-100' : 'opacity-70'}`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-5 mb-4">
                <PrimebotToggle checked={primebotVisible} onChange={setPrimebotVisible} disabled={saving} />
                <span className="text-xs text-[#8A8A96]">Visibile a PrimeBot</span>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => !saving && onClose()}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white border border-[#2a2a2e] bg-transparent hover:bg-[#2a2a2e]/50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={saving || content.trim().length < 3}
                  onClick={() => void handleSave()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#EEBA2B] text-black disabled:opacity-50"
                >
                  {saving ? 'Salvataggio…' : 'Salva'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
