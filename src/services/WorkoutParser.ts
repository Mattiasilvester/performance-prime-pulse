/**
 * WorkoutParser - Parser sicuro per file di allenamento
 * Versione semplificata per browser (senza pdf-parse e tesseract.js)
 */

// Interfacce
export interface WorkoutExercise {
  nome: string;
  serie: number;
  ripetizioni_durata: string;
  riposo: string | null;
  note: string | null;
  origine: 'file' | 'suggerito';
  confidence: number;
}

export interface ParsedWorkoutResult {
  riscaldamento: WorkoutExercise[];
  giorno: number;
  esercizi: WorkoutExercise[];
  stretching: WorkoutExercise[];
}

/**
 * Parsing principale del file di allenamento
 */
export async function parseWorkoutFile(file: File): Promise<ParsedWorkoutResult> {
  
  try {
    // Estrazione testo dal file
    const text = await extractTextFromFile(file);
    
    // Pulizia del testo
    const cleanedText = cleanText(text);
    
    // Parsing della struttura
    const result = parseWorkoutStructure(cleanedText);
    
    return result;
  } catch (error) {
    console.error('❌ Errore parsing file:', error);
    throw new Error(`Errore durante il parsing del file: ${error}`);
  }
}

/**
 * Estrazione testo dal file (versione semplificata)
 */
async function extractTextFromFile(file: File): Promise<string> {
  
  // Per ora supporta solo file di testo
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }
  
  // Per altri tipi di file, restituisce un messaggio di errore
  throw new Error(`Tipo di file non supportato: ${file.type}. Per ora supportiamo solo file .txt`);
}

/**
 * Pulizia del testo rimuovendo contenuti binari e metadati
 */
function cleanText(text: string): string {
  // DEBUG: '🧹 Pulizia testo...');
  
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      
      // Rimuovi righe con meno di 3 caratteri utili
      if (trimmed.length < 3) return false;
      
      // Rimuovi righe con solo simboli tecnici
      const technicalPatterns = [
        /^\/[A-Za-z]+/i, // /BaseFont, etc.
        /^obj\s*\d+/i, // obj
        /^endobj/i, // endobj
        /^stream/i, // stream
        /^endstream/i, // endstream
        /^xref/i, // xref
        /^trailer/i, // trailer
        /^startxref/i, // startxref
        /^%%/i, // Comments
        /^\d+\s+\d+\s+obj/i, // Object references
        /^[0-9a-fA-F]{32,}/i, // Long hex strings
        /^[^\w\sàèéìòùÀÈÉÌÒÙ]{10,}/i, // Long sequences of symbols
      ];
      
      return !technicalPatterns.some(pattern => pattern.test(trimmed));
    })
    .map(line => normalizeUnicode(line))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizzazione Unicode e simboli
 */
function normalizeUnicode(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/×/g, 'x')
    .replace(/[–—]/g, '-')
    .replace(/[''`]/g, "'")
    .replace(/…/g, '...')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl');
}

/**
 * Parsing della struttura del workout
 */
function parseWorkoutStructure(text: string): ParsedWorkoutResult {
  
  const lines = text.split('\n').filter(line => line.trim());
  const result: ParsedWorkoutResult = {
    riscaldamento: [],
    giorno: 1,
    esercizi: [],
    stretching: []
  };
  
  let currentSection: 'riscaldamento' | 'esercizi' | 'stretching' = 'esercizi';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Rileva sezioni
    if (isSectionHeader(trimmed)) {
      currentSection = detectSection(trimmed);
      continue;
    }
    
    // Rileva giorno
    const dayMatch = trimmed.match(/giorno\s*(\d+)/i);
    if (dayMatch) {
      result.giorno = parseInt(dayMatch[1]);
      continue;
    }
    
    // Parsing esercizio
    const exercise = parseExercise(trimmed);
    if (exercise) {
      result[currentSection].push(exercise);
    }
  }
  
  // Aggiungi suggerimenti se mancanti
  if (result.riscaldamento.length === 0) {
    result.riscaldamento = suggestRiscaldamento(result.esercizi);
  }
  
  if (result.stretching.length === 0) {
    result.stretching = suggestStretching(result.esercizi);
  }
  
  return result;
}

/**
 * Rileva se una riga è un header di sezione
 */
function isSectionHeader(line: string): boolean {
  const sectionPatterns = [
    /riscaldamento/i,
    /warm.?up/i,
    /esercizi/i,
    /workout/i,
    /stretching/i,
    /defaticamento/i
  ];
  
  return sectionPatterns.some(pattern => pattern.test(line));
}

/**
 * Determina la sezione corrente
 */
function detectSection(line: string): 'riscaldamento' | 'esercizi' | 'stretching' {
  if (/riscaldamento|warm.?up/i.test(line)) return 'riscaldamento';
  if (/stretching|defaticamento/i.test(line)) return 'stretching';
  return 'esercizi';
}

/**
 * Parsing di un singolo esercizio
 */
function parseExercise(line: string): WorkoutExercise | null {
  // Pattern per esercizi: "Nome: 3x12" o "Nome 3x12"
  const patterns = [
    /^(.+?):?\s+(\d+)[x×](\d+(?:-\d+)?)\s*(.*)$/i,
    /^(.+?):?\s+(\d+)[x×](\d+)\s*(sec|secondi|min|minuti)\s*(.*)$/i,
    /^(.+?):?\s+(\d+)[x×]\s*max\s+reps?\s*(.*)$/i,
    /^(.+?):?\s+(\d+)[x×](\d+)\s*(.*)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, nome, serie, ripetizioni, ...rest] = match;
      const riposo = extractRiposo(line);
      const note = rest.join(' ').trim() || null;
      
      return {
        nome: nome.trim(),
        serie: parseInt(serie),
        ripetizioni_durata: ripetizioni,
        riposo,
        note,
        origine: 'file',
        confidence: 0.8
      };
    }
  }
  
  // Se non matcha i pattern, potrebbe essere un esercizio semplice
  if (line.length > 3 && !line.match(/^\d/)) {
    return {
      nome: line.trim(),
      serie: 1,
      ripetizioni_durata: '1',
      riposo: null,
      note: null,
      origine: 'file',
      confidence: 0.3
    };
  }
  
  return null;
}

/**
 * Estrae il tempo di riposo da una riga
 */
function extractRiposo(line: string): string | null {
  const riposoPatterns = [
    /riposo\s*(\d+)\s*(sec|secondi|min|minuti)/i,
    /(\d+)\s*(sec|secondi|min|minuti)\s*riposo/i,
  ];
  
  for (const pattern of riposoPatterns) {
    const match = line.match(pattern);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
  }
  
  return null;
}

/**
 * Suggerisce riscaldamento basato sugli esercizi
 */
function suggestRiscaldamento(esercizi: WorkoutExercise[]): WorkoutExercise[] {
  const riscaldamento: WorkoutExercise[] = [
    {
      nome: 'Mobilità articolare generale',
      serie: 1,
      ripetizioni_durata: '5 min',
      riposo: null,
      note: 'Aggiunto automaticamente',
      origine: 'suggerito',
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
      origine: 'suggerito',
      confidence: 0.1
    });
  }
  
  return riscaldamento;
}

/**
 * Suggerisce stretching basato sugli esercizi
 */
function suggestStretching(esercizi: WorkoutExercise[]): WorkoutExercise[] {
  const stretching: WorkoutExercise[] = [
    {
      nome: 'Stretching generale',
      serie: 1,
      ripetizioni_durata: '5 min',
      riposo: null,
      note: 'Aggiunto automaticamente',
      origine: 'suggerito',
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
      origine: 'suggerito',
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
      origine: 'suggerito',
      confidence: 0.1
    });
  }
  
  return stretching;
}
