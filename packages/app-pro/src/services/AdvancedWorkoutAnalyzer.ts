/**
 * AdvancedWorkoutAnalyzer - Sistema completo di analisi PDF/OCR
 * Con logging dettagliato, fallback OCR e gestione URL firmati Supabase
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, no-useless-escape, no-control-regex, no-empty -- regex complesse e tipi dinamici OCR; modifiche rischiose per comportamento */

import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';

// Flag debug
const DEBUG_ANALYSIS = env.DEBUG_MODE; // Ripristinato normale

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

  // FORMATO UNIVERSALE RIPETIZIONI: "4 sets x 8-10 repetitions"
  universalReps: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<sets>\d{1,2})\s*(?:sets?|serie)\s*x\s*(?<reps_lo>\d{1,3})(?:\s*[-–]\s*(?<reps_hi>\d{1,3}))?\s*(?:repetitions?|reps?|ripetizioni?)(?:.*?(?:rec(?:upero)?|rest|pausa|recovery)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min|seconds?|minutes?))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite))?$/iu,
  
  // FORMATO UNIVERSALE DURATA: "3 sets x 45-60 seconds"
  universalTime: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[-–:]?\s*(?<sets>\d{1,2})\s*(?:sets?|serie)\s*x\s*(?<dur_val>\d{1,3})(?:\s*[-–]\s*(?<dur_hi>\d{1,3}))?\s*(?<dur_unit>seconds?|sec|minutes?|min|minuti?)(?:.*?(?:rec(?:upero)?|rest|pausa|recovery)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min|seconds?|minutes?))?(?:.*?(?<notes>\((?:[^)]+)\)|per gamba|per lato|totali|assistite))?$/iu,
  
  // FORMATO "SETS X TIME NAME": "2 x 15 20 sec Jumping jacks"
  universalTimeName: /^(?<sets>\d{1,2})\s*x\s*(?<dur_val>\d{1,3})(?:\s*[-–]\s*(?<dur_hi>\d{1,3}))?\s*(?<dur_unit>sec|min|seconds?|minutes?|minuti?)\s+(?<rest_val>\d{1,3})\s*(?<rest_unit>sec|min|seconds?|minutes?)\s+(?<name>[\p{L}\d .,'()\/\-]+?)$/iu,

  // FORMATO TABELLA: "Esercizio | Serie x Ripetizioni | Recupero"
  tableFormat: /^(?<name>[\p{L}\d .,'()\/\-]+?)\s*[|]\s*(?<sets>\d{1,2})\s*x\s*(?<reps_lo>\d{1,3})(?:\s*[-–]\s*(?<reps_hi>\d{1,3}))?\s*[|]\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min)$/u,

  // Recupero standalone su riga successiva
  restOnly: /^(?:rec(?:upero)?|rest|pausa)\s*(?<rest_val>\d{1,3})\s*(?<rest_unit>["s]|sec|min)$/iu,
  
  // FORMATO "1 x 20sec" (recupero standalone)
  restFormat: /^(?<rest_val>\d{1,3})\s*x\s*(?<rest_unit>\d{1,3})\s*(sec|min|seconds?|minutes?)$/iu,
  
  // 🔥 NUOVO PATTERN ITALIANO: "Lunedì Squat 4 12 60s"
  italianFormat: /(?:Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica)?\s*(?<name>[A-Za-z\s]+?)\s+(?<sets>\d+)\s*(?:x)?\s*(?<reps_lo>\d+)\s*(?<notes>per gamba)?\s*(?<rest_val>\d+)(?<rest_unit>s|sec|min)/gi,
};

export class AdvancedWorkoutAnalyzer {
  /**
   * FLUSSO PRINCIPALE DI ANALISI
   */
  static async analyzeWorkoutFile(file: File | string): Promise<ParsedWorkoutResult> {
    const startTime = Date.now();
    
    // Log iniziale
    this.log('[ANALYSIS]', `File ricevuto → ${typeof file === 'string' ? 'URL' : 'File'}: ${typeof file === 'string' ? file : file.name} (${typeof file === 'string' ? 'N/A' : file.size} bytes)`);
    console.log('🔴 [DEBUG] AdvancedWorkoutAnalyzer - File ricevuto:', typeof file === 'string' ? file : file.name);
    
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
      console.log('🔴 [DEBUG] PDF testo estratto:', extractedText.text);
      console.log('🔴 [DEBUG] Esercizi trovati nel testo:', parsedResult);
      
      // DEBUG: Log parsing results
      if (DEBUG_ANALYSIS) {
        console.log('🔍 [DEBUG PARSE] Risultati parsing:', {
          riscaldamento: parsedResult.riscaldamento.length,
          scheda: parsedResult.scheda.length,
          stretching: parsedResult.stretching.length,
          total: parsedResult.riscaldamento.length + parsedResult.scheda.length + parsedResult.stretching.length
        });
      }
      
      this.log('[PARSE]', `→ ${parsedResult.riscaldamento.length} riscaldamento, ${parsedResult.scheda.length} esercizi, ${parsedResult.stretching.length} stretching`);
      
      // 4. Calcolo confidence
      const confidence = this.calculateConfidence(extractedText, parsedResult);
      
      this.log('[CONF]', `→ Punteggio: ${confidence}/100`);
      
      // 5. Costruzione risultato finale
      const result: ParsedWorkoutResult = {
        riscaldamento: parsedResult.riscaldamento,
        giorno: this.detectDayNumber(extractedText.text),
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
      // Dynamic import di PDF.js per ridurre bundle size
      // @ts-ignore - pdfjs-dist types issue
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurazione PDF.js per browser - fallback locale per evitare errori 406
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        // FIX: Configurazione font per evitare errori FoxitDingbats.pfb
        (pdfjsLib.GlobalWorkerOptions as any).standardFontDataUrl = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`;
      } catch (error) {
        // Fallback locale se CDN non disponibile
        console.warn('PDF.js CDN non disponibile, usando fallback locale');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        (pdfjsLib.GlobalWorkerOptions as any).standardFontDataUrl = '/standard_fonts/';
      }
      
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // FIX: Mantieni separazione righe durante estrazione PDF
        const pageText = textContent.items
          .map((item: any) => {
            // Se l'item ha proprietà di posizione, aggiungi newline se necessario
            if (item.hasEOL) {
              return item.str + '\n';
            }
            return item.str;
          })
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      // Pulizia testo
      const cleanedText = this.normalizeText(fullText);
      
      // DEBUG: Log testo estratto per diagnostica
      if (DEBUG_ANALYSIS) {
        console.log('🔍 [DEBUG PDF] Testo estratto:', cleanedText);
        console.log('🔍 [DEBUG PDF] Righe totali:', cleanedText.split('\n').length);
        console.log('🔍 [DEBUG PDF] Prime 500 caratteri:', cleanedText.slice(0, 500));
      }
      
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
        logger: DEBUG_ANALYSIS ? (m: any) => this.log('[OCR]', typeof m === 'string' ? m : JSON.stringify(m)) : () => {}
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
      // FIX CRITICO: Standardizza TUTTI i tipi di interruzioni di riga PRIMA di tutto
      .replace(/\r\n/g, '\n')  // Windows (\r\n)
      .replace(/\r/g, '\n')    // Mac (\r)
      .replace(/\u2028/g, '\n') // Line separator
      .replace(/\u2029/g, '\n') // Paragraph separator
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
      // Rimuovi caratteri di controllo MA NON \n
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Rimuovi bullet points all'inizio riga
      .replace(/^[•\-]\s*/gm, '')
      // Collassa spazi multipli MA PRESERVA newlines
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  /**
   * Parsing struttura allenamento avanzato
   */
  private static async parseWorkoutStructure(text: string): Promise<ParsedDay & { metadata?: any }> {
    const DEBUG = env.DEBUG_MODE;

    // Step 1: Normalizzazione base
    const normalized = text
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
      // DEBUG: "========== [DEBUG LINES - NORMALIZED TEXT] ==========");
      lines.forEach((line, idx) => {
      });
    }

    // Preprocessamento righe (usa testo normalizzato!)
    const processedLines = this.preprocessLines(normalized);
    
    // DEBUG: Log righe processate
    if (DEBUG_ANALYSIS) {
      console.log('🔍 [DEBUG LINES] Righe processate:', processedLines.length);
      console.log('🔍 [DEBUG LINES] Prime 10 righe:', processedLines.slice(0, 10));
    }
    let currentSection: 'riscaldamento' | 'scheda' | 'stretching' = 'scheda';
    let multiDay = false;
    const daysFound: string[] = [];
    
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
        
        // DEBUG: Log esercizio riconosciuto
        if (DEBUG_ANALYSIS) {
          console.log('✅ [DEBUG PARSE] Esercizio riconosciuto:', exercise.name, '- Linea:', line);
        }
        
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
      
      // Controlla se è solo recupero (formato "recupero 20sec")
      const restMatch = line.match(RX.restOnly);
      if (restMatch && lastExercise && !lastExercise.rest) {
        const restVal = restMatch.groups?.rest_val;
        const restUnit = restMatch.groups?.rest_unit;
        if (restVal && restUnit) {
          lastExercise.rest = `${restVal}${restUnit === '"' ? 's' : restUnit}`;
          continue;
        }
      }
      
      // Controlla se è formato "1 x 20sec" (recupero standalone)
      const restFormatMatch = line.match(RX.restFormat);
      if (restFormatMatch && lastExercise && !lastExercise.rest) {
        const restVal = restFormatMatch.groups?.rest_unit; // Il secondo numero è il tempo
        const restUnit = restFormatMatch.groups?.[3]; // sec|min|seconds?|minutes?
        if (restVal && restUnit) {
          lastExercise.rest = `${restVal}${restUnit.includes('sec') ? 'sec' : 'min'}`;
          console.log('✅ [DEBUG] RestFormat riconosciuto:', line, '→', lastExercise.rest);
          continue;
        }
      }
      
      // Nessun match trovato
      reasons.push(`Linea ${i + 1}: "${line}" - nessun pattern match`);
      
      // DEBUG: Log riga non riconosciuta
      if (DEBUG_ANALYSIS) {
        console.log('❌ [DEBUG PARSE] Riga non riconosciuta:', line);
      }
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
      metadata: DEBUG ? {
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
    // FIX: Usa direttamente le righe divise, non ricostruirle
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // DEBUG: Log righe originali
    if (DEBUG_ANALYSIS) {
      console.log('🔍 [DEBUG PREPROCESS] Righe originali:', lines.length);
      console.log('🔍 [DEBUG PREPROCESS] Prime 5 righe originali:', lines.slice(0, 5));
    }
    
    return lines;
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
   * Rilevamento numero giorno (per compatibilità tipo)
   */
  private static detectDayNumber(text: string): number {
    const dayMatch = this.detectDay(text);
    if (dayMatch) {
      const numberMatch = dayMatch.match(/\d+/);
      if (numberMatch) {
        return parseInt(numberMatch[0], 10);
      }
    }
    return 1; // Default al giorno 1
  }

  /**
   * Parsing singola riga esercizio
   */
  private static parseExerciseLine(line: string): ParsedExercise | null {
    // Prova tutti i pattern in ordine di priorità (aggiunte regex universali)
    const patterns = [
      { name: 'italianFormat', regex: RX.italianFormat },
      { name: 'universalTimeName', regex: RX.universalTimeName },
      { name: 'universalReps', regex: RX.universalReps },
      { name: 'universalTime', regex: RX.universalTime },
      { name: 'tableFormat', regex: RX.tableFormat },
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
        
        // Duration (supporto per formato universale)
        if (groups.dur_val && groups.dur_unit) {
          let unit = groups.dur_unit;
          if (unit === '"') unit = 's';
          if (unit.includes('second')) unit = 's';
          if (unit.includes('minute') || unit.includes('minut')) unit = 'min';
          
          if (groups.dur_hi) {
            exercise.duration = `${groups.dur_val}-${groups.dur_hi}${unit}`;
          } else {
            exercise.duration = `${groups.dur_val}${unit}`;
          }
        }
        
        // Rest (supporto per formato universale)
        if (groups.rest_val && groups.rest_unit) {
          let unit = groups.rest_unit;
          if (unit === '"') unit = 's';
          if (unit.includes('second')) unit = 's';
          if (unit.includes('minute') || unit.includes('minut')) unit = 'min';
          // FIX: Formato pulito senza "1 x"
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
    }
  }
}
