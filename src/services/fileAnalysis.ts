import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ===== SCHEMA TYPES =====

export const RepRangeSchema = z.string(); // "8-10" | "max reps" | "30 sec" | "5-10 min"
export type RepRange = z.infer<typeof RepRangeSchema>;

export const ExerciseSchema = z.object({
  name: z.string(),
  series: z.number().nullable().optional(),
  reps: RepRangeSchema.nullable().optional(),      // "8-10", "12", "max reps"
  repeats: RepRangeSchema.nullable().optional(),   // es. "6x400m"
  rest: z.string().nullable().optional(),        // "2 min", "30 sec"
  time: z.string().nullable().optional(),        // per warm-up/stretch: "5 min", "5-10 min"
  notes: z.string().nullable().optional(),       // "per gamba", "assistite"
  confidence: z.number().optional(),             // 0-1 confidence score
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const SectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('warmup'),
    title: z.string(),
    totalTime: z.string().nullable().optional(),
    items: z.array(ExerciseSchema),
  }),
  z.object({
    kind: z.literal('day'),
    day: z.number(),
    title: z.string(),
    items: z.array(ExerciseSchema),
  }),
  z.object({
    kind: z.literal('stretch'),
    title: z.string(),
    totalTime: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    items: z.array(ExerciseSchema),
  }),
]);
export type Section = z.infer<typeof SectionSchema>;

export const WorkoutPlanSchema = z.object({
  sections: z.array(SectionSchema),
  confidence: z.number().optional(),
  warnings: z.array(z.string()).optional(),
});
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

// ===== PARSER SEMPLIFICATO SENZA DIPENDENZE COMPLESSE =====

export class SimplePDFParser {
  constructor() {
    this.debug = true;
  }
  
  /**
   * Metodo principale - usa l'approccio più semplice possibile
   */
  async parseFile(file: File): Promise<WorkoutPlan> {
    console.log('📁 Tentativo parsing file:', file.name);
    
    try {
      // Validazione base
      this.validateFile(file);
      
      // Metodo 1: Prova con FileReader e text extraction
      const text = await this.extractTextMethod1(file);
      
      if (text && text.length > 10) {
        const scheda = this.parseWorkoutText(text);
        return this.convertiInWorkoutPlan(scheda);
      }
      
      // Metodo 2: Usa pdf.js globale se disponibile
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const text2 = await this.extractTextMethod2(file);
        if (text2) {
          const scheda = this.parseWorkoutText(text2);
          return this.convertiInWorkoutPlan(scheda);
        }
      }
      
      throw new Error('Impossibile leggere il PDF. Prova a copiare il testo e incollarlo manualmente.');
      
    } catch (error) {
      console.error('Errore parsing:', error);
      throw error;
    }
  }
  
  /**
   * Validazione del file
   */
  private validateFile(file: File) {
    // Check tipo file
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Il file deve essere un PDF');
    }
    
    // Check dimensione (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Il file è troppo grande (max 20MB)');
    }
    
    // Check se il file è vuoto
    if (file.size === 0) {
      throw new Error('Il file è vuoto');
    }
    
    console.log('✅ File validato correttamente');
  }
  
  /**
   * Metodo 1: FileReader diretto (per PDF con testo embedded)
   */
  private async extractTextMethod1(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const text = e.target?.result as string;
        
        // Cerca pattern di testo nel contenuto binario
        // Questo funziona solo con alcuni PDF
        const textMatch = text.match(/\(([^)]+)\)/g);
        if (textMatch) {
          const extractedText = textMatch.join(' ').replace(/[^\x20-\x7E\n]/g, ' ');
          console.log('Testo estratto (metodo 1):', extractedText.substring(0, 200));
          resolve(extractedText);
        } else {
          resolve(null);
        }
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Metodo 2: Usa pdf.js se caricato globalmente
   */
  private async extractTextMethod2(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Usa pdfjsLib globale
      const pdfjsLib = (window as any).pdfjsLib;
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
      }).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      console.log('Testo estratto (metodo 2):', fullText.substring(0, 200));
      return fullText;
      
    } catch (error) {
      console.error('Metodo 2 fallito:', error);
      return null;
    }
  }
  
  /**
   * Parser del testo - ULTRA SEMPLIFICATO
   */
  private parseWorkoutText(text: string): Array<{nome: string, esercizi: any[]}> {
    console.log('🔍 Parsing testo...');
    
    const scheda: Array<{nome: string, esercizi: any[]}> = [];
    const righe = text.split(/[\n\r]+/);
    
    let giornoCorrente = {
      nome: 'Allenamento',
      esercizi: []
    };
    
    for (const riga of righe) {
      const rigaTrim = riga.trim();
      
      if (!rigaTrim) continue;
      
      // Cerca pattern giorno
      if (rigaTrim.match(/^(Giorno|Day|Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica)/i)) {
        if (giornoCorrente.esercizi.length > 0) {
          scheda.push(giornoCorrente);
        }
        giornoCorrente = {
          nome: rigaTrim,
          esercizi: []
        };
        continue;
      }
      
      // Cerca esercizi - pattern MOLTO semplice
      // Formato: qualsiasi cosa con numeri che sembrano serie x reps
      const match = rigaTrim.match(/(.+?)\s+(\d+)\s*[xX×*]\s*(\d+)/);
      if (match) {
        giornoCorrente.esercizi.push({
          nome: match[1].trim(),
          serie: match[2],
          ripetizioni: match[3]
        });
        console.log(`  Trovato: ${match[1]} ${match[2]}x${match[3]}`);
      } else if (rigaTrim.length > 3 && rigaTrim.length < 100) {
        // Potrebbe essere un esercizio senza dettagli
        if (!rigaTrim.match(/^[\d\s]+$/) && rigaTrim.match(/[a-zA-Z]/)) {
          giornoCorrente.esercizi.push({
            nome: rigaTrim,
            serie: '-',
            ripetizioni: '-'
          });
          console.log(`  Trovato (generico): ${rigaTrim}`);
        }
      }
    }
    
    // Aggiungi ultimo giorno
    if (giornoCorrente.esercizi.length > 0) {
      scheda.push(giornoCorrente);
    }
    
    console.log('✅ Parsing completato:', scheda);
    return scheda;
  }
  
  /**
   * Converti in formato WorkoutPlan
   */
  private convertiInWorkoutPlan(scheda: Array<{nome: string, esercizi: any[]}>): WorkoutPlan {
    const sections: Section[] = [];
    const warnings: string[] = [];
    
    for (const sezione of scheda) {
      if (sezione.nome.toLowerCase().includes('riscaldamento') || sezione.nome.toLowerCase().includes('warm')) {
        sections.push({
          kind: 'warmup',
          title: sezione.nome,
          totalTime: '10 min',
          items: sezione.esercizi.map((ex: any) => ({
            name: ex.nome,
            series: parseInt(ex.serie) || null,
            reps: ex.ripetizioni,
            time: null,
            rest: null,
            notes: null,
            confidence: 0.9
          }))
        });
      } else if (sezione.nome.toLowerCase().includes('stretch') || sezione.nome.toLowerCase().includes('defatic')) {
        sections.push({
          kind: 'stretch',
          title: sezione.nome,
          totalTime: '5-10 min',
          notes: 'Recupero attivo',
          items: sezione.esercizi.map((ex: any) => ({
            name: ex.nome,
            series: parseInt(ex.serie) || null,
            reps: ex.ripetizioni,
            time: null,
            rest: null,
            notes: null,
            confidence: 0.9
          }))
        });
      } else {
        // Sezione allenamento
        const dayMatch = sezione.nome.match(/giorno\s+(\d+)/i);
        const day = dayMatch ? parseInt(dayMatch[1]) : 1;
        
        sections.push({
          kind: 'day',
          day: day,
          title: sezione.nome,
          items: sezione.esercizi.map((ex: any) => ({
            name: ex.nome,
            series: parseInt(ex.serie) || null,
            reps: ex.ripetizioni,
            time: null,
            rest: '90s',
            notes: null,
            confidence: 0.95
          }))
        });
      }
    }
    
    // Calcola confidence globale
    const allExercises = sections.flatMap(s => s.items);
    const avgConfidence = allExercises.length > 0 
      ? allExercises.reduce((sum, ex) => sum + (ex.confidence || 0), 0) / allExercises.length
      : 0;
    
    return {
      sections,
      confidence: avgConfidence,
      warnings
    };
  }
}

// ===== EXPORT MAIN FUNCTION =====

export async function parseWorkoutPdf(file: File): Promise<WorkoutPlan> {
  const parser = new SimplePDFParser();
  return await parser.parseFile(file);
}

// ===== LEGACY SUPPORT =====

export interface ExtractedExercise {
  name: string;
  sets?: string;
  reps?: string;
  repeats?: string;
  time?: string;
  rest?: string;
  notes?: string;
}

export interface WorkoutSection {
  title: string;
  exercises: ExtractedExercise[];
  type: 'warmup' | 'workout' | 'cooldown' | 'other';
  time?: string;
  totalTime?: string;
  circuitDetails?: string;
  circuitRounds?: number;
}

export interface FileAnalysisResult {
  sections: WorkoutSection[];
  workoutTitle?: string;
  duration?: string;
  confidence: number;
  rawText: string;
}

export class FileAnalyzer {
  public static async analyzeFile(file: File): Promise<FileAnalysisResult> {
    try {
      console.log('=== DEBUG ANALISI FILE ===');
      console.log('File:', file.name);
      console.log('Tipo:', file.type);
      
      // Usa il parser semplificato
      const parser = new SimplePDFParser();
      const workoutPlan = await parser.parseFile(file);
      
      // Converti in formato legacy
      const sections: WorkoutSection[] = workoutPlan.sections.map(section => {
        if (section.kind === 'warmup') {
          return {
            title: section.title,
            exercises: section.items.map(item => ({
              name: item.name,
              sets: item.series?.toString(),
              reps: item.reps,
              repeats: item.repeats,
              time: item.time,
              rest: item.rest,
              notes: item.notes
            })),
            type: 'warmup' as const,
            time: section.totalTime,
            totalTime: section.totalTime
          };
        } else if (section.kind === 'day') {
          return {
            title: section.title,
            exercises: section.items.map(item => ({
              name: item.name,
              sets: item.series?.toString(),
              reps: item.reps,
              repeats: item.repeats,
              time: item.time,
              rest: item.rest,
              notes: item.notes
            })),
            type: 'workout' as const
          };
        } else {
          return {
            title: section.title,
            exercises: section.items.map(item => ({
              name: item.name,
              sets: item.series?.toString(),
              reps: item.reps,
              repeats: item.repeats,
              time: item.time,
              rest: item.rest,
              notes: item.notes
            })),
            type: 'cooldown' as const,
            time: section.totalTime,
            totalTime: section.totalTime
          };
        }
      });
      
      console.log('Sezioni trovate:', sections);
      console.log('=== FINE DEBUG ===');
      
      const totalExercises = sections.reduce((sum, section) => sum + section.exercises.length, 0);
      const confidence = workoutPlan.confidence || (totalExercises > 0 ? Math.min(0.9, 0.5 + (totalExercises * 0.1)) : 0.3);
      
      return {
        sections,
        workoutTitle: file.name,
        duration: '45 min',
        confidence,
        rawText: 'Testo estratto dal PDF'
      };
    } catch (error) {
      console.error('Errore analisi file:', error);
      throw error;
    }
  }
}
