import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { NutritionPlanRecord } from '@/types/nutritionPlan';
import type { NutritionMeal } from '@/types/nutritionPlan';
import { downloadNutritionPlanPDF } from '@/utils/pdfExport';

interface NutritionPlanCardProps {
  plan: NutritionPlanRecord;
  userId: string;
  onDelete?: (id: string) => void;
  onUpdate?: (updated: NutritionPlanRecord) => void;
}

export function NutritionPlanCard({ plan, userId, onDelete, onUpdate }: NutritionPlanCardProps) {
  const navigate = useNavigate();
  const [expandedDay, setExpandedDay] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(plan.name ?? plan.contenuto?.nome ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const giorni = plan.contenuto?.giorni ?? [];
  const giorniCount = giorni.length;
  const durationLabel = giorniCount > 0 ? `${giorniCount} giorni` : 'Piano nutrizionale';
  const goalLabel = plan.goal ?? 'Nutrizione';
  const kcal =
    plan.contenuto?.calorie_giornaliere ??
    plan.calorie_giornaliere ??
    null;
  const previewText =
    kcal != null ? `~${kcal} kcal/giorno` : '';

  const handleRename = useCallback(async () => {
    const trimmed = editName.trim();
    const currentName = plan.name ?? plan.contenuto?.nome ?? '';
    if (trimmed === '' || trimmed === currentName) {
      setIsEditing(false);
      setEditName(currentName);
      return;
    }
    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .update({ name: trimmed })
        .eq('id', plan.id);
      if (error) throw error;
      setIsEditing(false);
      onUpdate?.({ ...plan, name: trimmed });
    } catch (err) {
      console.error('Errore rename piano nutrizione:', err);
      setEditName(plan.name ?? plan.contenuto?.nome ?? '');
      setIsEditing(false);
    }
  }, [editName, plan, onUpdate]);

  const handleDownloadPDF = useCallback(() => {
    try {
      if (plan.contenuto) downloadNutritionPlanPDF(plan.contenuto);
    } catch (err) {
      console.error('Errore export PDF nutrizione:', err);
    }
  }, [plan.contenuto]);

  const handleDelete = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('id', plan.id)
        .eq('user_id', userId);
      if (error) throw error;
      onDelete?.(plan.id);
    } catch (err) {
      console.error('Errore eliminazione piano nutrizione:', err);
    }
  }, [plan.id, userId, onDelete]);

  const handleDeleteClick = useCallback(() => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    handleDelete();
  }, [deleteConfirm, handleDelete]);

  const selectedDay = giorni[expandedDay];
  const pasti: NutritionMeal[] = selectedDay?.pasti ?? [];
  const maxPreview = 5;
  const hasMore = pasti.length > maxPreview;
  const previewPasti = pasti.slice(0, maxPreview);

  const displayName = plan.name ?? plan.contenuto?.nome ?? '';
  const pencilSvg = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  return (
    <div
      className="mb-[10px] rounded-[16px] border p-4 transition-[border-color] duration-200 hover:border-[rgba(238,186,43,0.20)]"
      style={{ fontFamily: 'Outfit, system-ui, sans-serif', background: '#16161A', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start gap-3 mb-2" style={{ gap: 12 }}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[18px]"
          style={{ background: 'rgba(238,186,43,0.12)', border: '1px solid rgba(238,186,43,0.25)' }}
        >
          🥗
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center mb-[5px]" style={{ gap: 6 }}>
            {isEditing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditName(displayName);
                  }
                }}
                autoFocus
                className="w-full rounded-[7px] text-white outline-none border"
                style={{
                  fontFamily: 'inherit',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(238,186,43,0.08)',
                  border: '1px solid rgba(238,186,43,0.30)',
                  padding: '2px 8px',
                }}
              />
            ) : (
              <>
                <span
                  className="min-w-0 flex-1 truncate text-white"
                  style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditName(displayName); }}
                  className="shrink-0 p-0.5 bg-transparent border-none cursor-pointer text-[#4a4a52] hover:text-[#EEBA2B] transition-colors duration-200"
                  style={{ width: 13, height: 13 }}
                  title="Rinomina piano"
                  aria-label="Rinomina piano"
                >
                  {pencilSvg}
                </button>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-[5px]">
            <span
              className="rounded-[20px] font-semibold"
              style={{
                background: 'rgba(238,186,43,0.15)',
                color: '#EEBA2B',
                border: '1px solid rgba(238,186,43,0.25)',
                fontSize: 11,
                padding: '2px 8px',
              }}
            >
              {durationLabel}
            </span>
            <span
              className="rounded-[20px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#8A8A96',
                fontSize: 11,
                padding: '2px 8px',
                border: 'none',
              }}
            >
              {goalLabel}
            </span>
          </div>
          {previewText ? (
            <p className="mt-1 text-[#8A8A96]" style={{ fontSize: 12, lineHeight: 1.5 }}>{previewText}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((e) => !e)}
          className="shrink-0 flex items-center justify-center rounded p-1 text-[#8A8A96] transition-transform duration-200 hover:text-white cursor-pointer"
          style={{ width: 26, height: 26, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Chiudi pannello' : 'Apri pannello'}
        >
          <ChevronRight className="shrink-0" style={{ width: 26, height: 26 }} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-0">
              <p
                className="uppercase text-[#8A8A96] font-semibold"
                style={{ fontSize: 11, letterSpacing: 0.5, marginTop: 12, marginBottom: 8 }}
              >
                Seleziona giorno
              </p>
              <div
                className="flex overflow-x-auto scrollbar-none"
                style={{ gap: 7, paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {giorni.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setExpandedDay(i)}
                    className="flex-shrink-0 rounded-[20px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer border"
                    style={{
                      padding: '7px 14px',
                      fontSize: 12,
                      ...(expandedDay === i
                        ? { background: '#EEBA2B', color: '#000000', borderColor: '#EEBA2B' }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            color: '#8A8A96',
                            borderColor: 'rgba(255,255,255,0.07)',
                          }),
                    }}
                    onMouseEnter={(e) => {
                      if (expandedDay !== i) {
                        e.currentTarget.style.borderColor = 'rgba(238,186,43,0.25)';
                        e.currentTarget.style.color = '#EEBA2B';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (expandedDay !== i) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.color = '#8A8A96';
                      }
                    }}
                  >
                    {g.giorno || `Giorno ${i + 1}`}
                  </button>
                ))}
                {giorniCount === 0 && (
                  <span className="text-xs text-[#8A8A96]">Nessun giorno</span>
                )}
              </div>

              <div
                className="rounded-[10px] border"
                style={{ background: '#0A0A0C', borderColor: 'rgba(255,255,255,0.07)', padding: '12px 14px', marginTop: 8, marginBottom: 12 }}
              >
                <p className="font-bold text-[#EEBA2B] mb-2" style={{ fontSize: 12, marginBottom: 8 }}>
                  🥗 {selectedDay?.giorno ?? `Giorno ${expandedDay + 1}`}
                </p>
                <div>
                  {previewPasti.map((pasto, i) => (
                    <div
                      key={i}
                      className="flex items-center border-b border-white/7 last:border-b-0"
                      style={{ gap: 8, padding: '5px 0', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                      <span
                        className="w-14 shrink-0 text-[#EEBA2B]"
                        style={{ fontSize: 10 }}
                      >
                        {pasto.orario ?? ''}
                      </span>
                      <span className="flex-1 text-[#dddddd]" style={{ fontSize: 12 }}>{pasto.nome}</span>
                      {pasto.calorie_totali != null && (
                        <span className="text-[11px] text-[#8A8A96] whitespace-nowrap">
                          {pasto.calorie_totali} kcal
                        </span>
                      )}
                    </div>
                  ))}
                  {hasMore && (
                    <p className="text-[11px] text-[#8A8A96] pt-1">
                      + {pasti.length - maxPreview} altri
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dieta-del-giorno', { state: { plan, dayIndex: expandedDay } })}
                className="w-full rounded-[11px] text-black flex items-center justify-center border-none cursor-pointer transition-all"
                style={{
                  background: '#EEBA2B',
                  padding: '12px 0',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d4a61f';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#EEBA2B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              >
                🕐 Segui piano oggi
              </button>
            </div>

            <div
              className="flex items-center justify-between border-t"
              style={{ borderColor: 'rgba(255,255,255,0.07)', paddingTop: 10, marginTop: 12 }}
            >
              <p className="text-[11px] text-[#4a4a52]">
                {plan.created_at
                  ? new Intl.DateTimeFormat('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(plan.created_at))
                  : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center rounded-[8px] font-semibold cursor-pointer border transition-colors h-[30px] px-[11px]"
                  style={{
                    background: 'rgba(238,186,43,0.10)',
                    border: '1px solid rgba(238,186,43,0.30)',
                    color: '#EEBA2B',
                    fontSize: 11,
                    padding: '6px 11px',
                    gap: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(238,186,43,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(238,186,43,0.10)'; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  PDF
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="rounded-[8px] cursor-pointer border h-[30px] transition-all duration-200 flex items-center gap-1"
                  style={
                    deleteConfirm
                      ? { fontSize: 11, padding: '6px 11px', gap: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.40)', color: '#ef4444', fontWeight: 600 }
                      : { fontSize: 11, padding: '6px 11px', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8A8A96', fontWeight: 500 }
                  }
                  onMouseEnter={(e) => {
                    if (!deleteConfirm) {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
                      e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)';
                      e.currentTarget.style.color = '#ef4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deleteConfirm) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.color = '#8A8A96';
                    }
                  }}
                >
                  {deleteConfirm ? 'Conferma eliminazione' : '🗑 Elimina'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <div
          className="flex items-center justify-between border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', paddingTop: 10, marginTop: 12 }}
        >
          <p className="text-[11px] text-[#4a4a52]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            {plan.created_at
              ? new Intl.DateTimeFormat('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(plan.created_at))
              : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center rounded-[8px] font-semibold cursor-pointer border transition-colors h-[30px] px-[11px]"
              style={{
                background: 'rgba(238,186,43,0.10)',
                border: '1px solid rgba(238,186,43,0.30)',
                color: '#EEBA2B',
                fontSize: 11,
                padding: '6px 11px',
                gap: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(238,186,43,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(238,186,43,0.10)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PDF
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="rounded-[8px] cursor-pointer border h-[30px] transition-all duration-200 flex items-center gap-1"
              style={
                deleteConfirm
                  ? { fontSize: 11, padding: '6px 11px', gap: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.40)', color: '#ef4444', fontWeight: 600 }
                  : { fontSize: 11, padding: '6px 11px', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8A8A96', fontWeight: 500 }
              }
              onMouseEnter={(e) => {
                if (!deleteConfirm) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)';
                  e.currentTarget.style.color = '#ef4444';
                }
              }}
              onMouseLeave={(e) => {
                if (!deleteConfirm) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = '#8A8A96';
                }
              }}
            >
              {deleteConfirm ? 'Conferma eliminazione' : '🗑 Elimina'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
