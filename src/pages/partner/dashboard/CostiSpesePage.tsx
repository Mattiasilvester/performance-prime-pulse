/**
 * Step 8: Pagina Costi & Spese - Gestionale finanziario PrimePro.
 * Lista costi, riepilogo mensile, aggiungi/modifica/elimina. Nessuna modifica a pagine esistenti.
 */
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Receipt, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import {
  getProfessionalCosts,
  getMonthlyCostsTotal,
  createProfessionalCost,
  updateProfessionalCost,
  deleteProfessionalCost,
  replicateRecurringCosts,
  getRecurringCostsSummary,
  COST_CATEGORY_LABELS,
  COST_TYPE_LABELS,
  type ProfessionalCost,
} from '@/services/professionalCostsService';
import { CostFormModal } from '@/components/partner/costs/CostFormModal';
import { RecurringCostsBanner } from '@/components/partner/costs/RecurringCostsBanner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Normalizza valore data (string | Date | null) in stringa YYYY-MM-DD per confronti. */
function costDateToYMD(value: string | Date | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  const v = value as unknown;
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  return '';
}

export default function CostiSpesePage() {
  const professionalId = useProfessionalId();
  const [costs, setCosts] = useState<ProfessionalCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [monthTotal, setMonthTotal] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [editingCost, setEditingCost] = useState<ProfessionalCost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [recurringCount, setRecurringCount] = useState(0);
  const [recurringTotalPerMonth, setRecurringTotalPerMonth] = useState(0);

  const loadCosts = useCallback(async () => {
    if (!professionalId) {
      setLoading(false);
      setIsFirstLoad(false);
      return;
    }
    if (isFirstLoad) setLoading(true);
    try {
      await replicateRecurringCosts(professionalId, year, month);
      const { data, error } = await getProfessionalCosts(professionalId, { year, month });
      if (error) {
        if (isFirstLoad) toast.error('Errore nel caricamento dei costi');
        setCosts([]);
      } else {
        setCosts(data ?? []);
      }
      const { total, error: totalError } = await getMonthlyCostsTotal(professionalId, year, month);
      if (!totalError) setMonthTotal(total);
      const { count, totalPerMonth } = await getRecurringCostsSummary(professionalId);
      setRecurringCount(count);
      setRecurringTotalPerMonth(totalPerMonth);
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  // isFirstLoad usato solo dentro callback, non deve triggerare refetch
  }, [professionalId, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  const handleAdd = () => {
    setEditingCost(null);
    setShowModal(true);
  };

  const handleEdit = (cost: ProfessionalCost) => {
    setEditingCost(cost);
    setShowModal(true);
  };

  const handleSave = async (payload: {
    amount: number;
    category: string;
    description?: string | null;
    cost_date: string;
    cost_type: string;
    is_recurring: boolean;
    recurrence?: string | null;
  }) => {
    if (!professionalId) return;
    if (editingCost) {
      const backup = costs.find((c) => c.id === editingCost.id);
      setCosts((prev) =>
        prev.map((c) =>
          c.id === editingCost.id
            ? { ...c, ...payload, cost_date: payload.cost_date }
            : c
        )
      );
      setShowModal(false);
      setEditingCost(null);
      const { data, error } = await updateProfessionalCost(editingCost.id, payload);
      if (error) {
        if (backup) setCosts((prev) => prev.map((c) => (c.id === editingCost.id ? backup : c)));
        toast.error('Errore durante l\'aggiornamento del costo');
        return;
      }
      if (data) setCosts((prev) => prev.map((c) => (c.id === editingCost.id ? data : c)));
      getMonthlyCostsTotal(professionalId, year, month).then(({ total, error: totalErr }) => {
        if (!totalErr) setMonthTotal(total);
      });
      getRecurringCostsSummary(professionalId).then(({ count, totalPerMonth }) => {
        setRecurringCount(count);
        setRecurringTotalPerMonth(totalPerMonth);
      });
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const optimisticRow: ProfessionalCost = {
      id: tempId,
      professional_id: professionalId,
      amount: payload.amount,
      category: payload.category,
      description: payload.description ?? null,
      cost_date: payload.cost_date,
      cost_type: payload.cost_type,
      is_recurring: payload.is_recurring,
      recurrence: payload.recurrence ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCosts((prev) => [optimisticRow, ...prev]);
    setShowModal(false);
    setEditingCost(null);

    const { data, error } = await createProfessionalCost(professionalId, payload);
    if (error) {
      setCosts((prev) => prev.filter((c) => c.id !== tempId));
      toast.error('Errore durante l\'inserimento del costo');
      return;
    }
    if (data) {
      const raw = costDateToYMD(data.cost_date);
      const isoMatch = raw.match(/^(\d{4})-(\d{2})/);
      const costY = isoMatch ? parseInt(isoMatch[1], 10) : 0;
      const costM = isoMatch ? parseInt(isoMatch[2], 10) : 0;
      if (costY === year && costM === month) {
        setCosts((prev) => prev.map((c) => (c.id === tempId ? data : c)));
      } else {
        setCosts((prev) => prev.filter((c) => c.id !== tempId));
      }
    }
    getMonthlyCostsTotal(professionalId, year, month).then(({ total, error: totalErr }) => {
      if (!totalErr) setMonthTotal(total);
    });
    getRecurringCostsSummary(professionalId).then(({ count, totalPerMonth }) => {
      setRecurringCount(count);
      setRecurringTotalPerMonth(totalPerMonth);
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || !professionalId) return;
    const backup = costs;
    setCosts((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    const { error } = await deleteProfessionalCost(deleteId);
    if (error) {
      setCosts(backup);
      toast.error('Errore durante l\'eliminazione');
      return;
    }
    getMonthlyCostsTotal(professionalId, year, month).then(({ total, error: totalErr }) => {
      if (!totalErr) setMonthTotal(total);
    });
    getRecurringCostsSummary(professionalId).then(({ count, totalPerMonth }) => {
      setRecurringCount(count);
      setRecurringTotalPerMonth(totalPerMonth);
    });
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Costi & Spese
      </h1>

      {/* Su desktop: 3 colonne uguali (mese | totale | bottone); su mobile: stack verticale invariato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 items-stretch">
        {/* 1. Card Mese */}
        <div className="flex items-center justify-center md:justify-start bg-white rounded-xl border border-gray-200 p-2 min-h-[52px]">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-medium text-gray-900 capitalize min-w-[160px] text-center">
            {monthLabel}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="p-1">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* 2. Card Totale */}
        <div className="flex items-center justify-center md:justify-start bg-white rounded-xl border border-gray-200 px-4 py-3 text-center md:text-left min-h-[52px]">
          <span className="text-sm text-gray-500">Totale mese: </span>
          <span className="text-lg font-bold text-emerald-600 ml-2">
            €{monthTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* 3. Bottone Aggiungi costo — stessa riga su desktop, stile card coerente */}
        <Button
          onClick={handleAdd}
          className="w-full h-full min-h-[52px] rounded-xl bg-[#EEBA2B] hover:bg-[#d4a61f] text-black font-semibold py-4 border-0 shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi costo
        </Button>
      </div>

      <RecurringCostsBanner count={recurringCount} totalPerMonth={recurringTotalPerMonth} />

      {/* Lista costi: skeleton al primo caricamento, poi contenuto o empty */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isFirstLoad && loading ? (
          <ul className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-3 animate-pulse">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-100 rounded" />
                  <div className="h-8 w-8 bg-gray-100 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : costs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nessun costo in questo mese.</p>
            <p className="text-sm mt-1">Aggiungi un costo per iniziare.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {costs.map((cost) => (
              <li
                key={cost.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {COST_CATEGORY_LABELS[cost.category] ?? cost.category}
                  </p>
                  {cost.description && (
                    <p className="text-sm text-gray-500 truncate">{cost.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(cost.cost_date).toLocaleDateString('it-IT')}
                    {cost.cost_type && (
                      <span className="ml-2"> · {COST_TYPE_LABELS[cost.cost_type as keyof typeof COST_TYPE_LABELS] ?? cost.cost_type}</span>
                    )}
                    {cost.is_recurring && cost.recurrence && (
                      <span className="ml-2"> · Ricorrente ({cost.recurrence === 'monthly' ? 'mensile' : 'annuale'})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-gray-900">
                    €{Number(cost.amount).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cost)}
                    className="text-gray-600 hover:text-[#EEBA2B]"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(cost.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CostFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCost(null);
        }}
        onSave={handleSave}
        initial={editingCost ?? undefined}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina costo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo costo? L&apos;operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
