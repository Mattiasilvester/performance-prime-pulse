import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { StructuredNutritionPlan } from '@/types/nutritionPlan';
import { downloadNutritionPlanPDF } from '@/utils/pdfExport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NutritionPlanCardProps {
  plan: StructuredNutritionPlan;
  planId?: string;
  userId: string;
  onDelete?: () => void;
}

export function NutritionPlanCard({
  plan,
  planId,
  userId,
  onDelete,
}: NutritionPlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const defaultOpen = plan.giorni?.length ? `day-0` : undefined;

  const handleDownloadPDF = () => {
    downloadNutritionPlanPDF(plan);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (planId && userId) {
        const { error } = await supabase
          .from('nutrition_plans')
          .delete()
          .eq('id', planId)
          .eq('user_id', userId);
        if (error) {
          console.error('NutritionPlanCard delete error:', error);
          toast.error('Impossibile eliminare il piano. Riprova.');
          return;
        }
      }
      onDelete?.();
    } catch (err) {
      console.error('NutritionPlanCard delete error:', err);
      toast.error('Impossibile eliminare il piano. Riprova.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="mt-4 rounded-xl border-2 border-[#EEBA2B] bg-gradient-to-br from-gray-800 to-gray-900 p-4 font-['Outfit',sans-serif]"
      style={{ backgroundColor: '#0A0A0C', color: '#fff' }}
    >
      <div className="mb-3 flex items-center gap-2 text-xl font-bold text-[#EEBA2B]">
        <span>🥗</span>
        <span>{plan.nome}</span>
      </div>
      <p className="text-sm text-gray-400">
        Obiettivo: {plan.obiettivo}
      </p>
      <p className="text-sm text-gray-400">
        ~{plan.calorie_giornaliere} kcal/giorno
      </p>
      {plan.allergie_considerate?.length > 0 && (
        <p className="mt-1 text-xs text-amber-400">
          Allergie considerate: {plan.allergie_considerate.join(', ')}
        </p>
      )}

      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen}
        className="mt-4 w-full border-t border-gray-600 pt-4"
      >
        {plan.giorni?.map((giorno, dayIdx) => (
          <AccordionItem key={dayIdx} value={`day-${dayIdx}`} className="border-gray-600">
            <AccordionTrigger className="py-3 text-left font-semibold text-[#EEBA2B] hover:no-underline">
              <span className="flex flex-1 justify-between pr-2">
                {giorno.giorno.toUpperCase()}
                {giorno.calorie_totali != null && (
                  <span className="text-sm font-normal text-gray-400">
                    {giorno.calorie_totali} kcal totali
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-2">
                {giorno.pasti?.map((pasto, pastoIdx) => (
                  <div key={pastoIdx} className="rounded-lg bg-gray-700/50 p-3 text-sm">
                    <div className="mb-2 font-medium text-white">
                      {pasto.nome}
                      {pasto.orario && ` (${pasto.orario})`}
                      {pasto.calorie_totali != null && (
                        <span className="ml-2 text-gray-400">— {pasto.calorie_totali} kcal</span>
                      )}
                    </div>
                    <ul className="list-none space-y-1 text-gray-300">
                      {pasto.alimenti?.map((a, ai) => (
                        <li key={ai} className="flex items-start gap-2">
                          <span className="text-[#EEBA2B]">•</span>
                          <span>
                            {a.nome} {a.quantita}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {plan.consigli_generali && plan.consigli_generali.length > 0 && (
        <div className="mt-4 border-t border-gray-600 pt-4">
          <h4 className="mb-2 font-semibold text-[#EEBA2B]">💡 Consigli generali</h4>
          <ul className="list-none space-y-1 text-sm text-gray-300">
            {plan.consigli_generali.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#EEBA2B]">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.note_finali && (
        <div className="mt-4 border-t border-gray-600 pt-4">
          <h4 className="mb-1 text-xs font-semibold text-amber-400">⚠️ Note finali (disclaimer)</h4>
          <p className="text-xs italic text-amber-200/80">{plan.note_finali}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-600 pt-4">
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 rounded-lg bg-[#EEBA2B] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
        >
          📥 Scarica PDF
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-transparent px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          🗑️ Elimina piano
        </button>
      </div>
    </div>
  );
}
