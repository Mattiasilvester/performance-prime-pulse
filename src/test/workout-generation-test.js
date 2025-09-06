/**
 * Test per verificare che la generazione degli allenamenti funzioni correttamente
 * dopo le correzioni per evitare allenamenti con un solo esercizio
 */

import { generateFilteredStrengthWorkout } from '../services/workoutGenerator.js';

// Test con diverse combinazioni che causavano problemi
const testCases = [
  {
    name: 'Schiena + Manubri (45 min)',
    muscleGroup: 'Schiena',
    equipment: 'Manubri',
    totalMinutes: 45
  },
  {
    name: 'Petto + Manubri (30 min)',
    muscleGroup: 'Petto',
    equipment: 'Manubri',
    totalMinutes: 30
  },
  {
    name: 'Gambe + Manubri (60 min)',
    muscleGroup: 'Gambe',
    equipment: 'Manubri',
    totalMinutes: 60
  },
  {
    name: 'Braccia + Manubri (20 min)',
    muscleGroup: 'Braccia',
    equipment: 'Manubri',
    totalMinutes: 20
  },
  {
    name: 'Spalle + Manubri (25 min)',
    muscleGroup: 'Spalle',
    equipment: 'Manubri',
    totalMinutes: 25
  }
];

function testWorkoutGeneration() {
  
  testCases.forEach((testCase, index) => {
    
    try {
      const workout = generateFilteredStrengthWorkout(
        testCase.muscleGroup,
        testCase.equipment,
        testCase.totalMinutes
      );
      
      
      // Calcola durata effettiva
      const workTime = parseInt(workout.exercises[0]?.duration || '60');
      const restTime = parseInt(workout.exercises[0]?.rest || '20');
      const totalTimePerExercise = workTime + restTime;
      const totalTimeMinutes = (workout.exercises.length * totalTimePerExercise) / 60;
      
      
      // Verifica che non ci sia solo 1 esercizio
      if (workout.exercises.length === 1) {
        console.error(`❌ ERRORE: Solo 1 esercizio per ${testCase.name}!`);
      } else if (workout.exercises.length < 5) {
        console.warn(`⚠️ ATTENZIONE: Solo ${workout.exercises.length} esercizi per ${testCase.name}`);
      } else {
      }
      
      // Mostra i primi 3 esercizi
      workout.exercises.slice(0, 3).forEach((exercise, i) => {
      });
      
      if (workout.exercises.length > 3) {
      }
      
    } catch (error) {
      console.error(`❌ Errore generazione ${testCase.name}:`, error);
    }
  });
  
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testWorkoutGeneration();
}

export { testWorkoutGeneration };

