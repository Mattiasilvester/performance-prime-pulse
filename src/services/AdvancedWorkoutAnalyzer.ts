/**
 * AdvancedWorkoutAnalyzer - Sistema completo di analisi PDF/OCR
 * Con logging dettagliato, fallback OCR e gestione URL firmati Supabase
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';

// Configurazione PDF.js per browser
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Flag debug
const DEBUG_ANALYSIS = process.env.NEXT_PUBLIC_DEBUG_ANALYSIS === "1";

// Interfacce aggiornate
export interface ExtractedText {
  text: string;
  source: 'pdf-text' | 'ocr' | 'text-file';
  extractionStatus: 'SUCCESS' | 'EMPTY_TEXT' | 'EMPTY_TEXT_AFTER_OCR' | 'ERROR';
  confidence: number;
}

export interface ParsedExercise {
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest?: string;
  notes?: string;
  _sourceLine?: string;
}

export interface ParsedDay {
  riscaldamento: ParsedExercise[];
  scheda: ParsedExercise[];
  stretching: ParsedExercise[];
  multiDay?: boolean;
  daysFound?: string[];
}

export interface ParsedWorkoutResult {
  riscaldamento: ParsedExercise[];
  giorno: number;
  esercizi: ParsedExercise[];
  stretching: ParsedExercise[];
  multiDay?: boolean;
  daysFound?: string[];
  metadata: {
    extractionSource: string;
    extractionStatus: string;
    confidence: number;
    warnings: string[];
    debug?: {
      textPreview: string;
      extractionSource: string;
      extractionStatus: string;
      reason: string;
      linesTried?: number;
      matches?: number;
      reasons?: string[];
    };
  };
}

// Regex robuste con named groups
const RX = {
  // 3x10 o 3 x 10 o 3×10-12 (+ riposo/note)
  setsReps1: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<sets>\d{1,2})\s*x\s*(?<reps_lo>\d{1,3})(?:\s*[-–]\s*(?<reps_hi>\d{1,3}))?(?:\s*(?:reps?|rip(?:etizioni)?))?(?:.*?(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite|negativa|lenta|manubri|bilanciere))?$/u,

  // "3 serie da 10" / "4 set da 8-10"
  setsReps2: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<sets>\d{1,2})\s*(?:serie|set)\s*(?:da|x)\s*(?<reps_lo>\d{1,3})(?:\s*[-–]\s*(?<reps_hi>\d{1,3}))?(?:.*?(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite|negativa|lenta|manubri|bilanciere))?$/u,

  // Tempo: 3x30" / 4x45s / 5x1min
  setsTime: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<sets>\d{1,2})\s*x\s*(?<dur_val>\d{1,3})\s*(?<dur_unit>["s]|sec|min)(?:.*?(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite))?$/u,

  // Solo tempo: "Plank 60s" / "Skipping 2min"
  timeOnly: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<dur_val>\d{1,3})\s*(?<dur_unit>["s]|sec|min)(?:.*?(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite))?$/u,

  // Range reps sciolto (es. "Panca piana 8-10")
  repsLoose: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<reps_lo>\d{1,3})\s*[-–]\s*(?<reps_hi>\d{1,3})(?:\s*(?:rip|ripetizioni|reps))?(?:.*?(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite))?$/u,

  // Recupero standalone su riga successiva
  restOnly: /^(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min)$/iu,
};

export class AdvancedWorkoutAnalyzer {
  /**
   * FLUSSO PRINCIPALE DI ANALISI
   */
  static async analyzeWorkoutFile(file: File | string): Promise<ParsedWorkoutResult> {
    const startTime = Date.now();
    
    // Log iniziale
    this.log('[ANALYSIS]', `File ricevuto → ${typeof file === 'string' ? 'URL' : 'File'}: ${typeof file === 'string' ? file : file.name} (${file.size} bytes)`);
    
    try {
      // 1. Gestione input (file o URL)
      const fileUrl = await this.handleInput(file);
      
      // 2. Estrazione testo con fallback OCR
      const extractedText = await this.extractText(fileUrl);
      
      if (extractedText.extractionStatus === 'EMPTY_TEXT' || extractedText.extractionStatus === 'EMPTY_TEXT_AFTER_OCR') {
        this.log('[EXTRACT]', '⚠ Nessun testo estratto');
        return this.createEmptyResult(extractedText);
      }
      
      this.log('[EXTRACT]', `→ ${extractedText.source}, lunghezza: ${extractedText.text.length} caratteri`);
      
      // 3. Parsing struttura
      const parsedResult = await this.parseWorkoutStructure(extractedText.text);
      
      this.log('[PARSE]', `→ ${parsedResult.riscaldamento.length} riscaldamento, ${parsedResult.scheda.length} esercizi, ${parsedResult.stretching.length} stretching`);
      
      // 4. Calcolo confidence
      const confidence = this.calculateConfidence(extractedText, parsedResult);
      
      this.log('[CONF]', `→ Punteggio: ${confidence}/100`);
      
      // 5. Costruzione risultato finale
      const result: ParsedWorkoutResult = {
        riscaldamento: parsedResult.riscaldamento,
        giorno: this.detectDay(extractedText.text),
        esercizi: parsedResult.scheda,
        stretching: parsedResult.stretching,
        multiDay: parsedResult.multiDay,
        daysFound: parsedResult.daysFound,
        metadata: {
          extractionSource: extractedText.source,
          extractionStatus: extractedText.extractionStatus,
          confidence,
          warnings: this.generateWarnings(extractedText, parsedResult),
          ...(DEBUG_ANALYSIS && {
            debug: {
              textPreview: extractedText.text.slice(0, 600),
              extractionSource: extractedText.source,
              extractionStatus: extractedText.extractionStatus,
              reason: `Analisi completata in ${Date.now() - startTime}ms`,
              linesTried: parsedResult.metadata?.linesTried,
              matches: parsedResult.metadata?.matches,
              reasons: parsedResult.metadata?.reasons
            }
          })
        }
      };
      
      return result;
      
    } catch (error) {
      this.log('[ERROR]', `Errore durante l'analisi: ${error}`);
      return this.createErrorResult(error as Error);
    }
  }

  /**
   * Gestione input: file o URL firmato Supabase
   */
  private static async handleInput(file: File | string): Promise<string> {
    if (typeof file === 'string') {
      // È già un URL
      return file;
    }
    
    // Se è un file, controlla se proviene da Supabase Storage
    if (file.name.includes('supabase') || file.type === 'application/octet-stream') {
      try {
        // Genera URL firmato per Supabase Storage
        const { data, error } = await supabase.storage
          .from('workout-files')
          .createSignedUrl(file.name, 3600); // 1 ora
        
        if (error) throw error;
        return data.signedUrl;
      } catch (error) {
        this.log('[URL]', `Errore generazione URL firmato: ${error}`);
      }
    }
    
    // Fallback: crea URL locale
    return URL.createObjectURL(file);
  }

  /**
   * Estrazione testo con fallback OCR
   */
  private static async extractText(fileUrl: string): Promise<ExtractedText> {
    try {
      // 1. Prova estrazione testo PDF
      const pdfText = await this.extractPDFText(fileUrl);
      
      if (pdfText.text.trim().length >= 20) {
        this.log('[EXTRACT]', `PDF text extraction → ${pdfText.text.length} caratteri`);
        return {
          text: pdfText.text,
          source: 'pdf-text',
          extractionStatus: 'SUCCESS',
          confidence: pdfText.confidence
        };
      }
      
      this.log('[EXTRACT]', `PDF text troppo corto (${pdfText.text.length} caratteri), prova OCR...`);
      
      // 2. Fallback OCR
      const ocrText = await this.extractOCRText(fileUrl);
      
      if (ocrText.text.trim().length >= 20) {
        this.log('[EXTRACT]', `OCR extraction → ${ocrText.text.length} caratteri`);
        return {
          text: ocrText.text,
          source: 'ocr',
          extractionStatus: 'SUCCESS',
          confidence: ocrText.confidence
        };
      }
      
      this.log('[EXTRACT]', '⚠ OCR non ha estratto testo sufficiente');
      return {
        text: ocrText.text,
        source: 'ocr',
        extractionStatus: 'EMPTY_TEXT_AFTER_OCR',
        confidence: 0
      };
      
    } catch (error) {
      this.log('[EXTRACT]', `Errore estrazione: ${error}`);
      return {
        text: '',
        source: 'pdf-text',
        extractionStatus: 'ERROR',
        confidence: 0
      };
    }
  }

  /**
   * Estrazione testo da PDF usando pdf.js
   */
  private static async extractPDFText(fileUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      let totalPages = pdf.numPages;
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      // Pulizia testo
      const cleanedText = this.normalizeText(fullText);
      
      return {
        text: cleanedText,
        confidence: cleanedText.length > 100 ? 80 : 40
      };
      
    } catch (error) {
      this.log('[PDF]', `Errore estrazione PDF: ${error}`);
      return { text: '', confidence: 0 };
    }
  }

  /**
   * Estrazione OCR usando Tesseract.js
   */
  private static async extractOCRText(fileUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      const worker = await createWorker('ita+eng', 1, {
        logger: DEBUG_ANALYSIS ? m => this.log('[OCR]', m) : () => {}
      });
      
      const { data: { text, confidence } } = await worker.recognize(fileUrl);
      await worker.terminate();
      
      // Pulizia testo OCR
      const cleanedText = this.normalizeText(text);
      
      return {
        text: cleanedText,
        confidence: confidence / 100
      };
      
    } catch (error) {
      this.log('[OCR]', `Errore OCR: ${error}`);
      return { text: '', confidence: 0 };
    }
  }

  /**
   * Normalizzazione testo avanzata
   */
  private static normalizeText(text: string): string {
    return text
      // Normalizzazione Unicode
      .normalize('NFKC')
      // Sostituzioni simboli
      .replace(/×/g, 'x')
      .replace(/[–—]/g, '-')
      .replace(/[''`]/g, "'")
      .replace(/[""]/g, '"')
      .replace(/…/g, '...')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      // Rimuovi caratteri di controllo
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Rimuovi bullet points all'inizio riga
      .replace(/^[•\-]\s*/gm, '')
      // Collassa spazi multipli
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parsing struttura allenamento avanzato
   */
  private static async parseWorkoutStructure(text: string): Promise<ParsedDay & { metadata?: any }> {
    const DEBUG = process.env.NEXT_PUBLIC_DEBUG_ANALYSIS === "1";

    // Step 1: Normalizzazione base
    let normalized = text
      .replace(/×/g, "x")
      .replace(/–/g, "-")
      .replace(/•/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Dividi in righe
    const lines = normalized.split("\n").map(l => l.trim()).filter(Boolean);

    // Step 2: LOG righe normalizzate (solo in debug mode)
    if (DEBUG) {
      console.log("========== [DEBUG LINES - NORMALIZED TEXT] ==========");
      lines.forEach((line, idx) => {
        console.log(`${idx + 1}: "${line}"`);
      });
      console.log("====================================================");
    }

    // Preprocessamento righe (logica esistente)
    const processedLines = this.preprocessLines(text);
    let currentSection: 'riscaldamento' | 'scheda' | 'stretching' = 'scheda';
    let multiDay = false;
    let daysFound: string[] = [];
    
    const result: ParsedDay = {
      riscaldamento: [],
      scheda: [],
      stretching: []
    };
    
    let linesTried = 0;
    let matches = 0;
    const reasons: string[] = [];
    let lastExercise: ParsedExercise | null = null;
    
    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i].trim();
      if (!line) continue;
      
      linesTried++;
      
      // Controlla se è una sezione
      const sectionMatch = this.detectSection(line);
      if (sectionMatch) {
        currentSection = sectionMatch;
        continue;
      }
      
      // Controlla se è un giorno
      const dayMatch = this.detectDay(line);
      if (dayMatch) {
        if (daysFound.length > 0) {
          multiDay = true;
        }
        daysFound.push(line);
        continue;
      }
      
      // Prova a parsare l'esercizio
      const exercise = this.parseExerciseLine(line);
      if (exercise) {
        matches++;
        lastExercise = exercise;
        
        switch (currentSection) {
          case 'riscaldamento':
            result.riscaldamento.push(exercise);
            break;
          case 'scheda':
            result.scheda.push(exercise);
            break;
          case 'stretching':
            result.stretching.push(exercise);
            break;
        }
        continue;
      }
      
      // Controlla se è solo recupero
      const restMatch = line.match(RX.restOnly);
      if (restMatch && lastExercise && !lastExercise.rest) {
        const restVal = restMatch.groups?.rest_val;
        const restUnit = restMatch.groups?.rest_unit;
        if (restVal && restUnit) {
          lastExercise.rest = `${restVal}${restUnit === '"' ? 's' : restUnit}`;
          continue;
        }
      }
      
      // Nessun match trovato
      reasons.push(`Linea ${i + 1}: "${line}" - nessun pattern match`);
    }
    
    // Suggerimenti se mancanti
    if (result.riscaldamento.length === 0) {
      result.riscaldamento = this.suggestRiscaldamento(result.scheda);
    }
    
    if (result.stretching.length === 0) {
      result.stretching = this.suggestStretching(result.scheda);
    }
    
    return {
      ...result,
      multiDay,
      daysFound,
      metadata: DEBUG_ANALYSIS ? {
        linesTried,
        matches,
        reasons
      } : undefined
    };
  }

  /**
   * Preprocessamento righe
   */
  private static preprocessLines(text: string): string[] {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Unisci righe spezzate
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        
        // Se la riga corrente finisce con : o non ha numeri e la successiva è solo quantità
        if ((line.endsWith(':') || !/\d/.test(line)) && /\d+\s*x\s*\d+/.test(nextLine)) {
          line = `${line} ${nextLine}`;
          i++; // Salta la riga successiva
        }
      }
      
      if (line) {
        processedLines.push(line);
      }
    }
    
    return processedLines;
  }

  /**
   * Rilevamento sezioni
   */
  private static detectSection(line: string): 'riscaldamento' | 'scheda' | 'stretching' | null {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('riscaldamento') || lowerLine.includes('warm-up') || lowerLine.includes('warm up')) {
      return 'riscaldamento';
    }
    
    if (lowerLine.includes('stretching') || lowerLine.includes('defaticamento') || lowerLine.includes('cool-down')) {
      return 'stretching';
    }
    
    if (lowerLine.includes('esercizi') || lowerLine.includes('allenamento') || lowerLine.includes('main')) {
      return 'scheda';
    }
    
    return null;
  }

  /**
   * Rilevamento giorni
   */
  private static detectDay(line: string): string | null {
    const dayPatterns = [
      /giorno\s*(\d+)/i,
      /day\s*(\d+)/i,
      /sessione\s*(\d+)/i,
      /session\s*(\d+)/i,
      /(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    ];
    
    for (const pattern of dayPatterns) {
      const match = line.match(pattern);
      if (match) {
        return line;
      }
    }
    
    return null;
  }

  /**
   * Parsing singola riga esercizio
   */
  private static parseExerciseLine(line: string): ParsedExercise | null {
    // Prova tutti i pattern in ordine di priorità
    const patterns = [
      { name: 'setsReps1', regex: RX.setsReps1 },
      { name: 'setsReps2', regex: RX.setsReps2 },
      { name: 'setsTime', regex: RX.setsTime },
      { name: 'timeOnly', regex: RX.timeOnly },
      { name: 'repsLoose', regex: RX.repsLoose }
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match && match.groups) {
        const groups = match.groups;
        
        const exercise: ParsedExercise = {
          name: groups.name?.trim() || '',
          _sourceLine: line
        };
        
        // Sets
        if (groups.sets) {
          exercise.sets = groups.sets;
        }
        
        // Reps
        if (groups.reps_lo) {
          exercise.reps = groups.reps_hi ? `${groups.reps_lo}-${groups.reps_hi}` : groups.reps_lo;
        }
        
        // Duration
        if (groups.dur_val && groups.dur_unit) {
          const unit = groups.dur_unit === '"' ? 's' : groups.dur_unit;
          exercise.duration = `${groups.dur_val}${unit}`;
        }
        
        // Rest
        if (groups.rest_val && groups.rest_unit) {
          const unit = groups.rest_unit === '"' ? 's' : groups.rest_unit;
          exercise.rest = `${groups.rest_val}${unit}`;
        }
        
        // Notes
        if (groups.notes) {
          exercise.notes = groups.notes;
        }
        
        return exercise.name ? exercise : null;
      }
    }
    
    return null;
  }

  /**
   * Suggerimenti riscaldamento
   */
  private static suggestRiscaldamento(esercizi: ParsedExercise[]): ParsedExercise[] {
    return [{
      name: 'Mobilità articolare generale',
      sets: '1',
      duration: '5min',
      notes: '(Proposto dal programma)',
      _sourceLine: 'Suggerito automaticamente'
    }];
  }

  /**
   * Suggerimenti stretching
   */
  private static suggestStretching(esercizi: ParsedExercise[]): ParsedExercise[] {
    return [{
      name: 'Stretching generale',
      sets: '1',
      duration: '5min',
      notes: '(Proposto dal programma)',
      _sourceLine: 'Suggerito automaticamente'
    }];
  }

  /**
   * Calcolo confidence score
   */
  private static calculateConfidence(extractedText: ExtractedText, parsedResult: any): number {
    if (extractedText.text.length === 0) return 0;
    
    const totalExercises = parsedResult.riscaldamento.length + parsedResult.scheda.length + parsedResult.stretching.length;
    
    if (totalExercises === 0) return 20;
    
    let score = 60;
    
    // Bonus per più esercizi
    if (totalExercises > 3) score += 10;
    if (totalExercises > 5) score += 10;
    
    // Bonus per sezioni complete
    if (parsedResult.riscaldamento.length > 0) score += 5;
    if (parsedResult.stretching.length > 0) score += 5;
    
    // Bonus per source
    if (extractedText.source === 'pdf-text') score += 5;
    
    return Math.min(score, 90);
  }

  /**
   * Generazione warnings
   */
  private static generateWarnings(extractedText: ExtractedText, parsedResult: any): string[] {
    const warnings: string[] = [];
    
    if (extractedText.extractionStatus === 'EMPTY_TEXT_AFTER_OCR') {
      warnings.push('PDF non contiene testo leggibile, usare OCR');
    }
    
    if (parsedResult.scheda.length === 0 && extractedText.text.length > 0) {
      warnings.push('Regex non hanno trovato match per gli esercizi');
    }
    
    return warnings;
  }

  /**
   * Risultato vuoto
   */
  private static createEmptyResult(extractedText: ExtractedText): ParsedWorkoutResult {
    return {
      riscaldamento: [],
      giorno: 1,
      esercizi: [],
      stretching: [],
      metadata: {
        extractionSource: extractedText.source,
        extractionStatus: extractedText.extractionStatus,
        confidence: 0,
        warnings: ['Nessun testo estratto dal file']
      }
    };
  }

  /**
   * Risultato errore
   */
  private static createErrorResult(error: Error): ParsedWorkoutResult {
    return {
      riscaldamento: [],
      giorno: 1,
      esercizi: [],
      stretching: [],
      metadata: {
        extractionSource: 'error',
        extractionStatus: 'ERROR',
        confidence: 0,
        warnings: [`Errore durante l'analisi: ${error.message}`]
      }
    };
  }

  /**
   * Logging centralizzato
   */
  private static log(prefix: string, message: string) {
    if (DEBUG_ANALYSIS) {
      console.log(`${prefix} ${message}`);
    }
  }
}
