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
  console.log('🧪 Test generazione allenamenti dopo correzioni...');
  console.log('📊 Verificando che non ci siano più allenamenti con un solo esercizio...\n');
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('='.repeat(50));
    
    try {
      const workout = generateFilteredStrengthWorkout(
        testCase.muscleGroup,
        testCase.equipment,
        testCase.totalMinutes
      );
      
      console.log(`✅ Nome: ${workout.name}`);
      console.log(`📝 Esercizi: ${workout.exercises.length}`);
      console.log(`⏱️ Durata target: ${testCase.totalMinutes} minuti`);
      
      // Calcola durata effettiva
      const workTime = parseInt(workout.exercises[0]?.duration || '60');
      const restTime = parseInt(workout.exercises[0]?.rest || '20');
      const totalTimePerExercise = workTime + restTime;
      const totalTimeMinutes = (workout.exercises.length * totalTimePerExercise) / 60;
      
      console.log(`⏰ Durata effettiva: ${totalTimeMinutes.toFixed(1)} minuti`);
      console.log(`🔄 Tempo per esercizio: ${workTime}s lavoro + ${restTime}s riposo`);
      
      // Verifica che non ci sia solo 1 esercizio
      if (workout.exercises.length === 1) {
        console.error(`❌ ERRORE: Solo 1 esercizio per ${testCase.name}!`);
      } else if (workout.exercises.length < 5) {
        console.warn(`⚠️ ATTENZIONE: Solo ${workout.exercises.length} esercizi per ${testCase.name}`);
      } else {
        console.log(`✅ OK: ${workout.exercises.length} esercizi generati`);
      }
      
      // Mostra i primi 3 esercizi
      console.log('\n📋 Primi esercizi:');
      workout.exercises.slice(0, 3).forEach((exercise, i) => {
        console.log(`   ${i + 1}. ${exercise.name} (${exercise.duration} + ${exercise.rest})`);
      });
      
      if (workout.exercises.length > 3) {
        console.log(`   ... e altri ${workout.exercises.length - 3} esercizi`);
      }
      
    } catch (error) {
      console.error(`❌ Errore generazione ${testCase.name}:`, error);
    }
  });
  
  console.log('\n✅ Test completato!');
  console.log('📝 Se tutti gli allenamenti hanno più di 1 esercizio, il problema è risolto!');
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testWorkoutGeneration();
}

export { testWorkoutGeneration };
