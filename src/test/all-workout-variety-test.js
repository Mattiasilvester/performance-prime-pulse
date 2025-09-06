/**
 * Test completo per verificare che tutte le funzioni di generazione allenamenti
 * abbiano varietà e numero corretto di esercizi basato sul livello utente
 */

import { 
  generateWorkout, 
  generateFilteredStrengthWorkout, 
  generateFilteredHIITWorkout,
  generateRecommendedWorkout 
} from '../services/workoutGenerator.js';

// Test con diverse combinazioni e livelli
const testCases = [
  // Test generateWorkout
  {
    name: 'generateWorkout - Forza (45 min) - Intermedio',
    func: () => generateWorkout('strength', 45, {}, 'INTERMEDIO', false),
    expectedMax: 8
  },
  {
    name: 'generateWorkout - HIIT (30 min) - Principiante',
    func: () => generateWorkout('hiit', 30, {}, 'PRINCIPIANTE', false),
    expectedMax: 5
  },
  {
    name: 'generateWorkout - Cardio (60 min) - Avanzato',
    func: () => generateWorkout('cardio', 60, {}, 'AVANZATO', false),
    expectedMax: 6
  },
  {
    name: 'generateWorkout - Mobilità (20 min) - Intermedio',
    func: () => generateWorkout('mobility', 20, {}, 'INTERMEDIO', false),
    expectedMax: 6
  },
  
  // Test generateFilteredStrengthWorkout
  {
    name: 'generateFilteredStrengthWorkout - Schiena + Bilanciere (45 min) - Intermedio',
    func: () => generateFilteredStrengthWorkout('Schiena', 'Bilanciere', 45, 'INTERMEDIO'),
    expectedMax: 12
  },
  {
    name: 'generateFilteredStrengthWorkout - Petto + Manubri (30 min) - Principiante',
    func: () => generateFilteredStrengthWorkout('Petto', 'Manubri', 30, 'PRINCIPIANTE'),
    expectedMax: 8
  },
  {
    name: 'generateFilteredStrengthWorkout - Gambe + Bilanciere (60 min) - Avanzato',
    func: () => generateFilteredStrengthWorkout('Gambe', 'Bilanciere', 60, 'AVANZATO'),
    expectedMax: 15
  },
  
  // Test generateFilteredHIITWorkout
  {
    name: 'generateFilteredHIITWorkout - Tutte durate (45 min) - Intermedio',
    func: () => generateFilteredHIITWorkout('Tutte', 'Tutti', 45, 'INTERMEDIO'),
    expectedMax: 8
  },
  {
    name: 'generateFilteredHIITWorkout - 15-20 min (30 min) - Principiante',
    func: () => generateFilteredHIITWorkout('15-20 min', 'Principiante', 30, 'PRINCIPIANTE'),
    expectedMax: 6
  },
  
  // Test generateRecommendedWorkout
  {
    name: 'generateRecommendedWorkout - Casuale',
    func: () => generateRecommendedWorkout(),
    expectedMax: 10 // Dovrebbe essere ragionevole
  }
];

function testAllWorkoutVariety() {
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    
    try {
      const workout = testCase.func();
      
      
      // Verifica numero di esercizi
      if (workout.exercises.length > testCase.expectedMax) {
        console.error(`❌ ERRORE: Troppi esercizi (${workout.exercises.length}) per limite ${testCase.expectedMax}`);
      } else if (workout.exercises.length < 1) {
        console.error(`❌ ERRORE: Nessun esercizio generato`);
      } else {
      }
      
      // Verifica varietà degli esercizi
      const uniqueExercises = [...new Set(workout.exercises.map(ex => ex.name))];
      const varietyRatio = uniqueExercises.length / workout.exercises.length;
      
      
      if (varietyRatio < 0.3) {
        console.error(`❌ ERRORE: Troppo poca varietà (${(varietyRatio * 100).toFixed(1)}%)`);
      } else if (varietyRatio < 0.5) {
        console.warn(`⚠️ ATTENZIONE: Varietà limitata (${(varietyRatio * 100).toFixed(1)}%)`);
      } else {
      }
      
      // Verifica ripetizioni massime
      const maxRepetitions = Math.max(...uniqueExercises.map(ex => 
        workout.exercises.filter(e => e.name === ex).length
      ));
      
      
      if (maxRepetitions > 2) {
        console.error(`❌ ERRORE: Troppe ripetizioni (max ${maxRepetitions})`);
      } else {
      }
      
      // Mostra alcuni esercizi
      workout.exercises.slice(0, 5).forEach((exercise, i) => {
      });
      
      if (workout.exercises.length > 5) {
      }
      
      // Conta test passati
      if (workout.exercises.length <= testCase.expectedMax && 
          workout.exercises.length >= 1 && 
          varietyRatio >= 0.3 && 
          maxRepetitions <= 2) {
        passedTests++;
      } else {
      }
      
    } catch (error) {
      console.error(`❌ Errore generazione ${testCase.name}:`, error);
    }
  });
  
  
  if (passedTests === totalTests) {
  } else {
  }
  
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testAllWorkoutVariety();
}

export { testAllWorkoutVariety };

