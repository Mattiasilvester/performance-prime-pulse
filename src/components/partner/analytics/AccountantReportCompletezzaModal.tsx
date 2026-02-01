/**
 * Modal "completezza dati" prima dell'export Report Commercialista.
 * Se mancano P.IVA / indirizzo: "Esporta comunque" | "Completa dati" (redirect profilo).
 * Route "Completa dati": /partner/dashboard/profilo (ProfiloPage).
 * Nota: ProfiloPage attualmente non gestisce l'edit di vat_number, vat_address, vat_city, vat_postal_code — task separato se serve.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AccountantReportCompletezzaModalProps {
  open: boolean;
  onClose: () => void;
  onExportAnyway: () => void;
  onCompleteData: () => void;
}

export function AccountantReportCompletezzaModal({
  open,
  onClose,
  onExportAnyway,
  onCompleteData,
}: AccountantReportCompletezzaModalProps) {
  const handleCompleteData = () => {
    onClose();
    onCompleteData();
  };

  const handleExportAnyway = () => {
    onClose();
    onExportAnyway();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Dati incompleti per il report</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Nel report mancano alcuni dati (P.IVA / indirizzo). Vuoi esportare lo stesso o completare ora?
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportAnyway}
            className="border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            Esporta comunque
          </Button>
          <Button
            type="button"
            onClick={handleCompleteData}
            className="bg-[#EEBA2B] text-black hover:bg-[#D4A826]"
          >
            Completa dati
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
