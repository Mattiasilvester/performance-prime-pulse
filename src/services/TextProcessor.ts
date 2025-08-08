// ===== SISTEMA COMPLETO DI PROCESSAMENTO TESTO =====

export interface TextProcessingResult {
  cleanText: string;
  pages: Array<{
    text: string;
    confidence: number;
    pageNumber: number;
  }>;
  fixes: {
    unicode: number;
    typography: number;
    hyphenation: number;
    ocr: number;
    total: number;
  };
  metadata: {
    engine: 'pdfjs' | 'tesseract' | 'filereader';
    languages: string[];
    totalPages: number;
    anomalies: string[];
  };
}

export interface OCRFallbackResult {
  text: string;
  confidence: number;
  engine: 'tesseract';
  languages: string[];
}

export class TextProcessor {
  private debug = true;

  /**
   * PUNTO DI INGRESSO PRINCIPALE
   */
  async processText(rawText: string, fileType: string): Promise<TextProcessingResult> {
    console.log('🧹 === INIZIO PROCESSING TESTO ===');
    console.log('📝 Testo grezzo (primi 200 char):', rawText.substring(0, 200));

    try {
      // STEP 1: Normalizzazione Unicode
      let normalizedText = this.normalizeUnicode(rawText);
      
      // STEP 2: Fix tipografici e simboli
      normalizedText = this.fixTypography(normalizedText);
      
      // STEP 3: Ricostruzione righe e sillabazioni
      normalizedText = this.mergeHyphenation(normalizedText);
      
      // STEP 4: Correzioni OCR comuni
      normalizedText = this.fixOCRCommon(normalizedText);
      
      // STEP 5: Validazione finale
      const validation = this.validateProcessedText(normalizedText);
      
      if (!validation.isValid) {
        console.warn('⚠️ Anomalie rilevate:', validation.anomalies);
      }

      // STEP 6: Prepara risultato
      const result: TextProcessingResult = {
        cleanText: normalizedText,
        pages: [{
          text: normalizedText,
          confidence: validation.confidence,
          pageNumber: 1
        }],
        fixes: {
          unicode: 0, // TODO: Conta sostituzioni
          typography: 0,
          hyphenation: 0,
          ocr: 0,
          total: 0
        },
        metadata: {
          engine: 'pdfjs' as const,
          languages: ['ita', 'eng'],
          totalPages: 1,
          anomalies: validation.anomalies
        }
      };

      console.log('✅ === PROCESSING TESTO COMPLETATO ===');
      console.log('📊 Confidenza:', validation.confidence);
      console.log('⚠️ Anomalie:', validation.anomalies);

      return result;

    } catch (error) {
      console.error('❌ Errore processing testo:', error);
      throw error;
    }
  }

  /**
   * NORMALIZZAZIONE UNICODE
   */
  private normalizeUnicode(text: string): string {
    console.log('🔄 Normalizzazione Unicode...');
    
    return text
      // Normalizzazione Unicode NFKC
      .normalize('NFKC')
      // Sostituzioni Unicode comuni
      .replace(/\u00A0/g, ' ') // Non-breaking space → spazio normale
      .replace(/\u00AD/g, '') // Soft hyphen → rimuovi
      .replace(/\u200B/g, '') // Zero-width space → rimuovi
      .replace(/\u200C/g, '') // Zero-width non-joiner → rimuovi
      .replace(/\u200D/g, '') // Zero-width joiner → rimuovi
      .replace(/\uFEFF/g, '') // Byte order mark → rimuovi
      .replace(/\uFFFD/g, '?'); // Replacement character → ?
  }

  /**
   * FIX TIPOGRAFICI E SIMBOLI
   */
  private fixTypography(text: string): string {
    console.log('🔧 Fix tipografici...');
    
    return text
      // Trattini e linee
      .replace(/[–—]/g, '-') // En dash, em dash → trattino normale
      .replace(/×/g, 'x') // Simbolo moltiplicazione → x
      .replace(/[×]/g, 'x') // Altri simboli moltiplicazione
      
      // Virgolette e apostrofi
      .replace(/[''`]/g, "'") // Vari tipi di apostrofi → apostrofo normale
      .replace(/[""`]/g, '"') // Vari tipi di virgolette → virgolette normali
      
      // Punti di sospensione
      .replace(/…/g, '...') // Punti di sospensione → tre punti
      
      // Legature tipografiche
      .replace(/ﬀ/g, 'ff') // ff ligature
      .replace(/ﬁ/g, 'fi') // fi ligature
      .replace(/ﬂ/g, 'fl') // fl ligatures
      .replace(/ﬃ/g, 'ffi') // ffi ligatures
      .replace(/ﬄ/g, 'ffl') // ffl ligatures
      
      // Simboli matematici
      .replace(/±/g, '+/-') // Plus-minus → +/-
      .replace(/≤/g, '<=') // Less than or equal → <=
      .replace(/≥/g, '>=') // Greater than or equal → >=
      
      // Simboli di misura
      .replace(/°([A-Za-z])/g, '° $1') // Gradi con lettera → aggiungi spazio
      .replace(/(\d)°([A-Za-z])/g, '$1° $2'); // Numero + gradi + lettera
  }

  /**
   * RICOSTRUZIONE RIGHE E SILLABAZIONI
   */
  private mergeHyphenation(text: string): string {
    console.log('🔗 Ricostruzione sillabazioni...');
    
    return text
      // Unisci sillabazioni a fine riga
      .replace(/([A-Za-zÀ-ù])-\n([a-zà-ù])/g, '$1$2')
      .replace(/([A-Za-zÀ-ù])-\s*\n\s*([a-zà-ù])/g, '$1$2')
      
      // Mantieni paragrafi: riga vuota = separatore sezione
      .replace(/\n\s*\n/g, '\n\n') // Normalizza righe vuote multiple
      
      // Sostituisci singolo \n con spazio (ma mantieni paragrafi)
      .replace(/([^\n])\n(?!\n)/g, '$1 ')
      
      // Pulisci spazi multipli
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * CORREZIONI OCR COMUNI
   */
  private fixOCRCommon(text: string): string {
    console.log('🔍 Correzioni OCR comuni...');
    
    return text
      // Correzione numeri in contesto di esercizi
      .replace(/(\d+)x(\d+)/g, (match, num1, num2) => {
        // Correggi solo se sembra un esercizio
        const before = text.substring(0, text.indexOf(match));
        const after = text.substring(text.indexOf(match) + match.length);
        
        // Se c'è testo prima o dopo, probabilmente è un esercizio
        if (before.trim() || after.trim()) {
          return `${num1}x${num2}`;
        }
        return match;
      })
      
      // Correzione caratteri OCR comuni (solo in contesto numerico)
      .replace(/(\d+)O(\d+)/g, '$10$2') // O → 0 in contesto numerico
      .replace(/(\d+)l(\d+)/g, '$11$2') // l → 1 in contesto numerico
      .replace(/(\d+)S(\d+)/g, '$15$2') // S → 5 in contesto numerico
      .replace(/(\d+)B(\d+)/g, '$18$2') // B → 8 in contesto numerico
      
      // Normalizza unità di tempo
      .replace(/\b(\d+)\s*(minuti?|min|mins?)\b/gi, '$1 min')
      .replace(/\b(\d+)\s*(secondi?|sec|s)\b/gi, '$1 sec')
      
      // Normalizza unità di peso
      .replace(/\b(\d+)\s*(kg|chili?)\b/gi, '$1 kg')
      .replace(/\b(\d+)\s*(lb|lbs?|pounds?)\b/gi, '$1 lb')
      
      // Normalizza percentuali
      .replace(/(\d+)°/g, '$1%') // Gradi → percentuale
      .replace(/(\d+)per\s*cento/gi, '$1%') // "per cento" → %
      
      // Correggi spazi attorno ai simboli
      .replace(/(\d+)x(\d+)/g, '$1 x $2') // Aggiungi spazi attorno a x
      .replace(/(\d+)\s*x\s*(\d+)/g, '$1x$2'); // Rimuovi spazi extra
  }

  /**
   * VALIDAZIONE TESTO PROCESSATO
   */
  private validateProcessedText(text: string): {
    isValid: boolean;
    confidence: number;
    anomalies: string[];
  } {
    const anomalies: string[] = [];
    let confidence = 100;

    // Controlla caratteri anomali
    const anomalousChars = text.match(/[^\w\s\-.,;:()/'%àèéìòùÀÈÉÌÒÙ]/g);
    if (anomalousChars) {
      const anomalyPercentage = (anomalousChars.length / text.length) * 100;
      if (anomalyPercentage > 1) {
        anomalies.push(`ANOMALIA_CHARSET: ${anomalyPercentage.toFixed(2)}% caratteri anomali`);
        confidence -= anomalyPercentage * 10;
      }
    }

    // Controlla caratteri di sostituzione
    const replacementChars = text.match(//g);
    if (replacementChars) {
      anomalies.push(`REPLACEMENT_CHARS: ${replacementChars.length} caratteri di sostituzione`);
      confidence -= replacementChars.length * 5;
    }

    // Controlla se sembra una scheda di allenamento
    const workoutKeywords = ['squat', 'panca', 'stacco', 'rematore', 'trazioni', 'push', 'pull'];
    const hasWorkoutContent = workoutKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (!hasWorkoutContent) {
      anomalies.push('NO_WORKOUT_CONTENT: Il testo non sembra contenere esercizi comuni');
      confidence -= 20;
    }

    // Controlla pattern di esercizi
    const exercisePatterns = text.match(/\d+x\d+/g);
    if (!exercisePatterns || exercisePatterns.length < 2) {
      anomalies.push('NO_EXERCISE_PATTERNS: Pochi pattern di esercizi trovati');
      confidence -= 15;
    }

    // Controlla lunghezza minima
    if (text.length < 50) {
      anomalies.push('TEXT_TOO_SHORT: Il testo è troppo corto');
      confidence -= 30;
    }

    confidence = Math.max(confidence, 0);

    return {
      isValid: confidence > 50,
      confidence,
      anomalies
    };
  }

  /**
   * FALLBACK OCR (quando il testo nativo non funziona)
   */
  async performOCRFallback(imageFile: File): Promise<OCRFallbackResult> {
    console.log('🖼️ Avvio OCR fallback...');
    
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
      
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      
      // Processa il testo OCR
      const processedText = await this.processText(text, 'image');
      
      return {
        text: processedText.cleanText,
        confidence: processedText.pages[0]?.confidence || 70,
        engine: 'tesseract',
        languages: ['ita', 'eng']
      };
      */

    } catch (error) {
      console.error('❌ Errore OCR:', error);
      throw error;
    }
  }

  /**
   * DETECTA SE SERVE OCR FALLBACK
   */
  shouldUseOCRFallback(text: string): boolean {
    // Controlla caratteri anomali > 3%
    const anomalousChars = text.match(/[^\w\s\-.,;:()/'%àèéìòùÀÈÉÌÒÙ]/g);
    if (anomalousChars) {
      const anomalyPercentage = (anomalousChars.length / text.length) * 100;
      if (anomalyPercentage > 3) {
        console.log(`⚠️ Anomalia rilevata: ${anomalyPercentage.toFixed(2)}% caratteri anomali`);
        return true;
      }
    }

    // Controlla caratteri di sostituzione
    const replacementChars = text.match(//g);
    if (replacementChars && replacementChars.length > 0) {
      console.log(`⚠️ Caratteri di sostituzione rilevati: ${replacementChars.length}`);
      return true;
    }

    // Controlla se il testo è troppo corto
    if (text.length < 20) {
      console.log('⚠️ Testo troppo corto, potrebbe essere un problema di estrazione');
      return true;
    }

    return false;
  }

  /**
   * UTILITY: NORMALIZZA TESTO (funzione standalone)
   */
  static normalizeText(raw: string): string {
    return raw
      .normalize('NFKC')
      .replace(/\u00A0/g, ' ')
      .replace(/\u00AD/g, '')
      .replace(/[–—]/g, '-')
      .replace(/×/g, 'x')
      .replace(/[''`]/g, "'")
      .replace(/…/g, '...')
      .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl');
  }

  /**
   * UTILITY: UNISCI SILLABAZIONI (funzione standalone)
   */
  static mergeHyphenation(s: string): string {
    // Unisci parole spezzate a fine riga
    s = s.replace(/([A-Za-zÀ-ù])-\n([a-zà-ù])/g, '$1$2');
    // Riga singola → spazio; riga vuota → paragrafo
    s = s.replace(/([^\n])\n(?!\n)/g, '$1 ');
    return s;
  }
}

// ===== EXPORT =====

export default new TextProcessor();
