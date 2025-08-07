import { supabase } from '@/integrations/supabase/client';

export interface ExtractedExercise {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  notes?: string;
}

export interface FileAnalysisResult {
  exercises: ExtractedExercise[];
  workoutTitle?: string;
  duration?: string;
  confidence: number;
  rawText: string;
}

// Pattern per riconoscere esercizi comuni
const EXERCISE_PATTERNS = [
  // Pattern italiano
  /(\d+)\s*x\s*(\d+)\s*([a-zA-Z\s]+)/gi, // "3 x 12 Push-up"
  /(\d+)\s*serie\s*(\d+)\s*ripetizioni?\s*([a-zA-Z\s]+)/gi, // "3 serie 12 ripetizioni Push-up"
  /([a-zA-Z\s]+)\s*(\d+)\s*x\s*(\d+)/gi, // "Push-up 3 x 12"
  
  // Pattern inglese
  /(\d+)\s*sets?\s*(\d+)\s*reps?\s*([a-zA-Z\s]+)/gi, // "3 sets 12 reps Push-up"
  /([a-zA-Z\s]+)\s*(\d+)\s*sets?\s*(\d+)\s*reps?/gi, // "Push-up 3 sets 12 reps"
  
  // Pattern con riposo
  /(\d+)\s*x\s*(\d+)\s*([a-zA-Z\s]+)\s*(\d+)\s*min/gi, // "3 x 12 Push-up 2 min"
  /([a-zA-Z\s]+)\s*(\d+)\s*x\s*(\d+)\s*(\d+)\s*min/gi, // "Push-up 3 x 12 2 min"
];

// Esercizi comuni per migliorare il riconoscimento
const COMMON_EXERCISES = [
  // Upper body
  'push-up', 'pushup', 'piegamenti', 'flessioni', 'bench press', 'panca piana',
  'pull-up', 'pullup', 'trazioni', 'chin-up', 'dip', 'dips',
  'shoulder press', 'military press', 'lento avanti', 'overhead press',
  'bicep curl', 'curl bicipiti', 'hammer curl', 'concentration curl',
  'tricep dip', 'tricep extension', 'kickback',
  
  // Lower body
  'squat', 'piegamenti gambe', 'deadlift', 'stacco', 'lunges', 'affondi',
  'leg press', 'pressa', 'leg extension', 'estensione gambe',
  'leg curl', 'curl gambe', 'calf raise', 'calf raises',
  
  // Core
  'plank', 'plancia', 'crunch', 'sit-up', 'situp', 'addominali',
  'mountain climber', 'scalatore', 'russian twist', 'torsioni russe',
  'leg raise', 'alzata gambe', 'bicycle crunch', 'crunch bicicletta',
  
  // Cardio
  'burpee', 'burpees', 'jumping jack', 'salti', 'mountain climber',
  'high knees', 'ginocchia alte', 'butt kick', 'calci al sedere',
  'jump rope', 'corda', 'running', 'corsa', 'cycling', 'ciclismo',
  
  // Stretching
  'stretch', 'stretching', 'allungamento', 'flexibility', 'flessibilità',
  'yoga', 'pilates', 'mobility', 'mobilità'
];

export class FileAnalyzer {
  private static async extractTextFromImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Per ora restituiamo un testo di esempio
        // In produzione si userebbe un servizio OCR come Tesseract.js o API
        resolve(this.simulateOCRText());
      };
      
      img.onerror = () => reject(new Error('Errore caricamento immagine'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static async extractTextFromPDF(file: File): Promise<string> {
    // Per ora restituiamo un testo di esempio
    // In produzione si userebbe pdf.js o un servizio OCR
    return this.simulateOCRText();
  }

  private static simulateOCRText(): string {
    // Simula il testo estratto da OCR
    return `
    ALLENAMENTO FORZA - UPPER BODY
    
    1. Push-up 3 x 12
    2. Pull-up 3 x 8
    3. Dip 3 x 10
    4. Shoulder Press 3 x 10
    5. Bicep Curl 3 x 12
    6. Tricep Extension 3 x 12
    
    RIPOSO: 2 minuti tra le serie
    DURATA: 45 minuti
    `;
  }

  private static extractExercisesFromText(text: string): ExtractedExercise[] {
    const exercises: ExtractedExercise[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Cerca pattern di esercizi
      for (const pattern of EXERCISE_PATTERNS) {
        const matches = line.match(pattern);
        if (matches) {
          const exercise = this.parseExerciseMatch(matches, line);
          if (exercise) {
            exercises.push(exercise);
            break;
          }
        }
      }
      
      // Se non trova pattern, cerca solo nomi di esercizi
      if (!exercises.some(ex => ex.name.toLowerCase().includes(line.toLowerCase()))) {
        const exerciseName = this.extractExerciseName(line);
        if (exerciseName) {
          exercises.push({
            name: exerciseName,
            sets: '3', // Default
            reps: '10', // Default
            rest: '2 min'
          });
        }
      }
    }
    
    return exercises;
  }

  private static parseExerciseMatch(matches: RegExpMatchArray, originalLine: string): ExtractedExercise | null {
    const match = matches[0];
    const groups = matches.slice(1);
    
    if (groups.length >= 3) {
      const sets = groups[0];
      const reps = groups[1];
      const exerciseName = groups[2]?.trim();
      
      if (exerciseName) {
        return {
          name: this.cleanExerciseName(exerciseName),
          sets,
          reps,
          rest: '2 min' // Default
        };
      }
    }
    
    return null;
  }

  private static extractExerciseName(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const exercise of COMMON_EXERCISES) {
      if (lowerText.includes(exercise.toLowerCase())) {
        return this.cleanExerciseName(text);
      }
    }
    
    return null;
  }

  private static cleanExerciseName(name: string): string {
    return name
      .replace(/[0-9xX]/g, '') // Rimuove numeri e x
      .replace(/\s+/g, ' ') // Normalizza spazi
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static extractWorkoutInfo(text: string): { title?: string; duration?: string } {
    const lines = text.split('\n');
    let title: string | undefined;
    let duration: string | undefined;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Cerca titolo
      if (lowerLine.includes('allenamento') || lowerLine.includes('workout')) {
        title = line.trim();
      }
      
      // Cerca durata
      if (lowerLine.includes('durata') || lowerLine.includes('duration')) {
        const match = line.match(/(\d+)\s*min/);
        if (match) {
          duration = match[1];
        }
      }
    }
    
    return { title, duration };
  }

  public static async analyzeFile(file: File): Promise<FileAnalysisResult> {
    try {
      let text: string;
      
      if (file.type.startsWith('image/')) {
        text = await this.extractTextFromImage(file);
      } else if (file.type === 'application/pdf') {
        text = await this.extractTextFromPDF(file);
      } else {
        throw new Error('Tipo file non supportato');
      }
      
      const exercises = this.extractExercisesFromText(text);
      const { title, duration } = this.extractWorkoutInfo(text);
      
      const confidence = exercises.length > 0 ? Math.min(0.9, 0.5 + (exercises.length * 0.1)) : 0.3;
      
      return {
        exercises,
        workoutTitle: title,
        duration,
        confidence,
        rawText: text
      };
    } catch (error) {
      console.error('Errore analisi file:', error);
      throw error;
    }
  }
}
