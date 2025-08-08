// ===== SISTEMA ROBUSTO DI LETTURA FILE =====

import TextProcessor, { TextProcessingResult } from './TextProcessor';

export interface FileProcessingResult {
  text: string;
  confidence: number;
  warnings: string[];
  metadata: {
    fileType: string;
    fileSize: number;
    extractionMethod: string;
    processingSteps: string[];
    anomalies: string[];
  };
}

export class FileProcessor {
  private debug = true;
  private textProcessor = new TextProcessor();

  /**
   * PUNTO DI INGRESSO PRINCIPALE
   */
  async processFile(file: File): Promise<FileProcessingResult> {
    console.log('🚀 === INIZIO PROCESSING FILE ===');
    console.log('📄 File:', file.name);
    console.log('📦 Dimensione:', (file.size / 1024).toFixed(2), 'KB');
    console.log('📝 Tipo MIME:', file.type);

    try {
      // Validazione file
      this.validateFile(file);
      
      // Rileva tipo file
      const fileType = this.detectFileType(file);
      console.log('🔍 Tipo rilevato:', fileType);

      let rawText: string;
      let extractionMethod: string;

      // STEP 1: Estrazione testo nativa
      try {
        rawText = await this.extractRawText(file, fileType);
        extractionMethod = this.getExtractionMethod(fileType);
        console.log('✅ Estrazione nativa completata');
      } catch (error) {
        console.warn('⚠️ Estrazione nativa fallita:', error);
        
        // STEP 2: Fallback OCR per immagini
        if (fileType === 'image') {
          console.log('🖼️ Tentativo OCR fallback...');
          const ocrResult = await this.textProcessor.performOCRFallback(file);
          rawText = ocrResult.text;
          extractionMethod = 'tesseract';
        } else {
          throw new Error(`Impossibile estrarre testo dal file: ${error.message}`);
        }
      }

      // STEP 3: Processamento testo con TextProcessor
      console.log('🧹 Avvio processamento testo...');
      const textResult = await this.textProcessor.processText(rawText, fileType);
      
      // STEP 4: Controlla se serve OCR fallback
      if (this.textProcessor.shouldUseOCRFallback(textResult.cleanText)) {
        console.warn('⚠️ Testo anomalo rilevato, potrebbe servire OCR');
        // TODO: Implementare OCR fallback anche per PDF
      }

      // STEP 5: Prepara risultato finale
      const result: FileProcessingResult = {
        text: textResult.cleanText,
        confidence: textResult.pages[0]?.confidence || 0,
        warnings: textResult.metadata.anomalies,
        metadata: {
          fileType,
          fileSize: file.size,
          extractionMethod,
          processingSteps: [
            'extraction',
            'unicode_normalization',
            'typography_fix',
            'hyphenation_merge',
            'ocr_corrections',
            'validation'
          ],
          anomalies: textResult.metadata.anomalies
        }
      };

      console.log('✅ === PROCESSING FILE COMPLETATO ===');
      console.log('📝 Testo finale (primi 500 caratteri):');
      console.log(result.text.substring(0, 500));
      console.log('📊 Confidenza:', result.confidence);
      console.log('⚠️ Warning:', result.warnings);

      return result;

    } catch (error) {
      console.error('❌ ERRORE PROCESSING FILE:', error);
      throw error;
    }
  }

  /**
   * VALIDAZIONE FILE
   */
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('Nessun file fornito');
    }

    if (file.size === 0) {
      throw new Error('Il file è vuoto');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('File troppo grande (max 50MB)');
    }

    console.log('✅ File validato correttamente');
  }

  /**
   * RILEVA TIPO FILE
   */
  private detectFileType(file: File): string {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // PDF
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      return 'pdf';
    }

    // Immagini
    if (mimeType.includes('image') || /\.(png|jpg|jpeg|gif|bmp|webp)$/.test(fileName)) {
      return 'image';
    }

    // Testo
    if (mimeType.includes('text') || fileName.endsWith('.txt')) {
      return 'text';
    }

    // Fallback basato su estensione
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpg|jpeg|gif|bmp|webp)$/.test(fileName)) return 'image';
    if (fileName.endsWith('.txt')) return 'text';

    throw new Error('Tipo file non riconosciuto');
  }

  /**
   * ESTRAI TESTO GREZZO
   */
  private async extractRawText(file: File, fileType: string): Promise<string> {
    switch (fileType) {
      case 'pdf':
        return await this.extractPDFText(file);
      case 'image':
        return await this.extractImageText(file);
      case 'text':
        return await this.extractTextFile(file);
      default:
        throw new Error(`Tipo file non supportato: ${fileType}`);
    }
  }

  /**
   * ESTRAI TESTO DA PDF
   */
  private async extractPDFText(file: File): Promise<string> {
    console.log('📑 Estrazione testo PDF...');

    try {
      // Metodo 1: pdf.js globale (se disponibile)
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        console.log('📖 Usando pdf.js globale');
        return await this.extractPDFWithPdfJS(file);
      }

      // Metodo 2: FileReader fallback
      console.log('📖 Usando FileReader fallback');
      return await this.extractPDFWithFileReader(file);

    } catch (error) {
      console.error('❌ Errore estrazione PDF:', error);
      throw new Error(`Impossibile leggere il PDF: ${error.message}`);
    }
  }

  /**
   * ESTRAI PDF CON PDF.JS
   */
  private async extractPDFWithPdfJS(file: File): Promise<string> {
    const pdfjsLib = (window as any).pdfjsLib;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📄 PDF caricato, pagine: ${pdf.numPages}`);

      let fullText = '';
      let totalItems = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          console.log(`  📄 Processando pagina ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
          totalItems += textContent.items.length;

        } catch (pageError) {
          console.warn(`⚠️ Errore pagina ${i}:`, pageError);
          // Continua con le altre pagine
        }
      }

      console.log(`📊 Totale elementi testo: ${totalItems}`);
      return fullText;

    } catch (error) {
      console.error('❌ Errore pdf.js:', error);
      throw new Error(`Errore PDF.js: ${error.message}`);
    }
  }

  /**
   * ESTRAI PDF CON FILEREADER (FALLBACK)
   */
  private async extractPDFWithFileReader(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          console.log('📖 FileReader risultato (primi 200 char):', text.substring(0, 200));
          
          // Cerca pattern di testo nel contenuto binario
          const textMatches = text.match(/\(([^)]+)\)/g);
          let extractedText = '';
          
          if (textMatches && textMatches.length > 0) {
            extractedText = textMatches
              .join(' ')
              .replace(/[^\x20-\x7E\nàèéìòù]/g, ' ') // Mantieni caratteri italiani
              .replace(/\s+/g, ' ')
              .trim();
          } else {
            // Prova estrazione più aggressiva
            extractedText = text
              .replace(/[^\x20-\x7E\nàèéìòù]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }

          resolve(extractedText);

        } catch (error) {
          reject(new Error(`Errore FileReader: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * ESTRAI TESTO DA IMMAGINI (OCR)
   */
  private async extractImageText(file: File): Promise<string> {
    console.log('🖼️ Estrazione testo immagine...');

    try {
      // Per ora, fallback a messaggio
      // TODO: Implementare Tesseract.js
      throw new Error('OCR non ancora implementato. Prova con un PDF o inserisci manualmente.');
      
      // Codice per Tesseract.js (quando implementato):
      /*
      const worker = await Tesseract.createWorker({
        logger: m => console.log(m)
      });
      
      await worker.loadLanguage('ita+eng');
      await worker.initialize('ita+eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // PSM 6: Uniform block of text
        tessedit_ocr_engine_mode: '1', // OEM 1: LSTM OCR Engine
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àèéìòùÀÈÉÌÒÙ .,;:()-/',
        preserve_interword_spaces: '1',
      });
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      return text;
      */

    } catch (error) {
      console.error('❌ Errore estrazione immagine:', error);
      throw error;
    }
  }

  /**
   * ESTRAI TESTO DA FILE DI TESTO
   */
  private async extractTextFile(file: File): Promise<string> {
    console.log('📝 Estrazione testo file...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          console.log('📖 Testo letto (primi 200 char):', text.substring(0, 200));
          resolve(text);

        } catch (error) {
          reject(new Error(`Errore lettura testo: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file di testo'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * OTTIENI METODO DI ESTRAZIONE
   */
  private getExtractionMethod(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return typeof window !== 'undefined' && (window as any).pdfjsLib ? 'pdfjs' : 'filereader';
      case 'image':
        return 'tesseract';
      case 'text':
        return 'filereader';
      default:
        return 'unknown';
    }
  }
}

// ===== EXPORT =====

export default new FileProcessor();
