import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export interface ExportableInvoice {
  id: string;
  invoice_date: string;
  amount_cents: number;
  status: string;
  stripe_invoice_id?: string;
  invoice_pdf_url?: string;
}

/**
 * Formatta la data in italiano
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatta il prezzo in Euro
 */
const formatPrice = (cents: number): string => {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
};

/**
 * Traduce lo stato della fattura
 */
const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: 'Pagata',
    open: 'In attesa',
    draft: 'Bozza',
    void: 'Annullata',
    uncollectible: 'Non riscuotibile',
  };
  return statusMap[status] || status;
};

/**
 * Esporta fatture in formato CSV
 */
export const exportInvoicesToCSV = (invoices: ExportableInvoice[]): void => {
  const data = invoices.map((inv) => ({
    'Data': formatDate(inv.invoice_date),
    'Numero Fattura': inv.stripe_invoice_id || inv.id,
    'Importo': formatPrice(inv.amount_cents),
    'Stato': translateStatus(inv.status),
    'Descrizione': 'Abbonamento Prime Business',
  }));

  const csv = Papa.unparse(data, {
    delimiter: ';', // Excel italiano usa ;
    header: true,
  });

  // Aggiungi BOM per UTF-8 (supporto caratteri speciali in Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  
  downloadFile(blob, `fatture_primepro_${getDateStamp()}.csv`);
};

/**
 * Esporta fatture in formato PDF.
 * Colori coerenti con app Prime Pro: nero + #EEBA2B (RGB 238, 186, 43).
 */
export const exportInvoicesToPDF = (
  invoices: ExportableInvoice[],
  professionalName?: string
): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(238, 186, 43); // #EEBA2B
  doc.text('PrimePro', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Riepilogo Fatture', 14, 28);
  
  if (professionalName) {
    doc.setFontSize(10);
    doc.text(`Professionista: ${professionalName}`, 14, 36);
  }
  
  doc.setFontSize(10);
  doc.text(`Generato il: ${formatDate(new Date().toISOString())}`, 14, professionalName ? 44 : 36);

  // Tabella fatture
  const tableData = invoices.map((inv) => [
    formatDate(inv.invoice_date),
    inv.stripe_invoice_id || inv.id.slice(0, 8),
    formatPrice(inv.amount_cents),
    translateStatus(inv.status),
  ]);

  autoTable(doc, {
    startY: professionalName ? 52 : 44,
    head: [['Data', 'N. Fattura', 'Importo', 'Stato']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [238, 186, 43], // #EEBA2B
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 40 },
    },
  });

  // Totale
  const total = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount_cents, 0);

  const docWithAutoTable = doc as { lastAutoTable?: { finalY?: number } };
  const finalY = docWithAutoTable.lastAutoTable?.finalY ?? 100;
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Totale pagato: ${formatPrice(total)}`, 14, finalY + 10);
  doc.text(`Numero fatture: ${invoices.length}`, 14, finalY + 18);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Performance Prime Pulse - www.performanceprime.it',
    14,
    doc.internal.pageSize.height - 10
  );

  doc.save(`fatture_primepro_${getDateStamp()}.pdf`);
};

/**
 * Download file helper
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Genera timestamp per nome file
 */
const getDateStamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Filtra fatture per periodo
 */
export const filterInvoicesByPeriod = (
  invoices: ExportableInvoice[],
  period: 'all' | '3months' | '6months' | '12months' | 'year'
): ExportableInvoice[] => {
  if (period === 'all') return invoices;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case '6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case '12months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return invoices;
  }

  return invoices.filter((inv) => new Date(inv.invoice_date) >= startDate);
};
