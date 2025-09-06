/**
 * Test per verificare che gli allenamenti abbiano varietà e numero corretto di esercizi
 * basato sul livello utente
 */

import { generateFilteredStrengthWorkout } from '../services/workoutGenerator.js';

// Test con diverse combinazioni e livelli
const testCases = [
  {
    name: 'Schiena + Bilanciere (45 min) - Intermedio',
    muscleGroup: 'Schiena',
    equipment: 'Bilanciere',
    totalMinutes: 45,
    userLevel: 'INTERMEDIO'
  },
  {
    name: 'Schiena + Bilanciere (30 min) - Principiante',
    muscleGroup: 'Schiena',
    equipment: 'Bilanciere',
    totalMinutes: 30,
    userLevel: 'PRINCIPIANTE'
  },
  {
    name: 'Petto + Bilanciere (60 min) - Avanzato',
    muscleGroup: 'Petto',
    equipment: 'Bilanciere',
    totalMinutes: 60,
    userLevel: 'AVANZATO'
  },
  {
    name: 'Gambe + Bilanciere (45 min) - Intermedio',
    muscleGroup: 'Gambe',
    equipment: 'Bilanciere',
    totalMinutes: 45,
    userLevel: 'INTERMEDIO'
  }
];

function testWorkoutVariety() {
  
  testCases.forEach((testCase, index) => {
    
    try {
      const workout = generateFilteredStrengthWorkout(
        testCase.muscleGroup,
        testCase.equipment,
        testCase.totalMinutes,
        testCase.userLevel
      );
      
      
      // Calcola durata effettiva
      const workTime = parseInt(workout.exercises[0]?.duration || '60');
      const restTime = parseInt(workout.exercises[0]?.rest || '20');
      const totalTimePerExercise = workTime + restTime;
      const totalTimeMinutes = (workout.exercises.length * totalTimePerExercise) / 60;
      
      
      // Verifica numero di esercizi basato sul livello
      const expectedMax = {
        PRINCIPIANTE: 8,
        INTERMEDIO: 12,
        AVANZATO: 15
      }[testCase.userLevel];
      
      if (workout.exercises.length > expectedMax) {
        console.error(`❌ ERRORE: Troppi esercizi (${workout.exercises.length}) per livello ${testCase.userLevel} (max ${expectedMax})`);
      } else if (workout.exercises.length < 3) {
        console.warn(`⚠️ ATTENZIONE: Troppo pochi esercizi (${workout.exercises.length})`);
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
      
      // Mostra gli esercizi unici
      uniqueExercises.forEach((exercise, i) => {
        const count = workout.exercises.filter(ex => ex.name === exercise).length;
      });
      
      // Verifica che non ci siano troppe ripetizioni
      const maxRepetitions = Math.max(...uniqueExercises.map(ex => 
        workout.exercises.filter(e => e.name === ex).length
      ));
      
      if (maxRepetitions > 3) {
        console.error(`❌ ERRORE: Troppe ripetizioni (max ${maxRepetitions})`);
      } else if (maxRepetitions > 2) {
        console.warn(`⚠️ ATTENZIONE: Molte ripetizioni (max ${maxRepetitions})`);
      } else {
      }
      
    } catch (error) {
      console.error(`❌ Errore generazione ${testCase.name}:`, error);
    }
  });
  
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testWorkoutVariety();
}

export { testWorkoutVariety };

