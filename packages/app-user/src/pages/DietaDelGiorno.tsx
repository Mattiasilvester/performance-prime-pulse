import { useLocation, useNavigate } from 'react-router-dom';
import type { NutritionPlanRecord } from '@/types/nutritionPlan';
import type { NutritionMeal, NutritionFood } from '@/types/nutritionPlan';

interface DietaDelGiornoState {
  plan: NutritionPlanRecord;
  dayIndex: number;
}

export default function DietaDelGiorno() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as DietaDelGiornoState | null;

  if (!state?.plan || state.dayIndex === undefined) {
    navigate('/i-miei-piani', { replace: true });
    return null;
  }

  const { plan, dayIndex } = state;
  const giorni = plan.contenuto?.giorni ?? [];
  const giorno = giorni[dayIndex];

  if (!giorno) {
    navigate('/i-miei-piani', { replace: true });
    return null;
  }

  const dayName = giorno.giorno ?? `Giorno ${dayIndex + 1}`;
  const pasti: NutritionMeal[] = giorno.pasti ?? [];
  const calorieTotali = giorno.calorie_totali ?? null;
  const macro = plan.contenuto?.macronutrienti ?? null;
  const planName = plan.name ?? plan.contenuto?.nome ?? 'Piano nutrizionale';

  return (
    <div
      className="min-h-screen bg-[#0A0A0C]"
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      {/* Header fisso */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/7 bg-[#0A0A0C]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/i-miei-piani')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Indietro"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[#8A8A96] truncate">{planName}</p>
            <h1 className="text-lg font-bold text-white truncate">{dayName}</h1>
          </div>
        </div>
      </header>

      <main className="-mt-[60px] pt-0 pb-24 px-4">
        {/* Strip macro (solo se calorieTotali o macro disponibili) — dentro contenuto scrollabile */}
        {(calorieTotali != null || macro != null) && (
          <div className="mx-0 mb-3 rounded-[12px] border border-white/7 bg-[#16161A] p-3">
            <div className="flex flex-wrap gap-4">
              {calorieTotali != null && (
                <div>
                  <p className="text-base font-bold text-[#EEBA2B]">{calorieTotali}</p>
                  <p className="text-[10px] text-[#8A8A96]">kcal</p>
                </div>
              )}
              {macro != null && (
                <>
                  <div>
                    <p className="text-base font-bold text-[#EEBA2B]">{macro.proteine_percentuale}%</p>
                    <p className="text-[10px] text-[#8A8A96]">proteine</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#EEBA2B]">{macro.carboidrati_percentuale}%</p>
                    <p className="text-[10px] text-[#8A8A96]">carboidrati</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#EEBA2B]">{macro.grassi_percentuale}%</p>
                    <p className="text-[10px] text-[#8A8A96]">grassi</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {pasti.map((pasto, i) => {
          const alimenti = (pasto.alimenti ?? (pasto as { foods?: NutritionFood[] }).foods ?? []) as NutritionFood[];
          return (
            <div
              key={i}
              className="mb-3 rounded-[14px] border border-white/7 bg-[#16161A] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                {pasto.orario && (
                  <span
                    className="rounded-full border px-2 py-0.5 text-[11px] font-bold text-[#EEBA2B]"
                    style={{
                      background: 'rgba(238,186,43,0.15)',
                      borderColor: 'rgba(238,186,43,0.25)',
                    }}
                  >
                    {pasto.orario}
                  </span>
                )}
                <span className="text-sm font-semibold text-white">
                  {(pasto as { name?: string }).name ?? pasto.nome ?? 'Pasto'}
                </span>
              </div>
              <div className="space-y-0">
                {alimenti.map((alimento, j) => {
                  const nome = (alimento as { name?: string }).name ?? alimento.nome ?? '';
                  const quantita = (alimento as { quantity?: string }).quantity ?? alimento.quantita ?? '';
                  const kcalVal = (alimento as unknown as Record<string, unknown>).kcal ?? alimento.calorie ?? undefined;
                  const isLast = j === alimenti.length - 1;
                  return (
                    <div
                      key={j}
                      className={`flex items-center justify-between py-1.5 ${!isLast ? 'border-b border-white/7' : ''}`}
                    >
                      <span className="text-xs text-[#ccc]">{nome}</span>
                      <span className="text-[11px] text-[#8A8A96] whitespace-nowrap">
                        {[quantita, kcalVal != null ? `${kcalVal} kcal` : ''].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
