/**
 * Step 8: Modal Aggiungi/Modifica costo - Costi & Spese PrimePro.
 */
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COST_CATEGORIES,
  COST_CATEGORY_LABELS,
  COST_TYPES,
  COST_TYPE_LABELS,
  type ProfessionalCost,
  type CostType,
} from '@/services/professionalCostsService';

export type CostFormPayload = {
  amount: number;
  category: string;
  description?: string | null;
  cost_date: string;
  cost_type: CostType;
  is_recurring: boolean;
  recurrence?: string | null;
};

interface CostFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CostFormPayload) => Promise<void>;
  initial?: ProfessionalCost;
}

/** Data di oggi in YYYY-MM-DD (locale, non UTC) per evitare che il costo finisca nel mese sbagliato. */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function CostFormModal({ open, onClose, onSave, initial }: CostFormModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('affitto');
  const [description, setDescription] = useState('');
  const [costDate, setCostDate] = useState(todayStr());
  const [costType, setCostType] = useState<CostType>('variabile');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<'monthly' | 'yearly'>('monthly');
  const [saving, setSaving] = useState(false);

  const isFisso = costType === 'fisso';
  const isUnaTantum = costType === 'una_tantum';
  const showRecurring = !isUnaTantum;

  const toYYYYMMDD = (d: string) => (d ?? '').trim().slice(0, 10);

  useEffect(() => {
    if (initial) {
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDescription(initial.description ?? '');
      setCostDate(toYYYYMMDD(initial.cost_date) || todayStr());
      setCostType((initial.cost_type as CostType) || 'variabile');
      setIsRecurring(initial.is_recurring);
      setRecurrence((initial.recurrence as 'monthly' | 'yearly') ?? 'monthly');
    } else {
      setAmount('');
      setCategory('affitto');
      setDescription('');
      setCostDate(todayStr());
      setCostType('variabile');
      setIsRecurring(false);
      setRecurrence('monthly');
    }
  }, [initial, open]);

  useEffect(() => {
    if (costType === 'fisso') {
      setIsRecurring(true);
    } else if (costType === 'una_tantum') {
      setIsRecurring(false);
    }
  }, [costType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(num) || num < 0) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        amount: num,
        category,
        description: description.trim() || null,
        cost_date: toYYYYMMDD(costDate) || costDate,
        cost_type: costType,
        is_recurring: isFisso ? true : isRecurring,
        recurrence: isFisso ? recurrence : isUnaTantum ? null : isRecurring ? recurrence : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {initial ? 'Modifica costo' : 'Aggiungi costo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cost-type" className="text-gray-700">
              Tipo costo *
            </Label>
            <Select value={costType} onValueChange={(v) => setCostType(v as CostType)}>
              <SelectTrigger id="cost-type" className="mt-1 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {COST_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cost-amount" className="text-gray-700">
              Importo (€) *
            </Label>
            <Input
              id="cost-amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 border-gray-300"
              required
            />
          </div>
          <div>
            <Label htmlFor="cost-category" className="text-gray-700">
              Categoria *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="cost-category" className="mt-1 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {COST_CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cost-description" className="text-gray-700">
              Descrizione (opzionale)
            </Label>
            <Input
              id="cost-description"
              type="text"
              placeholder="Es. Affitto gennaio"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="cost-date" className="text-gray-700">
              Data *
            </Label>
            <Input
              id="cost-date"
              type="date"
              value={costDate}
              onChange={(e) => setCostDate(e.target.value)}
              className="mt-1 border-gray-300"
              required
            />
          </div>
          {showRecurring && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cost-recurring"
                  checked={isFisso ? true : isRecurring}
                  disabled={isFisso}
                  onChange={(e) => !isFisso && setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300 text-[#EEBA2B] focus:ring-[#EEBA2B]"
                />
                <Label htmlFor="cost-recurring" className="text-gray-700 cursor-pointer">
                  Costo ricorrente {isFisso && '(obbligatorio per tipo Fisso)'}
                </Label>
              </div>
              {(isFisso || isRecurring) && (
            <div>
              <Label className="text-gray-700">Ricorrenza</Label>
              <Select
                value={recurrence}
                onValueChange={(v) => setRecurrence(v as 'monthly' | 'yearly')}
              >
                <SelectTrigger className="mt-1 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensile</SelectItem>
                  <SelectItem value="yearly">Annuale</SelectItem>
                </SelectContent>
              </Select>
            </div>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="!w-[120px] !min-w-[120px] !h-10 !min-h-10 !py-2 !px-4"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={saving || !amount.trim()}
              className="!w-[120px] !min-w-[120px] !h-10 !min-h-10 !py-2 !px-4 bg-[#EEBA2B] hover:bg-[#d4a61f] text-black font-semibold"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : initial ? (
                'Salva'
              ) : (
                'Aggiungi'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
