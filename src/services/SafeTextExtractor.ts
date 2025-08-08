// ===== SISTEMA SICURO DI ESTRAZIONE TESTO =====

export interface SafeTextResult {
  cleanText: string;
  sections: {
    riscaldamento?: string[];
    schedaGiornaliera: string[];
    stretching?: string[];
  };
  metadata: {
    hasMultipleDays: boolean;
    detectedDays: string[];
    extractionMethod: 'ocr' | 'structured' | 'fallback';
    confidence: number;
    warnings: string[];
  };
}

export class SafeTextExtractor {
  private debug = true;

  /**
   * ESTRAZIONE TESTO SICURA
   */
  async extractSafeText(file: File): Promise<SafeTextResult> {
    console.log('🛡️ === ESTRAZIONE TESTO SICURA ===');
    
    try {
      // STEP 1: Estrazione grezza
      const rawText = await this.extractRawText(file);
      
      // STEP 2: Pulizia aggressiva di contenuti binari
      const cleanedText = this.cleanBinaryContent(rawText);
      
      // STEP 3: Rilevamento sezioni
      const sections = this.detectSections(cleanedText);
      
      // STEP 4: Validazione finale
      const validation = this.validateExtractedText(cleanedText);
      
      return {
        cleanText: cleanedText,
        sections,
        metadata: {
          hasMultipleDays: sections.detectedDays?.length > 1,
          detectedDays: sections.detectedDays || [],
          extractionMethod: validation.extractionMethod,
          confidence: validation.confidence,
          warnings: validation.warnings
        }
      };

    } catch (error) {
      console.error('❌ Errore estrazione sicura:', error);
      throw error;
    }
  }

  /**
   * ESTRAZIONE TESTO GREZZO
   */
  private async extractRawText(file: File): Promise<string> {
    const fileType = this.detectFileType(file);
    
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
   * PULIZIA AGGRESSIVA CONTENUTI BINARI
   */
  private cleanBinaryContent(text: string): string {
    console.log('🧹 Pulizia contenuti binari...');
    
    return text
      // Rimuovi metadati PDF
      .replace(/\/[A-Za-z]+\s+[^\n]+/g, '') // /BaseFont, /Encoding, etc.
      .replace(/endobj\s*\d+/g, '') // endobj
      .replace(/obj\s*\d+\s*\d+/g, '') // obj
      .replace(/stream[\s\S]*?endstream/g, '') // stream content
      .replace(/xref[\s\S]*?trailer/g, '') // xref section
      .replace(/trailer[\s\S]*?startxref/g, '') // trailer
      .replace(/startxref\s*\d+/g, '') // startxref
      .replace(/%%EOF/g, '') // EOF
      
      // Rimuovi caratteri di controllo
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      
      // Rimuovi sequenze binarie comuni
      .replace(/[^\x20-\x7E\nàèéìòùÀÈÉÌÒÙ]/g, ' ')
      
      // Rimuovi righe con solo simboli tecnici
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Rimuovi righe con solo simboli tecnici
        const technicalPatterns = [
          /^\/[A-Za-z]+/, // /BaseFont, /Encoding, etc.
          /^obj\s*\d+/, // obj
          /^endobj/, // endobj
          /^stream/, // stream
          /^endstream/, // endstream
          /^xref/, // xref
          /^trailer/, // trailer
          /^startxref/, // startxref
          /^%%/, // Comments
          /^\d+\s+\d+\s+obj/, // Object references
          /^[0-9a-fA-F]{32,}/, // Long hex strings
          /^[^\w\sàèéìòùÀÈÉÌÒÙ]{10,}/, // Long sequences of symbols
        ];
        
        return !technicalPatterns.some(pattern => pattern.test(trimmed));
      })
      .join('\n')
      
      // Normalizza spazi
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * RILEVAMENTO SEZIONI
   */
  private detectSections(text: string): any {
    console.log('🔍 Rilevamento sezioni...');
    
    const lines = text.split('\n').filter(line => line.trim());
    const sections = {
      riscaldamento: [] as string[],
      schedaGiornaliera: [] as string[],
      stretching: [] as string[],
      detectedDays: [] as string[]
    };
    
    let currentSection = 'schedaGiornaliera';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Rileva sezioni
      if (this.isRiscaldamentoSection(trimmed)) {
        currentSection = 'riscaldamento';
        continue;
      }
      
      if (this.isStretchingSection(trimmed)) {
        currentSection = 'stretching';
        continue;
      }
      
      if (this.isDaySection(trimmed)) {
        sections.detectedDays.push(trimmed);
        currentSection = 'schedaGiornaliera';
        continue;
      }
      
      // Aggiungi alla sezione corrente se sembra un esercizio
      if (this.looksLikeExercise(trimmed)) {
        sections[currentSection].push(trimmed);
      }
    }
    
    return sections;
  }

  /**
   * VALIDAZIONE TESTO ESTRATTO
   */
  private validateExtractedText(text: string): {
    extractionMethod: 'ocr' | 'structured' | 'fallback';
    confidence: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let confidence = 100;
    let extractionMethod: 'ocr' | 'structured' | 'fallback' = 'structured';

    // Controlla se sembra testo reale
    const hasRealText = text.match(/[a-zA-ZÀ-ù]{3,}/g);
    if (!hasRealText || hasRealText.length < 3) {
      warnings.push('Poco testo leggibile trovato');
      confidence -= 40;
      extractionMethod = 'fallback';
    }

    // Controlla pattern di esercizi
    const exercisePatterns = text.match(/\d+[x×]\d+/g);
    if (!exercisePatterns || exercisePatterns.length < 2) {
      warnings.push('Pochi pattern di esercizi trovati');
      confidence -= 20;
    }

    // Controlla caratteri anomali
    const anomalousChars = text.match(/[^\w\s\-.,;:()/'àèéìòùÀÈÉÌÒÙ]/g);
    if (anomalousChars) {
      const anomalyPercentage = (anomalousChars.length / text.length) * 100;
      if (anomalyPercentage > 5) {
        warnings.push(`Alti caratteri anomali: ${anomalyPercentage.toFixed(1)}%`);
        confidence -= anomalyPercentage * 2;
        extractionMethod = 'ocr';
      }
    }

    confidence = Math.max(confidence, 0);

    return {
      extractionMethod,
      confidence,
      warnings
    };
  }

  /**
   * UTILITY: RILEVA TIPO FILE
   */
  private detectFileType(file: File): string {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf';
    if (mimeType.includes('image') || /\.(png|jpg|jpeg|gif|bmp|webp)$/.test(fileName)) return 'image';
    if (mimeType.includes('text') || fileName.endsWith('.txt')) return 'text';
    
    throw new Error('Tipo file non riconosciuto');
  }

  /**
   * ESTRAI TESTO DA PDF
   */
  private async extractPDFText(file: File): Promise<string> {
    console.log('📑 Estrazione PDF sicura...');
    
    try {
      // Usa pdf.js se disponibile
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        return await this.extractPDFWithPdfJS(file);
      }
      
      // Fallback a FileReader
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

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          console.log(`  📄 Processando pagina ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Ricostruisci testo mantenendo formattazione
          const pageText = this.reconstructTextFromContent(textContent);
          fullText += pageText + '\n';

        } catch (pageError) {
          console.warn(`⚠️ Errore pagina ${i}:`, pageError);
        }
      }

      return fullText;

    } catch (error) {
      console.error('❌ Errore pdf.js:', error);
      throw error;
    }
  }

  /**
   * RICOSTRUISCI TESTO DA CONTENUTO PDF
   */
  private reconstructTextFromContent(textContent: any): string {
    if (!textContent || !textContent.items) return '';

    let text = '';
    let lastY = -1;
    let line = '';

    textContent.items.forEach((item: any) => {
      // Se Y cambia significativamente, nuova riga
      if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
        text += line.trim() + '\n';
        line = '';
      }
      
      // Aggiungi spazio se necessario
      if (line && !line.endsWith(' ') && !item.str.startsWith(' ')) {
        line += ' ';
      }
      
      line += item.str;
      lastY = item.transform[5];
    });

    // Aggiungi ultima riga
    if (line) {
      text += line.trim();
    }

    return text;
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
          resolve(text);
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
   * ESTRAI TESTO DA IMMAGINI
   */
  private async extractImageText(file: File): Promise<string> {
    console.log('🖼️ Estrazione immagine...');
    
    // Per ora, fallback a messaggio
    // TODO: Implementare Tesseract.js
    throw new Error('OCR non ancora implementato. Prova con un PDF o inserisci manualmente.');
  }

  /**
   * ESTRAI TESTO DA FILE DI TESTO
   */
  private async extractTextFile(file: File): Promise<string> {
    console.log('📝 Estrazione file testo...');

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
   * UTILITY: RILEVA SEZIONI
   */
  private isRiscaldamentoSection(line: string): boolean {
    const patterns = [
      /^riscaldamento/i,
      /^warm.?up/i,
      /^preparazione/i,
      /^mobilità/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private isStretchingSection(line: string): boolean {
    const patterns = [
      /^stretching/i,
      /^allungamento/i,
      /^defaticamento/i,
      /^cool.?down/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private isDaySection(line: string): boolean {
    const patterns = [
      /^giorno\s*\d+/i,
      /^day\s*\d+/i,
      /^lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica/i,
      /^monday|tuesday|wednesday|thursday|friday|saturday|sunday/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private looksLikeExercise(line: string): boolean {
    // Pattern per esercizi
    const exercisePatterns = [
      /\d+[x×]\d+/, // 3x12
      /\d+\s*(min|sec|minuti|secondi)/i, // 30 sec
      /[a-zA-ZÀ-ù]{3,}/, // Almeno 3 lettere
    ];
    
    // Non deve essere solo simboli tecnici
    const technicalPatterns = [
      /^\/[A-Za-z]+/, // /BaseFont, etc.
      /^obj\s*\d+/, // obj
      /^endobj/, // endobj
      /^[0-9a-fA-F]{32,}/, // Long hex
    ];
    
    return exercisePatterns.some(pattern => pattern.test(line)) &&
           !technicalPatterns.some(pattern => pattern.test(line));
  }
}

// ===== EXPORT =====

export default new SafeTextExtractor();
