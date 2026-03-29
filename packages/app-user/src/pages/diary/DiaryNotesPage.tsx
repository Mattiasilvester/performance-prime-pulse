import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import { subDays } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  bulkSetPrimebotVisible,
  togglePrimebotVisible,
  type DiaryNote,
} from '@/services/notesService';
import { NoteCard } from '@/components/diary/NoteCard';
import { CreateNoteModal } from '@/components/diary/CreateNoteModal';
import { EditNoteModal } from '@/components/diary/EditNoteModal';
type FilterTab = 'all' | '7d' | '30d' | 'star' | 'bot';

function PrimebotBannerToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
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

export default function DiaryNotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [cardBusyId, setCardBusyId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editNote, setEditNote] = useState<DiaryNote | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getNotes(user.id);
      setNotes(list);
    } catch (e) {
      console.error(e);
      toast.error('Impossibile caricare le note');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const allPrimebotOn = notes.length > 0 && notes.every((n) => n.primebot_visible);

  const handleBulkPrimebot = async (visible: boolean) => {
    if (!user?.id || notes.length === 0) return;
    setBulkBusy(true);
    try {
      await bulkSetPrimebotVisible(user.id, visible);
      await load();
      toast.success(visible ? 'Tutte le note sono visibili a PrimeBot' : 'Condivisione PrimeBot disattivata per tutte le note');
    } catch (e) {
      console.error(e);
      toast.error('Operazione non riuscita');
    } finally {
      setBulkBusy(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...notes];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((n) => n.content.toLowerCase().includes(q));

    const now = new Date();
    if (filterTab === '7d') {
      const cut = subDays(now, 7);
      list = list.filter((n) => new Date(n.updated_at || n.created_at) >= cut);
    } else if (filterTab === '30d') {
      const cut = subDays(now, 30);
      list = list.filter((n) => new Date(n.updated_at || n.created_at) >= cut);
    } else if (filterTab === 'star') {
      list = list.filter((n) => n.is_highlighted);
    } else if (filterTab === 'bot') {
      list = list.filter((n) => n.primebot_visible);
    }
    return list;
  }, [notes, search, filterTab]);

  const highlighted = filtered.filter((n) => n.is_highlighted);
  const recent = filtered.filter((n) => !n.is_highlighted);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tutte' },
    { id: '7d', label: '7 giorni' },
    { id: '30d', label: '30 giorni' },
    { id: 'star', label: '⭐ In evidenza' },
    { id: 'bot', label: '🤖 PrimeBot' },
  ];

  if (!user) {
    return (
      <div
        className="min-h-screen bg-background pb-20 px-4 flex items-center justify-center"
        style={{
          fontFamily: 'Outfit, system-ui, sans-serif',
          paddingTop: 'calc(6rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <p className="text-[#8A8A96]">Accedi per vedere le note.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background pb-20"
      style={{
        fontFamily: 'Outfit, system-ui, sans-serif',
        paddingTop: 'calc(6rem + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Note</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-[#EEBA2B] text-black rounded-full px-4 py-2 text-sm font-semibold shrink-0"
        >
          + Nuova nota
        </button>
      </div>

      <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-[#16161A] border border-[#EEBA2B33] rounded-xl p-3 flex items-center gap-3">
          <div className="flex items-center justify-center bg-[#EEBA2B22] rounded-lg w-7 h-7 text-sm shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-white leading-tight">
              PrimeBot può leggere le tue note
            </p>
            <p className="text-[12px] text-[#8A8A96] leading-tight mt-0.5">
              Attiva per singola nota o tutte insieme
            </p>
          </div>
          <PrimebotBannerToggle
            checked={allPrimebotOn}
            onChange={(v) => void handleBulkPrimebot(v)}
            disabled={bulkBusy || notes.length === 0}
          />
        </div>
      </div>

      <div
        className="bg-background mt-4"
        style={{
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          position: 'relative',
        }}
      >
        <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4">
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div
              className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
              style={
                {
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  paddingRight: '48px',
                } as CSSProperties
              }
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTab(t.id)}
                  className={
                    filterTab === t.id
                      ? 'bg-[#EEBA2B] text-black rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0'
                      : 'bg-[#16161A] text-[#8A8A96] border border-[#2a2a2e] rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap shrink-0'
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
              style={{
                background: 'linear-gradient(to right, transparent, hsl(var(--background)))',
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 mt-3 relative">
        <span className="absolute left-7 top-1/2 -translate-y-1/2 text-sm pointer-events-none" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca nelle note…"
          className="w-full bg-[#16161A] border border-[#2a2a2e] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#8A8A96] focus:outline-none focus:border-[#EEBA2B44]"
        />
      </div>

      <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 mt-4 space-y-6 pb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-2 border-[#EEBA2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-[#8A8A96]">Nessuna nota in questo filtro.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-[#EEBA2B] text-black rounded-full px-6 py-2.5 text-sm font-semibold"
            >
              Crea una nota
            </button>
          </div>
        ) : (
          <>
            {highlighted.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A96] mb-2">
                  In evidenza
                </h2>
                <div className="space-y-3">
                  {highlighted.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      busy={cardBusyId === note.id}
                      onEdit={() => setEditNote(note)}
                      onToggleHighlight={async () => {
                        if (!user.id) return;
                        setCardBusyId(note.id);
                        try {
                          await updateNote(note.id, user.id, {
                            is_highlighted: !note.is_highlighted,
                          });
                          await load();
                        } catch (e) {
                          toast.error('Errore aggiornamento');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                      onDelete={async () => {
                        if (!user.id || !confirm('Eliminare questa nota?')) return;
                        setCardBusyId(note.id);
                        try {
                          await deleteNote(note.id, user.id);
                          await load();
                          toast.success('Nota eliminata');
                        } catch (e) {
                          toast.error('Eliminazione non riuscita');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                      onTogglePrimebot={async () => {
                        if (!user.id) return;
                        setCardBusyId(note.id);
                        try {
                          await togglePrimebotVisible(note.id, user.id, !note.primebot_visible);
                          await load();
                        } catch (e) {
                          toast.error('Errore');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
            {recent.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A96] mb-2">
                  Recenti
                </h2>
                <div className="space-y-3">
                  {recent.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      busy={cardBusyId === note.id}
                      onEdit={() => setEditNote(note)}
                      onToggleHighlight={async () => {
                        if (!user.id) return;
                        setCardBusyId(note.id);
                        try {
                          await updateNote(note.id, user.id, {
                            is_highlighted: !note.is_highlighted,
                          });
                          await load();
                        } catch (e) {
                          toast.error('Errore aggiornamento');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                      onDelete={async () => {
                        if (!user.id || !confirm('Eliminare questa nota?')) return;
                        setCardBusyId(note.id);
                        try {
                          await deleteNote(note.id, user.id);
                          await load();
                          toast.success('Nota eliminata');
                        } catch (e) {
                          toast.error('Eliminazione non riuscita');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                      onTogglePrimebot={async () => {
                        if (!user.id) return;
                        setCardBusyId(note.id);
                        try {
                          await togglePrimebotVisible(note.id, user.id, !note.primebot_visible);
                          await load();
                        } catch (e) {
                          toast.error('Errore');
                        } finally {
                          setCardBusyId(null);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <CreateNoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={async (data) => {
          if (!user.id) return;
          await createNote(user.id, {
            content: data.content,
            category: data.category,
            primebot_visible: data.primebot_visible,
          });
          await load();
          toast.success('Nota creata');
        }}
      />

      <EditNoteModal
        open={!!editNote}
        note={editNote}
        onClose={() => setEditNote(null)}
        onSave={async (data) => {
          if (!user.id || !editNote) return;
          const title = data.content.slice(0, 50) || 'Nota';
          await updateNote(editNote.id, user.id, {
            content: data.content,
            title,
            category: data.category,
            primebot_visible: data.primebot_visible,
          });
          await load();
          toast.success('Nota aggiornata');
        }}
      />
    </div>
  );
}
