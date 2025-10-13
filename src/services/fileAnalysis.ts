// ===== FILE ANALYZER - FLUSSO UNICO COMPLETO =====

import { AdvancedWorkoutAnalyzer, ParsedWorkoutResult, ParsedExercise } from './AdvancedWorkoutAnalyzer';

// Interfacce compatibili con il sistema esistente
export interface ExtractedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  confidence: number;
}

export interface WorkoutSection {
  name: string;
  exercises: ExtractedExercise[];
}

export interface FileAnalysisResult {
  exercises: ExtractedExercise[];
  workoutTitle: string;
  duration: string;
  sections: WorkoutSection[];
  multiDay?: boolean;
  daysFound?: string[];
  metadata: {
    source: string;
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

export class FileAnalyzer {
  /**
   * FLUSSO UNICO DI ANALISI FILE
   * Gestisce PDF, immagini e OCR con fallback automatico
   */
  static async analyzeFile(file: File | string): Promise<FileAnalysisResult> {
    try {
      // Validazione file
      if (file instanceof File && file.size > 10 * 1024 * 1024) {
        throw new Error('File troppo grande (max 10MB)');
      }

      // Analisi con il nuovo sistema
      const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(file);
      
      // Conversione al formato compatibile con UI
      return this.convertToFileAnalysisResult(result);
      
    } catch (error) {
      console.error('Errore analisi file:', error);
      
      // Ritorna risultato di fallback invece di lanciare eccezione
      return {
        exercises: [],
        workoutTitle: 'Errore analisi',
        duration: '0 min',
        sections: [],
        metadata: {
          source: 'error',
          confidence: 0,
          warnings: [`Errore durante l'analisi: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`]
        }
      };
    }
  }

  /**
   * Conversione risultato al formato UI
   */
  private static convertToFileAnalysisResult(parsedWorkout: ParsedWorkoutResult): FileAnalysisResult {
    // Combina tutti gli esercizi
    const allExercises = [
      ...parsedWorkout.riscaldamento,
      ...parsedWorkout.esercizi,
      ...parsedWorkout.stretching
    ];

    // Converti al formato UI
    const exercises: ExtractedExercise[] = allExercises.map(exercise => 
      this.convertExercise(exercise)
    );

    // Crea sezioni
    const sections: WorkoutSection[] = [];
    
    if (parsedWorkout.riscaldamento.length > 0) {
      sections.push({
        name: 'Riscaldamento',
        exercises: parsedWorkout.riscaldamento.map(this.convertExercise)
      });
    }
    
    if (parsedWorkout.esercizi.length > 0) {
      sections.push({
        name: 'Esercizi Principali',
        exercises: parsedWorkout.esercizi.map(this.convertExercise)
      });
    }
    
    if (parsedWorkout.stretching.length > 0) {
      sections.push({
        name: 'Stretching',
        exercises: parsedWorkout.stretching.map(this.convertExercise)
      });
    }

    return {
      exercises,
      workoutTitle: this.generateWorkoutTitle(parsedWorkout),
      duration: this.estimateDuration(allExercises),
      sections,
      multiDay: parsedWorkout.multiDay,
      daysFound: parsedWorkout.daysFound,
      metadata: {
        source: parsedWorkout.metadata.extractionSource,
        confidence: parsedWorkout.metadata.confidence,
        warnings: parsedWorkout.metadata.warnings,
        debug: parsedWorkout.metadata.debug
      }
    };
  }

  /**
   * Conversione singolo esercizio
   */
  private static convertExercise(exercise: ParsedExercise): ExtractedExercise {
    return {
      name: exercise.name,
      sets: exercise.sets ? parseInt(exercise.sets) : 1,
      reps: exercise.reps || exercise.duration || 'N/A',
      rest: exercise.rest || '',
      notes: exercise.notes || undefined,
      confidence: 80 // Confidence fissa per ora
    };
  }

  /**
   * Generazione titolo allenamento
   */
  private static generateWorkoutTitle(parsedWorkout: ParsedWorkoutResult): string {
    const day = parsedWorkout.giorno > 1 ? ` - Giorno ${parsedWorkout.giorno}` : '';
    const exerciseCount = parsedWorkout.esercizi.length;
    
    if (parsedWorkout.multiDay && parsedWorkout.daysFound && parsedWorkout.daysFound.length > 0) {
      return `Allenamento Multi-Giorno (${parsedWorkout.daysFound.length} giorni trovati)`;
    }
    
    if (exerciseCount === 0) {
      return `Allenamento${day}`;
    }
    
    return `Allenamento${day} (${exerciseCount} esercizi)`;
  }

  /**
   * Stima durata allenamento
   */
  private static estimateDuration(exercises: ParsedExercise[]): string {
    if (exercises.length === 0) return '0 min';
    
    // Stima: 2 min per esercizio + 1 min di riposo
    const estimatedMinutes = exercises.length * 3;
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} min`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  }
}
