/**
 * Report per Commercialista — PDF + 3 CSV.
 * Dati: bookings (completed), professional_costs, professionals.
 * Nessuna modifica a analyticsService / exportAnalyticsReportToPDF.
 */
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { isPlaceholderValue } from '@/utils/placeholders';

export type TimeRange = 3 | 6 | 12;

/** Professionista (sottoinsieme per report). */
export interface AccountantProfessional {
  id: string;
  company_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  vat_number: string | null;
  vat_address: string | null;
  vat_city: string | null;
  vat_postal_code: string | null;
  pec_email: string | null;
  sdi_code: string | null;
}

/** Riga prestazione (completed, nel periodo). */
export interface AccountantBookingRow {
  id: string;
  booking_date: string;
  booking_time: string | null;
  service_type: string | null;
  price: number | null;
}

/** Riga costo (nel periodo). */
export interface AccountantCostRow {
  id: string;
  cost_date: string;
  category: string;
  description: string | null;
  amount: number;
  is_recurring: boolean;
  recurrence: string | null;
}

/** Riepilogo periodo per report. */
export interface AccountantSummary {
  seduteCompletate: number;
  valoreLordoDichiarato: number;
  totaleCosti: number;
  margineOperativo: number;
  righeConPrezzoMancante: number;
}

export interface AccountantReportData {
  professional: AccountantProfessional | null;
  bookings: AccountantBookingRow[];
  costs: AccountantCostRow[];
  summary: AccountantSummary;
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
}

const GOLD: [number, number, number] = [238, 186, 43];
const BLACK: [number, number, number] = [0, 0, 0];

const formatEuro = (n: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatDateIt = (d: Date): string =>
  format(d, 'dd/MM/yyyy', { locale: it });

const getDateStamp = (): string =>
  format(new Date(), 'yyyy-MM-dd');

/**
 * Periodo = mesi completi chiusi: to = ultimo giorno del mese precedente, from = primo giorno del mese (to - timeRange + 1).
 * Esempio: oggi 01/02/2026, timeRange 6 => from 01/08/2025, to 31/01/2026.
 */
function getPeriodFromTimeRange(timeRange: TimeRange): { dateFrom: string; dateTo: string; periodLabel: string } {
  const now = new Date();
  const toDate = endOfMonth(subMonths(now, 1));
  const fromDate = startOfMonth(subMonths(toDate, timeRange - 1));
  const dateFrom = format(fromDate, 'yyyy-MM-dd');
  const dateTo = format(toDate, 'yyyy-MM-dd');
  return {
    dateFrom,
    dateTo,
    periodLabel: `${timeRange} mesi chiusi (${format(fromDate, 'dd/MM/yyyy', { locale: it })} - ${format(toDate, 'dd/MM/yyyy', { locale: it })})`,
  };
}

/** Maschera ID prenotazione (ultimi 8 caratteri) per privacy. */
export function maskBookingId(id: string): string {
  if (!id || id.length < 8) return id;
  return id.slice(-8).toUpperCase();
}

/** CAP considerato valido per report: 5 cifre e non "00000". */
function isPostalCodeCompleteForReport(value: string | null | undefined): boolean {
  if (value == null) return false;
  const v = value.trim();
  if (v.length !== 5 || !/^\d{5}$/.test(v)) return false;
  if (v === '00000') return false;
  return true;
}

/**
 * Verifica completezza dati professionista per report (P.IVA, nome, indirizzo VAT).
 * Usa isPlaceholderValue per escludere placeholder; CAP deve essere 5 cifre e non 00000.
 * PEC/SDI opzionali.
 */
export function isProfessionalDataCompleteForReport(pro: AccountantProfessional | null): boolean {
  if (!pro) return false;
  const vatOk = pro.vat_number != null && pro.vat_number.trim() !== '' && !isPlaceholderValue(pro.vat_number);
  const nameFromCompany = pro.company_name != null && pro.company_name.trim() !== '' && !isPlaceholderValue(pro.company_name);
  const nameFromPerson = pro.first_name != null && pro.last_name != null &&
    `${String(pro.first_name).trim()} ${String(pro.last_name).trim()}`.trim() !== '' &&
    !isPlaceholderValue(`${pro.first_name} ${pro.last_name}`);
  const nameOk = nameFromCompany || nameFromPerson;
  const addrOk =
    pro.vat_address != null && pro.vat_address.trim() !== '' && !isPlaceholderValue(pro.vat_address) &&
    pro.vat_city != null && pro.vat_city.trim() !== '' && !isPlaceholderValue(pro.vat_city) &&
    isPostalCodeCompleteForReport(pro.vat_postal_code);
  return Boolean(vatOk && nameOk && addrOk);
}

/**
 * Carica tutti i dati necessari per il Report Commercialista (professionista, bookings completed, costi).
 */
export async function getAccountantReportData(
  professionalId: string,
  timeRange: TimeRange
): Promise<AccountantReportData> {
  const { dateFrom, dateTo, periodLabel } = getPeriodFromTimeRange(timeRange);

  const [profRes, bookRes, costRes] = await Promise.all([
    supabase
      .from('professionals')
      .select('id, company_name, first_name, last_name, email, phone, vat_number, vat_address, vat_city, vat_postal_code, pec_email, sdi_code')
      .eq('id', professionalId)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('id, booking_date, booking_time, service_type, price')
      .eq('professional_id', professionalId)
      .eq('status', 'completed')
      .gte('booking_date', dateFrom)
      .lte('booking_date', dateTo)
      .order('booking_date', { ascending: true }),
    supabase
      .from('professional_costs')
      .select('id, cost_date, category, description, amount, is_recurring, recurrence')
      .eq('professional_id', professionalId)
      .gte('cost_date', dateFrom)
      .lte('cost_date', dateTo)
      .order('cost_date', { ascending: true }),
  ]);

  const professional = profRes.data as AccountantProfessional | null;
  const bookings = (bookRes.data ?? []) as AccountantBookingRow[];
  const costs = (costRes.data ?? []) as AccountantCostRow[];

  let valoreLordoDichiarato = 0;
  let righeConPrezzoMancante = 0;
  for (const b of bookings) {
    if (b.price != null && !Number.isNaN(Number(b.price))) {
      valoreLordoDichiarato += Number(b.price);
    } else {
      righeConPrezzoMancante += 1;
    }
  }
  const totaleCosti = costs.reduce((s, c) => s + Number(c.amount), 0);
  const margineOperativo = valoreLordoDichiarato - totaleCosti;

  const summary: AccountantSummary = {
    seduteCompletate: bookings.length,
    valoreLordoDichiarato,
    totaleCosti,
    margineOperativo,
    righeConPrezzoMancante,
  };

  return {
    professional,
    bookings,
    costs,
    summary,
    dateFrom,
    dateTo,
    periodLabel,
  };
}

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

const getFinalY = (doc: DocWithAutoTable, defaultY: number): number =>
  doc.lastAutoTable?.finalY ?? defaultY;

/**
 * Esporta il Report per Commercialista in PDF (client-side).
 * NO client_name, NO notes. Prezzo null = "— (mancante)" ed escluso dal totale.
 */
export function exportAccountantReportToPDF(data: AccountantReportData): void {
  const doc = new jsPDF() as DocWithAutoTable;
  const margin = 14;
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text('PrimePro', margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text('Report per Commercialista', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il: ${formatDateIt(new Date())}`, margin, y);
  y += 5;
  doc.text(`Periodo: ${data.periodLabel}`, margin, y);
  y += 8;

  const pro = data.professional;
  if (pro) {
    const name = pro.company_name?.trim() || `${pro.first_name || ''} ${pro.last_name || ''}`.trim() || '—';
    doc.text(`Professionista: ${name}`, margin, y);
    y += 5;
    doc.text(`Email: ${pro.email || '—'}  |  Tel: ${pro.phone || '—'}`, margin, y);
    y += 5;
    doc.text(`P.IVA: ${pro.vat_number || '—'}`, margin, y);
    y += 5;
    doc.text(`Indirizzo: ${pro.vat_address || '—'}, ${pro.vat_postal_code || ''} ${pro.vat_city || '—'}`, margin, y);
    y += 5;
    if (pro.pec_email || pro.sdi_code) {
      doc.text(`PEC: ${pro.pec_email || '—'}  |  SDI: ${pro.sdi_code || '—'}`, margin, y);
      y += 5;
    }
    y += 4;
  }

  // Disclaimer
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, y, doc.internal.pageSize.width - 2 * margin, 16, 'F');
  doc.setFontSize(9);
  doc.setTextColor(120, 80, 0);
  doc.text('La piattaforma Performance Prime non gestisce pagamenti/incassi. I valori economici sono', margin + 2, y + 6);
  doc.text('inseriti dal professionista a fini organizzativi e di analisi.', margin + 2, y + 11);
  y += 22;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('I costi riportati includono esclusivamente le spese inserite dal professionista nella sezione "Costi & Spese".', margin, y);
  y += 5;
  doc.text('I costi gestionali mostrati nella dashboard hanno solo finalità di analisi interna e non hanno valore contabile.', margin, y);
  y += 8;

  // Riepilogo periodo
  const s = data.summary;
  autoTable(doc, {
    startY: y,
    head: [['Riepilogo periodo', 'Valore']],
    body: [
      ['Sedute completate', String(s.seduteCompletate)],
      ['Valore lordo dichiarato', formatEuro(s.valoreLordoDichiarato)],
      ['Totale costi dichiarati', formatEuro(s.totaleCosti)],
      ['Margine operativo (ante imposte)', formatEuro(s.margineOperativo)],
    ],
    theme: 'striped',
    headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'right' } },
  });
  y = getFinalY(doc, y) + 6;
  if (s.righeConPrezzoMancante > 0) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Nota: Righe con prezzo mancante escluse dal totale.', margin, y);
    y += 6;
  }
  y += 4;

  // Tabella prestazioni
  doc.setFontSize(11);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text('Prestazioni (bookings completati)', margin, y);
  y += 6;
  const bookingBody = data.bookings.map((b) => [
    formatDateIt(new Date(b.booking_date)),
    b.booking_time ?? '—',
    b.service_type ?? '—',
    b.price != null && !Number.isNaN(Number(b.price)) ? formatEuro(Number(b.price)) : '— (mancante)',
    maskBookingId(b.id),
  ]);
  if (bookingBody.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Data', 'Ora', 'Tipo servizio', 'Prezzo', 'ID']],
      body: bookingBody,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 28 },
      },
    });
    y = getFinalY(doc, y) + 8;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Nessuna prestazione nel periodo.', margin, y);
    y += 8;
  }

  // Tabella costi
  doc.setFontSize(11);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text('Costi e spese', margin, y);
  y += 6;
  const costBody = data.costs.map((c) => [
    formatDateIt(new Date(c.cost_date)),
    c.category,
    c.description ?? '—',
    formatEuro(Number(c.amount)),
    c.is_recurring ? 'Sì' : 'No',
    c.recurrence ?? '—',
  ]);
  if (costBody.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Data', 'Categoria', 'Descrizione', 'Importo', 'Ricorrente', 'Ricorrenza']],
      body: costBody,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: BLACK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
      },
    });
    y = getFinalY(doc, y) + 6;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Nessun costo nel periodo.', margin, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Performance Prime - www.performanceprime.it', margin, doc.internal.pageSize.height - 10);

  doc.save(`report_commercialista_${getDateStamp()}.pdf`);
}

export interface RunAccountantReportExportOptions {
  /** Se false, scarica solo PDF. Default true = PDF + CSV (con logica: nessun CSV vuoto). */
  includeCSV?: boolean;
}

/**
 * Esegue export Report Commercialista: sempre PDF; CSV condizionali (prestazioni solo se >0, costi solo se >0, riepilogo sempre).
 * Nessun download duplicato: ogni CSV viene chiamato al massimo una volta.
 */
export function runAccountantReportExport(data: AccountantReportData, options?: RunAccountantReportExportOptions): void {
  const includeCSV = options?.includeCSV !== false;
  exportAccountantReportToPDF(data);
  if (includeCSV) {
    if (data.bookings.length > 0) exportBookingsToCSV(data.bookings, data.periodLabel);
    if (data.costs.length > 0) exportCostsToCSV(data.costs, data.periodLabel);
    exportSummaryToCSV(data.summary, data.dateFrom, data.dateTo);
  }
}

/**
 * Scarica CSV prestazioni (booking_date, booking_time, service_type, price, booking_id).
 */
export function exportBookingsToCSV(bookings: AccountantBookingRow[], periodLabel: string): void {
  const headers = ['booking_date', 'booking_time', 'service_type', 'price', 'booking_id'];
  const rows = bookings.map((b) => [
    b.booking_date,
    b.booking_time ?? '',
    b.service_type ?? '',
    b.price != null ? String(b.price) : '',
    maskBookingId(b.id),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings_completed_${periodLabel.replace(/\s/g, '_').toLowerCase()}_${getDateStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Scarica CSV costi (cost_date, category, description, amount, is_recurring, recurrence).
 */
export function exportCostsToCSV(costs: AccountantCostRow[], periodLabel: string): void {
  const headers = ['cost_date', 'category', 'description', 'amount', 'is_recurring', 'recurrence'];
  const rows = costs.map((c) => [
    c.cost_date,
    c.category,
    c.description ?? '',
    String(c.amount),
    c.is_recurring ? 'Sì' : 'No',
    c.recurrence ?? '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `costs_${periodLabel.replace(/\s/g, '_').toLowerCase()}_${getDateStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Scarica CSV riepilogo (periodo_from, periodo_to, sedute_completate, valore_lordo_dichiarato, totale_costi, margine_operativo).
 */
export function exportSummaryToCSV(summary: AccountantSummary, dateFrom: string, dateTo: string): void {
  const headers = ['periodo_from', 'periodo_to', 'sedute_completate', 'valore_lordo_dichiarato', 'totale_costi', 'margine_operativo'];
  const row = [
    dateFrom,
    dateTo,
    String(summary.seduteCompletate),
    String(summary.valoreLordoDichiarato),
    String(summary.totaleCosti),
    String(summary.margineOperativo),
  ];
  const csv = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `summary_${dateFrom}_${dateTo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
