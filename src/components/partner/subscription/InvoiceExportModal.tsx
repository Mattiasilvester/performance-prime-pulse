import { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, FileText, Check, ChevronDown } from 'lucide-react';
import {
  ExportableInvoice,
  exportInvoicesToCSV,
  exportInvoicesToPDF,
  filterInvoicesByPeriod,
} from '@/services/invoiceExportService';
import { toast } from 'sonner';

interface InvoiceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: ExportableInvoice[];
  professionalName?: string;
}

type PeriodFilter = 'all' | '3months' | '6months' | '12months' | 'year';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'Tutte le fatture' },
  { value: '3months', label: 'Ultimi 3 mesi' },
  { value: '6months', label: 'Ultimi 6 mesi' },
  { value: '12months', label: 'Ultimi 12 mesi' },
  { value: 'year', label: 'Anno corrente' },
];

export function InvoiceExportModal({
  isOpen,
  onClose,
  invoices,
  professionalName,
}: InvoiceExportModalProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filtra fatture per periodo
  const filteredInvoices = useMemo(
    () => filterInvoicesByPeriod(invoices, period),
    [invoices, period]
  );

  // Fatture selezionate per export
  const invoicesToExport = useMemo(() => {
    if (selectAll) return filteredInvoices;
    return filteredInvoices.filter((inv) => selectedIds.has(inv.id));
  }, [filteredInvoices, selectAll, selectedIds]);

  // Toggle selezione singola
  const toggleSelection = (id: string) => {
    setSelectAll(false);
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Toggle seleziona tutto
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedIds(new Set());
    } else {
      setSelectAll(true);
      setSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (invoicesToExport.length === 0) {
      toast.error('Seleziona almeno una fattura');
      return;
    }
    setIsExporting(true);
    try {
      exportInvoicesToCSV(invoicesToExport);
      toast.success(`${invoicesToExport.length} fatture esportate in CSV`);
      onClose();
    } catch (error) {
      toast.error('Errore durante l\'export CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (invoicesToExport.length === 0) {
      toast.error('Seleziona almeno una fattura');
      return;
    }
    setIsExporting(true);
    try {
      exportInvoicesToPDF(invoicesToExport, professionalName);
      toast.success(`${invoicesToExport.length} fatture esportate in PDF`);
      onClose();
    } catch (error) {
      toast.error('Errore durante l\'export PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Formatta data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Formatta prezzo
  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEBA2B]/10 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Esporta Fatture</h2>
              <p className="text-sm text-gray-500">{filteredInvoices.length} fatture disponibili</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Filtro Periodo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodo
            </label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                className="w-full pl-3 pr-10 py-2 bg-[#272A31] text-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent appearance-none"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            </div>
          </div>

          {/* Selezione Fatture */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Fatture da esportare
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-[#EEBA2B] hover:text-[#d4a826] font-medium"
              >
                {selectAll ? 'Deseleziona tutto' : 'Seleziona tutto'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const isSelected = selectAll || selectedIds.has(invoice.id);
                  return (
                    <div
                      key={invoice.id}
                      onClick={() => toggleSelection(invoice.id)}
                      className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-[#EEBA2B]/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#EEBA2B] border-[#EEBA2B]'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(invoice.amount_cents)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(invoice.invoice_date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {invoice.status === 'paid' ? 'Pagata' : invoice.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Nessuna fattura nel periodo selezionato
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo selezione */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              <strong>{invoicesToExport.length}</strong> fatture selezionate
              {invoicesToExport.length > 0 && (
                <span className="ml-2">
                  (Totale:{' '}
                  {formatPrice(
                    invoicesToExport
                      .filter((i) => i.status === 'paid')
                      .reduce((sum, i) => sum + i.amount_cents, 0)
                  )}
                  )
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer - Pulsanti Export */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || invoicesToExport.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Esporta CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || invoicesToExport.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EEBA2B] text-black font-medium rounded-lg hover:bg-[#d4a826] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Esporta PDF
          </button>
        </div>
      </div>
    </div>
  );
}
