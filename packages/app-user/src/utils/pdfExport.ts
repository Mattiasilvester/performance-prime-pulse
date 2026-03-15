import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StructuredNutritionPlan } from '@/types/nutritionPlan';
import type { StructuredWorkoutPlan } from '@/services/workoutPlanGenerator';

// Rimuove markdown dal testo prima di scriverlo nel PDF
function stripMarkdown(text: string): string {
  return text
    .trim()
    .replace(/^\s*&\s*/g, '')        // spazi + & singolo iniziale (robusto)
    .replace(/&\s*&\w*\s*/g, '')     // & &p & &b ecc.
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/\*(.*?)\*/g, '$1')     // *italic*
    .replace(/__(.*?)__/g, '$1')     // __bold__
    .replace(/_(.*?)_/g, '$1')       // _italic_
    .replace(/`(.*?)`/g, '$1')       // `code`
    .replace(/#{1,6}\s+/g, '')       // # headers
    .replace(/^\s*[-*+]\s+/gm, '')   // - bullet points
    .replace(/\n{3,}/g, '\n\n')      // troppi newline
    .trim();
}

/** Sanitizza safetyNotes per il PDF: rimuove & iniziale (ASCII e fullwidth), BOM, zero-width, poi stripMarkdown. */
function sanitizeSafetyNotesForPDF(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let s = text
    .replace(/\uFEFF/g, '')
    .replace(/\u200B/g, '')
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '')
    .replace(/\u2060/g, '')
    .trim();
  s = s.replace(/^[\s\u00A0]*[&\uFF06]\s*/, ''); // & iniziale (ASCII o fullwidth)
  s = stripMarkdown(s);
  s = s.replace(/^[&\uFF06]\s*/, ''); // eventuale & rimasto dopo stripMarkdown
  return s.trim();
}

const gold: [number, number, number] = [238, 186, 43];
const black: [number, number, number] = [10, 10, 12];
const white: [number, number, number] = [255, 255, 255];
const gray: [number, number, number] = [138, 138, 150];

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

export function downloadNutritionPlanPDF(plan: StructuredNutritionPlan): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' }) as DocWithAutoTable;
  let y = 0;

  doc.setFillColor(...black);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(...gold);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE PRIME', 15, 15);
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Piano Alimentare Personalizzato — PrimeBot', 15, 23);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  const oggi = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Generato il ${oggi}`, 15, 30);

  y = 45;

  doc.setTextColor(...black);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(stripMarkdown(plan.nome), 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`Obiettivo: ${stripMarkdown(plan.obiettivo)}`, 15, y);
  y += 6;
  doc.text(`Calorie giornaliere: ~${plan.calorie_giornaliere} kcal`, 15, y);
  y += 6;

  if (plan.allergie_considerate.length > 0) {
    doc.setTextColor(200, 80, 80);
    doc.text(
      `ATTENZIONE: Allergie/Intolleranze escluse: ${plan.allergie_considerate.join(', ')}`,
      15,
      y
    );
    y += 6;
  }

  if (plan.macronutrienti) {
    doc.setTextColor(...gray);
    doc.text(
      `Macronutrienti: ${plan.macronutrienti.proteine_percentuale}% proteine · ` +
        `${plan.macronutrienti.carboidrati_percentuale}% carboidrati · ` +
        `${plan.macronutrienti.grassi_percentuale}% grassi`,
      15,
      y
    );
    y += 8;
  }

  for (const giorno of plan.giorni) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(...gold);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setTextColor(...black);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(stripMarkdown(giorno.giorno).toUpperCase(), 18, y);
    if (giorno.calorie_totali) {
      doc.setFontSize(9);
      doc.text(`${giorno.calorie_totali} kcal totali`, 160, y);
    }
    y += 10;

    for (const pasto of giorno.pasti) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      const pastoLabel = pasto.orario
        ? `${stripMarkdown(pasto.nome)} (${pasto.orario})`
        : stripMarkdown(pasto.nome);
      doc.text(pastoLabel, 18, y);
      if (pasto.calorie_totali) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text(`${pasto.calorie_totali} kcal`, 192, y, { align: 'right' });
      }
      y += 6;

      const rows = pasto.alimenti.map((a) => [
        stripMarkdown(a.nome),
        a.quantita,
        a.calorie ? `${a.calorie} kcal` : '',
        stripMarkdown(a.note ?? ''),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Alimento', 'Quantità', 'Kcal', 'Note']],
        body: rows,
        margin: { left: 20, right: 15 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: black,
          textColor: white,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' },
        },
      });

      y = ((doc as any).lastAutoTable?.finalY ?? y) + 10;
      if (y > 255) { doc.addPage(); y = 20; }
    }
    y += 4;
  }

  if (plan.consigli_generali && plan.consigli_generali.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(...black);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSIGLI GENERALI', 18, y);
    y += 10;
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const consiglio of plan.consigli_generali) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const lines = doc.splitTextToSize(`- ${stripMarkdown(consiglio)}`, 175);
      doc.text(lines, 18, y);
      y += lines.length * 5 + 2;
    }
    y += 4;
  }

  if (plan.note_finali) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 3, 180, 4, 'F');
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(`ATTENZIONE: ${stripMarkdown(plan.note_finali)}`, 175);
    doc.text(noteLines, 18, y);
    y += noteLines.length * 4 + 6;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...black);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.text('Performance Prime — performanceprime.it', 15, 293);
    doc.setTextColor(...gray);
    doc.text(`Pagina ${i} di ${pageCount}`, 185, 293, { align: 'right' });
  }

  doc.save(`piano-alimentare-${Date.now()}.pdf`);
}

export function downloadWorkoutPlanPDF(plan: StructuredWorkoutPlan): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' }) as DocWithAutoTable;
  let y = 0;

  doc.setFillColor(...black);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(...gold);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE PRIME', 15, 15);
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Piano di Allenamento Personalizzato — PrimeBot', 15, 23);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  const oggi = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Generato il ${oggi}`, 15, 30);

  y = 45;

  doc.setTextColor(...black);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(stripMarkdown(plan.name), 15, y);
  y += 8;

  if (plan.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const descLines = doc.splitTextToSize(stripMarkdown(plan.description), 175);
    doc.text(descLines, 15, y);
    y += descLines.length * 5 + 4;
  }

  doc.setFontSize(9);
  doc.setTextColor(...gray);
  if (plan.workout_type) {
    doc.text(`Tipo: ${plan.workout_type}`, 15, y);
    y += 5;
  }
  if (plan.difficulty) {
    doc.text(`Difficoltà: ${plan.difficulty}`, 15, y);
    y += 5;
  }
  if (plan.duration_minutes) {
    doc.text(`Durata: ${plan.duration_minutes} min`, 15, y);
    y += 8;
  }

  if (plan.safetyNotes) {
    doc.setFillColor(255, 243, 205);
    doc.setTextColor(120, 80, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const safetyText = sanitizeSafetyNotesForPDF(plan.safetyNotes);
    // 150mm: font italic sottostima larghezza ~10%, ridurre per evitare troncature a destra
    const safetyLines = doc.splitTextToSize(safetyText ? `ATTENZIONE: ${safetyText}` : 'ATTENZIONE:', 150);
    doc.text(safetyLines, 15, y);
    y += safetyLines.length * 4 + 8;
  }

  if (plan.exercises && plan.exercises.length > 0) {
    doc.setFillColor(...black);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ESERCIZI', 18, y);
    y += 10;

    const rows = plan.exercises.map((ex, i) => [
      `${i + 1}. ${stripMarkdown(ex.name ?? '')}`,
      ex.sets != null ? String(ex.sets) : '',
      ex.reps != null ? String(ex.reps) : '',
      ex.rest_seconds != null ? `${ex.rest_seconds}s` : '',
      stripMarkdown(ex.notes ?? ''),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Esercizio', 'Serie', 'Rip.', 'Riposo', 'Note']],
      body: rows,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: black,
        textColor: gold,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' },
      },
    });

    y = (doc as any).lastAutoTable?.finalY ?? y + 10;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...black);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.text('Performance Prime — performanceprime.it', 15, 293);
    doc.setTextColor(...gray);
    doc.text(`Pagina ${i} di ${pageCount}`, 185, 293, { align: 'right' });
  }

  doc.save(`piano-allenamento-${Date.now()}.pdf`);
}
