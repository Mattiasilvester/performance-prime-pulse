// ===== SISTEMA DI ESTRAZIONE E STRUTTURAZIONE SCHEDE ALLENAMENTO =====

// ===== TYPES E INTERFACES =====

export interface Esercizio {
  nome: string;        // OBBLIGATORIO - mai inventare, solo da file
  ripetute?: number;   
  ripetizioni?: string; // es. "8-10" o "12"
  durata?: string;     // solo per esercizi a tempo
  riposo?: string;     
  note?: string;       // es. "per gamba", "assistite"
  confidence?: number; // 0-1, quanto siamo sicuri dell'estrazione
}

export interface SchedaAllenamento {
  riscaldamento: {
    presente: boolean;
    esercizi: Esercizio[];
    generato?: boolean; // true se proposto dal sistema
  };
  schedaGiornaliera: {
    esercizi: Esercizio[];
  };
  stretching: {
    presente: boolean;
    esercizi: Esercizio[];
    generato?: boolean;
  };
  metadata: {
    fonte: string;
    tipoAllenamento?: string;
    durataStimata?: string;
    difficolta?: string;
  };
}

export interface GiornoAllenamento {
  nome: string;
  esercizi: Esercizio[];
  tipo: 'riscaldamento' | 'allenamento' | 'stretching';
}

// ===== CORE EXTRACTOR =====

export class WorkoutExtractor {
  private patterns = {
    // Pattern per esercizi
    esercizio: /^[\d\.\-\s]*([A-Za-zÀ-ÿ\s]+)[:|\-]/,
    serieXreps: /(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/,
    tempo: /(\d+)['"]|(\d+)\s*(sec|min|secondi|minuti)/i,
    riposo: /riposo:?\s*(\d+['"]?)/i,
    
    // Pattern per sezioni
    riscaldamento: /riscaldamento|warm[\s-]?up|mobilit[àa]|attivazione/i,
    stretching: /stretching|defaticamento|cool[\s-]?down|allungamento/i,
    giorno: /giorno\s*(\d+)|day\s*(\d+)|workout\s*(\d+)/i,
    giornoSettimana: /luned[ìi]|marted[ìi]|mercoled[ìi]|gioved[ìi]|venerd[ìi]|sabato|domenica/i
  };

  constructor() {
    this.debug = true;
  }

  /**
   * PUNTO DI INGRESSO PRINCIPALE
   */
  async processaFileAllenamento(file: File): Promise<SchedaAllenamento> {
    console.log('🚀 === INIZIO PROCESSING FILE ===');
    console.log('📄 File:', file.name);
    console.log('📦 Dimensione:', (file.size / 1024).toFixed(2), 'KB');

    try {
      // 1. Estrai testo dal file
      const testoGrezzo = await this.estraiTesto(file);
      
      if (!testoGrezzo || testoGrezzo.trim().length < 10) {
        throw new Error('Impossibile estrarre testo dal file. Verifica che il file contenga testo leggibile.');
      }

      console.log('📝 === TESTO ESTRATTO ===');
      console.log(testoGrezzo.substring(0, 500));
      console.log('📝 === FINE TESTO ===');

      // 2. Identifica struttura (giorni multipli?)
      const giorni = this.identificaGiorni(testoGrezzo);
      
      console.log(`📅 Giorni identificati: ${giorni.length}`);

      // 3. Se multipli giorni, richiedi selezione
      if (giorni.length > 1) {
        // Per ora, prendi il primo giorno
        // TODO: Implementare selezione interattiva
        console.log('⚠️ Multipli giorni trovati, usando il primo');
        return this.processaGiorno(giorni[0]);
      }

      // 4. Processa singolo giorno
      return this.processaGiorno(giorni[0] || { nome: 'Allenamento', esercizi: [], tipo: 'allenamento' });

    } catch (error) {
      console.error('❌ Errore durante il processing:', error);
      throw error;
    }
  }

  /**
   * ESTRAZIONE TESTO - Supporta PDF, immagini, testo
   */
  private async estraiTesto(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    try {
      // PDF
      if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
        return await this.estraiTestoPDF(file);
      }
      
      // Immagini
      if (fileType.includes('image') || /\.(png|jpg|jpeg|gif|bmp)$/.test(fileName)) {
        return await this.estraiTestoImmagine(file);
      }
      
      // Testo
      if (fileType.includes('text') || fileName.endsWith('.txt')) {
        return await this.estraiTestoFile(file);
      }

      throw new Error('Formato file non supportato');

    } catch (error) {
      console.error('Errore estrazione testo:', error);
      throw error;
    }
  }

  /**
   * Estrazione da PDF
   */
  private async estraiTestoPDF(file: File): Promise<string> {
    try {
      // Prova prima con pdf.js globale
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdfjsLib = (window as any).pdfjsLib;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        return fullText;
      }

      // Fallback: FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const textMatch = text.match(/\(([^)]+)\)/g);
          if (textMatch) {
            const extractedText = textMatch.join(' ').replace(/[^\x20-\x7E\n]/g, ' ');
            resolve(extractedText);
          } else {
            reject(new Error('Impossibile estrarre testo dal PDF'));
          }
        };
        reader.readAsText(file);
      });

    } catch (error) {
      console.error('Errore estrazione PDF:', error);
      throw new Error('Impossibile leggere il PDF. Verifica che contenga testo selezionabile.');
    }
  }

  /**
   * Estrazione da immagini (OCR)
   */
  private async estraiTestoImmagine(file: File): Promise<string> {
    try {
      // Per ora, fallback a messaggio
      // TODO: Implementare Tesseract.js
      throw new Error('OCR non ancora implementato. Prova con un PDF o inserisci manualmente.');
    } catch (error) {
      console.error('Errore OCR:', error);
      throw error;
    }
  }

  /**
   * Estrazione da file di testo
   */
  private async estraiTestoFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsText(file);
    });
  }

  /**
   * IDENTIFICA GIORNI nel testo
   */
  private identificaGiorni(testo: string): GiornoAllenamento[] {
    const righe = testo.split('\n').filter(r => r.trim());
    const giorni: GiornoAllenamento[] = [];
    
    let giornoCorrente: GiornoAllenamento | null = null;
    let esercizi: Esercizio[] = [];

    for (const riga of righe) {
      const rigaTrim = riga.trim();
      
      // Check se è un nuovo giorno
      if (this.patterns.giorno.test(rigaTrim) || this.patterns.giornoSettimana.test(rigaTrim)) {
        // Salva giorno precedente
        if (giornoCorrente && esercizi.length > 0) {
          giorni.push({ ...giornoCorrente, esercizi });
        }
        
        // Nuovo giorno
        giornoCorrente = {
          nome: rigaTrim,
          esercizi: [],
          tipo: 'allenamento'
        };
        esercizi = [];
        continue;
      }

      // Check se è riscaldamento/stretching
      if (this.patterns.riscaldamento.test(rigaTrim)) {
        if (giornoCorrente && esercizi.length > 0) {
          giorni.push({ ...giornoCorrente, esercizi });
        }
        giornoCorrente = { nome: 'Riscaldamento', esercizi: [], tipo: 'riscaldamento' };
        esercizi = [];
        continue;
      }

      if (this.patterns.stretching.test(rigaTrim)) {
        if (giornoCorrente && esercizi.length > 0) {
          giorni.push({ ...giornoCorrente, esercizi });
        }
        giornoCorrente = { nome: 'Stretching', esercizi: [], tipo: 'stretching' };
        esercizi = [];
        continue;
      }

      // Parsa esercizio
      const esercizio = this.parsaEsercizio(rigaTrim);
      if (esercizio) {
        esercizi.push(esercizio);
      }
    }

    // Salva ultimo giorno
    if (giornoCorrente && esercizi.length > 0) {
      giorni.push({ ...giornoCorrente, esercizi });
    }

    // Se non ci sono giorni espliciti, crea un giorno unico
    if (giorni.length === 0) {
      const esercizi = righe
        .map(riga => this.parsaEsercizio(riga.trim()))
        .filter(es => es !== null) as Esercizio[];
      
      if (esercizi.length > 0) {
        giorni.push({
          nome: 'Allenamento',
          esercizi,
          tipo: 'allenamento'
        });
      }
    }

    return giorni;
  }

  /**
   * PARSA SINGOLO ESERCIZIO - VINCOLI CRITICI
   */
  private parsaEsercizio(riga: string): Esercizio | null {
    // Skip righe vuote o header
    if (!riga || riga.match(/^(Serie|Reps|Esercizio|Exercise|Nome)$/i)) {
      return null;
    }

    // Pattern per esercizi con serie x reps
    const matchSerieReps = riga.match(/(.+?)\s+(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/);
    if (matchSerieReps) {
      const nome = this.pulisciNomeEsercizio(matchSerieReps[1]);
      const ripetute = parseInt(matchSerieReps[2]);
      const ripetizioni = matchSerieReps[3];
      
      // Estrai riposo se presente
      const riposoMatch = riga.match(/riposo:?\s*(\d+['"]?)/i);
      const riposo = riposoMatch ? riposoMatch[1] : undefined;
      
      // Estrai note
      const note = this.estraiNote(riga);

      return {
        nome,
        ripetute,
        ripetizioni,
        riposo,
        note,
        confidence: 0.95
      };
    }

    // Pattern per esercizi a tempo
    const matchTempo = riga.match(/(.+?)\s+(\d+)\s*(sec|min|secondi|minuti)/i);
    if (matchTempo) {
      const nome = this.pulisciNomeEsercizio(matchTempo[1]);
      const durata = `${matchTempo[2]} ${matchTempo[3]}`;
      
      return {
        nome,
        durata,
        confidence: 0.9
      };
    }

    // Fallback: solo nome esercizio (se sembra un esercizio)
    if (riga.length > 3 && riga.length < 100 && riga.match(/[a-zA-Z]/)) {
      // Non è solo numeri o simboli
      if (!riga.match(/^[\d\s\-\.]+$/)) {
        return {
          nome: this.pulisciNomeEsercizio(riga),
          confidence: 0.7
        };
      }
    }

    return null;
  }

  /**
   * PULISCI NOME ESERCIZIO
   */
  private pulisciNomeEsercizio(nome: string): string {
    return nome
      .replace(/^\d+\.?\s*/, '') // Rimuovi numeri iniziali
      .replace(/^[-•*]\s*/, '') // Rimuovi bullet points
      .replace(/\s+/g, ' ') // Normalizza spazi
      .trim();
  }

  /**
   * ESTRAI NOTE dall'esercizio
   */
  private estraiNote(riga: string): string | undefined {
    const patterns = [
      /\(([^)]+)\)/, // Tra parentesi
      /\[([^\]]+)\]/, // Tra quadre
      /nota?:\s*(.+)$/i, // Nota: ...
      /note?:\s*(.+)$/i // Note: ...
    ];

    for (const pattern of patterns) {
      const match = riga.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Note comuni
    if (riga.includes('per gamba')) return 'per gamba';
    if (riga.includes('each leg')) return 'each leg';
    if (riga.includes('per lato')) return 'per lato';
    if (riga.includes('each side')) return 'each side';

    return undefined;
  }

  /**
   * VALIDA ESERCIZIO - VINCOLI ASSOLUTI
   */
  private validaEsercizio(esercizio: Esercizio): Esercizio {
    if (!esercizio.nome) {
      throw new Error("Nome esercizio mancante");
    }

    // Se mancano info, mantieni vuoto (NON inventare)
    return {
      nome: esercizio.nome,
      ripetute: esercizio.ripetute || undefined,
      ripetizioni: esercizio.ripetizioni || undefined,
      riposo: esercizio.riposo || undefined,
      note: esercizio.note || undefined,
      confidence: esercizio.confidence || 0.5
    };
  }

  /**
   * PROCESSA SINGOLO GIORNO
   */
  private processaGiorno(giorno: GiornoAllenamento): SchedaAllenamento {
    console.log(`🔍 Processing giorno: ${giorno.nome}`);

    // Separa esercizi per tipo
    const riscaldamento = giorno.esercizi.filter(e => 
      e.nome.toLowerCase().includes('riscaldamento') ||
      e.nome.toLowerCase().includes('mobilità') ||
      e.nome.toLowerCase().includes('warm')
    );

    const stretching = giorno.esercizi.filter(e => 
      e.nome.toLowerCase().includes('stretch') ||
      e.nome.toLowerCase().includes('defaticamento') ||
      e.nome.toLowerCase().includes('cool')
    );

    const allenamento = giorno.esercizi.filter(e => 
      !riscaldamento.includes(e) && !stretching.includes(e)
    );

    // Genera riscaldamento se non presente
    let riscaldamentoGenerato = false;
    if (riscaldamento.length === 0 && allenamento.length > 0) {
      riscaldamento.push(...this.generaRiscaldamento(allenamento));
      riscaldamentoGenerato = true;
    }

    // Genera stretching se non presente
    let stretchingGenerato = false;
    if (stretching.length === 0 && allenamento.length > 0) {
      stretching.push(...this.generaStretching(allenamento));
      stretchingGenerato = true;
    }

    return {
      riscaldamento: {
        presente: riscaldamento.length > 0,
        esercizi: riscaldamento.map(e => this.validaEsercizio(e)),
        generato: riscaldamentoGenerato
      },
      schedaGiornaliera: {
        esercizi: allenamento.map(e => this.validaEsercizio(e))
      },
      stretching: {
        presente: stretching.length > 0,
        esercizi: stretching.map(e => this.validaEsercizio(e)),
        generato: stretchingGenerato
      },
      metadata: {
        fonte: giorno.nome,
        tipoAllenamento: this.analizzaTipoAllenamento(allenamento),
        durataStimata: this.stimaDurata(allenamento),
        difficolta: this.analizzaDifficolta(allenamento)
      }
    };
  }

  /**
   * GENERA RISCALDAMENTO - Solo se non presente
   */
  private generaRiscaldamento(esercizi: Esercizio[]): Esercizio[] {
    const tipoAllenamento = this.analizzaTipoAllenamento(esercizi);
    
    const riscaldamento: Esercizio[] = [
      {
        nome: "Mobilità articolare generale",
        durata: "5 min",
        confidence: 0.8
      }
    ];

    // Aggiungi riscaldamento specifico basato sul tipo
    if (tipoAllenamento.includes('gambe')) {
      riscaldamento.push({
        nome: "Squat a corpo libero",
        ripetute: 2,
        ripetizioni: "10",
        confidence: 0.8
      });
    }

    if (tipoAllenamento.includes('petto')) {
      riscaldamento.push({
        nome: "Push-up a corpo libero",
        ripetute: 2,
        ripetizioni: "8",
        confidence: 0.8
      });
    }

    return riscaldamento;
  }

  /**
   * GENERA STRETCHING - Solo se non presente
   */
  private generaStretching(esercizi: Esercizio[]): Esercizio[] {
    return [
      {
        nome: "Stretching generale",
        durata: "5 min",
        confidence: 0.8
      }
    ];
  }

  /**
   * ANALIZZA TIPO ALLENAMENTO
   */
  private analizzaTipoAllenamento(esercizi: Esercizio[]): string {
    const nomi = esercizi.map(e => e.nome.toLowerCase()).join(' ');
    
    if (nomi.includes('squat') || nomi.includes('stacco') || nomi.includes('gambe')) {
      return 'Gambe';
    }
    if (nomi.includes('panca') || nomi.includes('petto') || nomi.includes('push')) {
      return 'Petto';
    }
    if (nomi.includes('trazione') || nomi.includes('dorso') || nomi.includes('pull')) {
      return 'Dorso';
    }
    
    return 'Full Body';
  }

  /**
   * STIMA DURATA
   */
  private stimaDurata(esercizi: Esercizio[]): string {
    const totaleEsercizi = esercizi.length;
    const tempoPerEsercizio = 5; // minuti
    const tempoTotale = totaleEsercizi * tempoPerEsercizio;
    
    return `${tempoTotale} min`;
  }

  /**
   * ANALIZZA DIFFICOLTA'
   */
  private analizzaDifficolta(esercizi: Esercizio[]): string {
    const ripetute = esercizi.reduce((sum, e) => sum + (e.ripetute || 0), 0);
    
    if (ripetute > 20) return 'Avanzato';
    if (ripetute > 12) return 'Intermedio';
    return 'Principiante';
  }
}

// ===== EXPORT =====

export default new WorkoutExtractor();
