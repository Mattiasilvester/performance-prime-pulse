// ===== PARSER SCHEDA ALLENAMENTO SICURO =====

import SafeTextExtractor, { SafeTextResult } from './SafeTextExtractor';

export interface ParsedEsercizio {
  nome: string;
  serie: number | null;
  ripetizioni_durata: string;
  riposo: string | null;
  note: string | null;
  confidence: number;
}

export interface ParsedScheda {
  riscaldamento: ParsedEsercizio[];
  giorno: string;
  esercizi: ParsedEsercizio[];
  stretching: ParsedEsercizio[];
  metadata: {
    fonte: string;
    confidenzaMedia: number;
    warning: string[];
    sezioniRilevate: string[];
  };
}

export class SchedaParser {
  private patterns = {
    // Pattern principali per esercizi
    esercizio: [
      // "Nome: 3x12" o "Nome 3x12"
      /^(.+?):?\s+(\d+)[x×](\d+(?:-\d+)?)\s*(.*)$/i,
      // "Nome: 3x30 sec" o "Nome 3x30 secondi"
      /^(.+?):?\s+(\d+)[x×](\d+)\s*(sec|secondi|min|minuti)\s*(.*)$/i,
      // "Nome: 3x max reps"
      /^(.+?):?\s+(\d+)[x×]\s*max\s+reps?\s*(.*)$/i,
      // "Nome: 3x tempo" (senza specificare unità)
      /^(.+?):?\s+(\d+)[x×](\d+)\s*(.*)$/i,
    ],
    
    // Pattern per riposo
    riposo: [
      /riposo\s*(\d+)\s*(sec|secondi|min|minuti)/i,
      /(\d+)\s*(sec|secondi|min|minuti)\s*riposo/i,
    ],
    
    // Pattern per note
    note: [
      /\((.*?)\)/, // Note tra parentesi
      /\[(.*?)\]/, // Note tra parentesi quadre
      /note:\s*(.*)/i, // Note esplicite
    ]
  };

  constructor() {
    console.log('🧠 SchedaParser inizializzato');
  }

  /**
   * PUNTO DI INGRESSO PRINCIPALE
   */
  async parseScheda(file: File): Promise<ParsedScheda> {
    console.log('📋 === INIZIO PARSING SCHEDA ===');
    
    try {
      // STEP 1: Estrazione testo sicura
      const safeTextResult = await SafeTextExtractor.extractSafeText(file);
      
      console.log('✅ Testo estratto sicuramente');
      console.log('📊 Confidenza:', safeTextResult.metadata.confidence);
      console.log('⚠️ Warning:', safeTextResult.metadata.warnings);
      
      // STEP 2: Gestione giorni multipli
      if (safeTextResult.metadata.hasMultipleDays) {
        console.log('📅 Giorni multipli rilevati:', safeTextResult.metadata.detectedDays);
        // TODO: Implementare selezione giorno
        // Per ora usa il primo giorno
      }
      
      // STEP 3: Parsing sezioni
      const parsedScheda = this.parseSections(safeTextResult);
      
      // STEP 4: Validazione e completamento
      const finalScheda = this.validateAndComplete(parsedScheda, safeTextResult);
      
      console.log('✅ === PARSING SCHEDA COMPLETATO ===');
      console.log('📊 Esercizi trovati:', finalScheda.esercizi.length);
      console.log('🔥 Riscaldamento:', finalScheda.riscaldamento.length);
      console.log('🧘 Stretching:', finalScheda.stretching.length);
      
      return finalScheda;
      
    } catch (error) {
      console.error('❌ Errore parsing scheda:', error);
      throw error;
    }
  }

  /**
   * PARSING SEZIONI
   */
  private parseSections(safeTextResult: SafeTextResult): ParsedScheda {
    console.log('🔍 Parsing sezioni...');
    
    const parsedScheda: ParsedScheda = {
      riscaldamento: [],
      giorno: 'Giorno 1',
      esercizi: [],
      stretching: [],
      metadata: {
        fonte: 'File caricato',
        confidenzaMedia: safeTextResult.metadata.confidence,
        warning: safeTextResult.metadata.warnings,
        sezioniRilevate: []
      }
    };

    // Parsing riscaldamento
    if (safeTextResult.sections.riscaldamento?.length > 0) {
      parsedScheda.riscaldamento = this.parseEsercizi(safeTextResult.sections.riscaldamento);
      parsedScheda.metadata.sezioniRilevate.push('riscaldamento');
    }

    // Parsing scheda giornaliera
    if (safeTextResult.sections.schedaGiornaliera?.length > 0) {
      parsedScheda.esercizi = this.parseEsercizi(safeTextResult.sections.schedaGiornaliera);
      parsedScheda.metadata.sezioniRilevate.push('scheda_giornaliera');
    }

    // Parsing stretching
    if (safeTextResult.sections.stretching?.length > 0) {
      parsedScheda.stretching = this.parseEsercizi(safeTextResult.sections.stretching);
      parsedScheda.metadata.sezioniRilevate.push('stretching');
    }

    return parsedScheda;
  }

  /**
   * PARSING ESERCIZI
   */
  private parseEsercizi(lines: string[]): ParsedEsercizio[] {
    console.log('💪 Parsing esercizi...');
    
    const esercizi: ParsedEsercizio[] = [];
    
    for (const line of lines) {
      const esercizio = this.parseEsercizio(line);
      if (esercizio) {
        esercizi.push(esercizio);
        console.log(`  ✅ Trovato: ${esercizio.nome} - ${esercizio.serie}x${esercizio.ripetizioni_durata}`);
      }
    }
    
    return esercizi;
  }

  /**
   * PARSING SINGOLO ESERCIZIO
   */
  private parseEsercizio(line: string): ParsedEsercizio | null {
    const lineTrim = line.trim();
    
    // Skip righe vuote o troppo corte
    if (!lineTrim || lineTrim.length < 3) return null;
    
    // Prova tutti i pattern
    for (const pattern of this.patterns.esercizio) {
      const match = lineTrim.match(pattern);
      if (match) {
        const nome = this.cleanNomeEsercizio(match[1]);
        const serie = parseInt(match[2]);
        const ripetizioni = match[3];
        const note = match[4] || null;
        
        // Estrai riposo e note
        const riposo = this.extractRiposo(lineTrim);
        const noteFinali = this.extractNote(lineTrim) || note;
        
        // Calcola confidenza
        const confidence = this.calculateEsercizioConfidence(lineTrim, nome);
        
        return {
          nome,
          serie,
          ripetizioni_durata: ripetizioni,
          riposo,
          note: noteFinali,
          confidence
        };
      }
    }
    
    // Fallback: considera come nome esercizio senza dettagli
    if (this.isValidNome(lineTrim)) {
      return {
        nome: this.cleanNomeEsercizio(lineTrim),
        serie: null,
        ripetizioni_durata: 'non specificato',
        riposo: null,
        note: 'Dettagli non specificati',
        confidence: 0.3
      };
    }
    
    return null;
  }

  /**
   * PULISCI NOME ESERCIZIO
   */
  private cleanNomeEsercizio(nome: string): string {
    return nome
      .trim()
      .replace(/^\d+\.\s*/, '') // Rimuovi numerazione
      .replace(/^[-•]\s*/, '') // Rimuovi bullet points
      .replace(/\s+/g, ' ') // Normalizza spazi
      .trim();
  }

  /**
   * VALIDA NOME ESERCIZIO
   */
  private isValidNome(nome: string): boolean {
    if (!nome || nome.length < 3) return false;
    
    // Deve contenere almeno 3 lettere
    const letters = nome.match(/[a-zA-ZÀ-ù]/g);
    if (!letters || letters.length < 3) return false;
    
    // Non deve essere solo numeri o simboli
    if (/^[\d\s\-\.]+$/.test(nome)) return false;
    
    return true;
  }

  /**
   * ESTRAI RIPOSO
   */
  private extractRiposo(line: string): string | null {
    for (const pattern of this.patterns.riposo) {
      const match = line.match(pattern);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
    return null;
  }

  /**
   * ESTRAI NOTE
   */
  private extractNote(line: string): string | null {
    for (const pattern of this.patterns.note) {
      const match = line.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * CALCOLA CONFIDENZA ESERCIZIO
   */
  private calculateEsercizioConfidence(line: string, nome: string): number {
    let confidence = 0.5; // Base
    
    // Nome valido
    if (nome.length > 3) confidence += 0.2;
    
    // Pattern riconosciuto
    if (line.match(/\d+[x×]\d+/)) confidence += 0.3;
    
    // Presenza di note
    if (line.match(/[\(\[\]]/)) confidence += 0.1;
    
    // Presenza di riposo
    if (line.match(/riposo/i)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * VALIDAZIONE E COMPLETAMENTO
   */
  private validateAndComplete(parsedScheda: ParsedScheda, safeTextResult: SafeTextResult): ParsedScheda {
    console.log('✅ Validazione e completamento...');
    
    // Se non ci sono esercizi, aggiungi warning
    if (parsedScheda.esercizi.length === 0) {
      parsedScheda.metadata.warning.push('Nessun esercizio trovato nella scheda');
    }
    
    // Se non c'è riscaldamento, suggeriscilo
    if (parsedScheda.riscaldamento.length === 0) {
      parsedScheda.riscaldamento = this.suggestRiscaldamento(parsedScheda.esercizi);
      parsedScheda.metadata.warning.push('Riscaldamento non trovato - aggiunto automaticamente');
    }
    
    // Se non c'è stretching, suggeriscilo
    if (parsedScheda.stretching.length === 0) {
      parsedScheda.stretching = this.suggestStretching(parsedScheda.esercizi);
      parsedScheda.metadata.warning.push('Stretching non trovato - aggiunto automaticamente');
    }
    
    // Aggiorna confidenza media
    const allEsercizi = [
      ...parsedScheda.riscaldamento,
      ...parsedScheda.esercizi,
      ...parsedScheda.stretching
    ];
    
    if (allEsercizi.length > 0) {
      const avgConfidence = allEsercizi.reduce((sum, e) => sum + e.confidence, 0) / allEsercizi.length;
      parsedScheda.metadata.confidenzaMedia = avgConfidence;
    }
    
    return parsedScheda;
  }

  /**
   * SUGGERISCI RISCALDAMENTO
   */
  private suggestRiscaldamento(esercizi: ParsedEsercizio[]): ParsedEsercizio[] {
    const riscaldamento: ParsedEsercizio[] = [
      {
        nome: 'Mobilità articolare generale',
        serie: 1,
        ripetizioni_durata: '5 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      },
      {
        nome: 'Cardio leggero',
        serie: 1,
        ripetizioni_durata: '5 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      }
    ];
    
    // Aggiungi riscaldamento specifico per gli esercizi trovati
    const hasSquat = esercizi.some(e => e.nome.toLowerCase().includes('squat'));
    const hasPanca = esercizi.some(e => e.nome.toLowerCase().includes('panca'));
    const hasStacco = esercizi.some(e => e.nome.toLowerCase().includes('stacco'));
    
    if (hasSquat || hasPanca || hasStacco) {
      riscaldamento.push({
        nome: 'Mobilità spalle e schiena',
        serie: 1,
        ripetizioni_durata: '3 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      });
    }
    
    return riscaldamento;
  }

  /**
   * SUGGERISCI STRETCHING
   */
  private suggestStretching(esercizi: ParsedEsercizio[]): ParsedEsercizio[] {
    const stretching: ParsedEsercizio[] = [
      {
        nome: 'Stretching generale',
        serie: 1,
        ripetizioni_durata: '5 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      }
    ];
    
    // Aggiungi stretching specifico
    const hasUpperBody = esercizi.some(e => 
      e.nome.toLowerCase().includes('panca') || 
      e.nome.toLowerCase().includes('rematore') ||
      e.nome.toLowerCase().includes('trazioni')
    );
    
    const hasLowerBody = esercizi.some(e => 
      e.nome.toLowerCase().includes('squat') || 
      e.nome.toLowerCase().includes('stacco') ||
      e.nome.toLowerCase().includes('leg')
    );
    
    if (hasUpperBody) {
      stretching.push({
        nome: 'Stretching spalle e braccia',
        serie: 1,
        ripetizioni_durata: '3 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      });
    }
    
    if (hasLowerBody) {
      stretching.push({
        nome: 'Stretching gambe e schiena',
        serie: 1,
        ripetizioni_durata: '3 min',
        riposo: null,
        note: 'Aggiunto automaticamente',
        confidence: 0.1
      });
    }
    
    return stretching;
  }

  /**
   * DEBUG PATTERNS
   */
  debugPatterns(text: string): void {
    console.log('🔍 Debug patterns per:', text.substring(0, 100));
    
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`Riga: "${line}"`);
        for (const pattern of this.patterns.esercizio) {
          const match = line.match(pattern);
          if (match) {
            console.log(`  ✅ Match:`, match);
          }
        }
      }
    }
  }
}

// ===== EXPORT =====

export default new SchedaParser();
