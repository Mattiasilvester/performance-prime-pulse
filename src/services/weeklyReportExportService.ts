/**
 * Export Report Settimanale in PDF (client-side).
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { WeeklyReportData } from './weeklyReportService';

const GOLD: [number, number, number] = [238, 186, 43];
const BLACK: [number, number, number] = [0, 0, 0];

const formatEuro = (n: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatDateIt = (d: Date): string =>
  format(d, 'dd/MM/yyyy', { locale: it });

export function exportWeeklyReportToPDF(data: WeeklyReportData): void {
  const doc = new jsPDF();
  const margin = 14;
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text('PrimePro', margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text('Report Settimanale', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il: ${formatDateIt(new Date())}`, margin, y);
  y += 5;
  doc.text(`Settimana: ${data.periodLabel}`, margin, y);
  y += 12;

  const k = data.kpi;
  doc.setFontSize(11);
  doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  doc.text('Riepilogo settimana', margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Appuntamenti completati: ${k.appuntamentiCompletati}`, margin, y);
  y += 5;
  doc.text(`Incasso lordo: ${formatEuro(k.incassoLordo)}`, margin, y);
  y += 5;
  doc.text(`Clienti con almeno una seduta: ${k.nuoviClienti}`, margin, y);
  y += 5;
  doc.text(`Tasso completamento: ${k.tassoCompletamento}%`, margin, y);
  y += 10;

  if (data.previousKpi) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Confronto con settimana precedente', margin, y);
    y += 5;
    const prev = data.previousKpi;
    const diffApp = k.appuntamentiCompletati - prev.appuntamentiCompletati;
    const diffInc = k.incassoLordo - prev.incassoLordo;
    doc.text(`Appuntamenti: ${diffApp >= 0 ? '+' : ''}${diffApp}`, margin, y);
    y += 5;
    doc.text(`Incasso: ${diffInc >= 0 ? '+' : ''}${formatEuro(diffInc)}`, margin, y);
    y += 10;
  }

  if (data.dayBars.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    doc.text('Appuntamenti per giorno', margin, y);
    y += 5;
    for (const bar of data.dayBars) {
      doc.text(`${bar.shortName}: ${bar.value}`, margin, y);
      y += 5;
    }
    y += 5;
  }

  if (data.topServices.length > 0) {
    doc.setFontSize(10);
    doc.text('Top 3 servizi (per numero di sedute)', margin, y);
    y += 5;
    data.topServices.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.serviceType}: ${s.count} (${formatEuro(s.revenue)})`, margin, y);
      y += 5;
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Performance Prime - www.performanceprime.it', margin, doc.internal.pageSize.height - 10);

  const stamp = format(new Date(), 'yyyy-MM-dd');
  doc.save(`report_settimanale_${data.dateFrom}_${data.dateTo}_${stamp}.pdf`);
}
