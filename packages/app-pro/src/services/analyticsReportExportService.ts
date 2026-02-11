/**
 * Step 10: Export report Andamento & Analytics in PDF (e opzionale CSV).
 * I dati arrivano dalla pagina Andamento tramite useProfessionalAnalytics (AnalyticsData).
 * Colori coerenti con app PrimePro: nero + #EEBA2B (RGB 238, 186, 43).
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { AnalyticsData, TimeRange } from '@/hooks/useProfessionalAnalytics';

const GOLD: [number, number, number] = [238, 186, 43]; // #EEBA2B
const BLACK: [number, number, number] = [0, 0, 0];

const formatEuro = (n: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatDateIt = (d: Date): string =>
  format(d, 'dd/MM/yyyy', { locale: it });

const getDateStamp = (): string =>
  format(new Date(), 'yyyy-MM-dd');

const periodLabel = (tr: TimeRange): string => {
  if (tr === 3) return 'Ultimi 3 mesi';
  if (tr === 6) return 'Ultimi 6 mesi';
  return 'Ultimi 12 mesi';
};

/** Tipo esteso per doc con lastAutoTable (jspdf-autotable). */
type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

const getFinalY = (doc: DocWithAutoTable, defaultY: number): number =>
  doc.lastAutoTable?.finalY ?? defaultY;

/** Dati vuoti per generare PDF senza crash quando non ci sono dati. */
function getEmptyAnalyticsData(): AnalyticsData {
  return {
    profitSummary: {
      revenue: 0,
      costs: 0,
      margin: 0,
      revenueChangePercent: 0,
      costsChangePercent: 0,
      marginChangePercent: 0,
      bookingsCount: 0,
    },
    revenueTrend: [],
    costsTrend: [],
    marginTrend: [],
    monthComparison: {
      current: { revenue: 0, costs: 0, margin: 0 },
      previous: { revenue: 0, costs: 0, margin: 0 },
    },
    costsDistribution: [],
    alerts: [],
  };
}

/**
 * Esporta il report Andamento & Analytics in PDF.
 * Con dati vuoti o null: genera comunque il PDF con valori a 0 e messaggio "Nessun dato disponibile per il periodo selezionato".
 */
export function exportAnalyticsReportToPDF(
  data: AnalyticsData | null | undefined,
  timeRange: TimeRange,
  options?: { professionalName?: string }
): void {
  console.log('[Export] exportAnalyticsReportToPDF chiamata con:', data ? 'data presente' : 'data null/undefined');
  const safeData: AnalyticsData = data ?? getEmptyAnalyticsData();
  const showNoDataMessage = !data || (
    safeData.profitSummary.bookingsCount === 0 &&
    safeData.profitSummary.revenue === 0 &&
    safeData.profitSummary.costs === 0 &&
    (safeData.revenueTrend?.length ?? 0) === 0 &&
    (safeData.costsTrend?.length ?? 0) === 0 &&
    (safeData.costsDistribution?.length ?? 0) === 0
  );

  const doc = new jsPDF() as DocWithAutoTable;
  const margin = 14;
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text('PrimePro', margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Report Andamento & Analytics', margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text(`Generato il: ${formatDateIt(new Date())}`, margin, y);
  y += 5;
  doc.text(`Periodo: ${periodLabel(timeRange)}`, margin, y);
  y += 5;
  if (showNoDataMessage) {
    doc.setTextColor(120, 80, 0);
    doc.text('Nessun dato disponibile per il periodo selezionato.', margin, y);
    y += 8;
  }
  y += 4;

  if (options?.professionalName) {
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    doc.text(`Professionista: ${options.professionalName}`, margin, y);
    y += 6;
  }

  y += 4;

  // 1. Riepilogo (valori a 0 se dati assenti)
  const ps = safeData.profitSummary ?? getEmptyAnalyticsData().profitSummary;
  (doc as any).autoTable({
    startY: y,
    head: [['Riepilogo', 'Valore']],
    body: [
      ['Incasso lordo', formatEuro(ps.revenue)],
      ['Totale spese', formatEuro(ps.costs)],
      ['Margine netto', formatEuro(ps.margin)],
      ['Sedute completate', String(ps.bookingsCount)],
    ],
    theme: 'striped',
    headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50, halign: 'right' } },
  });
  y = getFinalY(doc, y) + 10;

  // 2. Confronto mese corrente vs precedente
  const mc = safeData.monthComparison ?? getEmptyAnalyticsData().monthComparison;
  (doc as any).autoTable({
    startY: y,
    head: [['', 'Mese corrente', 'Mese precedente']],
    body: [
      ['Ricavi', formatEuro(mc.current.revenue), formatEuro(mc.previous.revenue)],
      ['Costi', formatEuro(mc.current.costs), formatEuro(mc.previous.costs)],
      ['Margine', formatEuro(mc.current.margin), formatEuro(mc.previous.margin)],
    ],
    theme: 'striped',
    headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 55, halign: 'right' },
      2: { cellWidth: 55, halign: 'right' },
    },
  });
  y = getFinalY(doc, y) + 10;

  // 3. Trend mensile (ricavi, costi, margine per mese)
  const rev = safeData.revenueTrend ?? [];
  const cos = safeData.costsTrend ?? [];
  const mar = safeData.marginTrend ?? [];
  const hasTrend = rev.length > 0 || cos.length > 0 || mar.length > 0;
  const n = Math.max(rev.length, cos.length, mar.length);

  if (hasTrend && n > 0) {
    const trendBody: string[][] = [];
    for (let i = 0; i < n; i++) {
      const month = rev[i]?.month ?? cos[i]?.month ?? mar[i]?.month ?? '—';
      const r = rev[i]?.revenue ?? 0;
      const c = cos[i]?.costs ?? 0;
      const m = mar[i]?.margin ?? 0;
      trendBody.push([month, formatEuro(r), formatEuro(c), formatEuro(m)]);
    }
    (doc as any).autoTable({
      startY: y,
      head: [['Mese', 'Ricavi', 'Costi', 'Margine']],
      body: trendBody,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });
    y = getFinalY(doc, y) + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Trend mensile: Nessun dato disponibile', margin, y);
    y += 8;
  }

  // 4. Distribuzione costi
  const dist = safeData.costsDistribution ?? [];
  if (dist.length > 0) {
    const distBody = dist.map((row) => [row.name, formatEuro(row.value)]);
    (doc as any).autoTable({
      startY: y,
      head: [['Categoria', 'Importo']],
      body: distBody,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'right' } },
    });
    y = getFinalY(doc, y) + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Distribuzione costi: Nessun dato disponibile', margin, y);
    y += 8;
  }

  // 5. Alert (opzionale)
  const alerts = safeData.alerts ?? [];
  if (alerts.length > 0) {
    const alertBody = alerts.map((a) => [a.type, a.icon, a.message]);
    (doc as any).autoTable({
      startY: y,
      head: [['Tipo', '', 'Messaggio']],
      body: alertBody,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 12 }, 2: { cellWidth: 130 } },
    });
    y = getFinalY(doc, y) + 6;
  }

  // Footer (stesso stile invoiceExportService)
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Performance Prime Pulse - www.performanceprime.it',
    margin,
    doc.internal.pageSize.height - 10
  );

  doc.save(`report_andamento_${getDateStamp()}.pdf`);
  console.log('[Export] PDF Report Analytics generato con successo');
}
