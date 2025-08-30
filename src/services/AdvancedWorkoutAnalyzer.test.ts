/**
 * Test per AdvancedWorkoutAnalyzer
 * Verifica il funzionamento con PDF testuali, scansioni e layout insoliti
 */

import { AdvancedWorkoutAnalyzer } from './AdvancedWorkoutAnalyzer';

// Test files aggiornati con nuovi esempi
const testFiles = {
  // PDF testuale standard
  standardPDF: `
    RISCALDAMENTO
    Mobilità articolare generale 1x5 min
    
    ESERCIZI PRINCIPALI
    Squat con bilanciere 4x8-10 rec 90s
    Panca piana 3x10 riposo 2 min
    Rematore 3x12 riposo 1 min
    
    STRETCHING
    Stretching generale 1x5 min
  `,
  
  // Scansione immagine (simulata)
  scannedImage: `
    RISCALDAMENTO
    Camminata leggera 1x5 min
    
    ALLENAMENTO
    Deadlift 5x5 riposo 3 min
    Military Press 3x8 riposo 2 min
    Pull-up 3x max reps riposo 90 sec
    
    DEFATICAMENTO
    Stretching gambe 1x3 min
  `,
  
  // Layout insolito con nuovi pattern
  unusualLayout: `
    GIORNO 1 - UPPER BODY
    
    Warm-up:
    • Arm circles 2x10 (per braccio)
    • Push-ups 1x5
    
    Main:
    • Bench Press: 4x8 (riposo: 2 min)
    • Incline DB Press: 3x10 (riposo: 90 sec)
    • Lat Pulldown: 3x12 (riposo: 1 min)
    
    Cool-down:
    • Stretching spalle 1x3 min
  `,
  
  // Test con nuovi pattern regex
  advancedPatterns: `
    RISCALDAMENTO
    Mobilità articolare 1x5min
    
    ESERCIZI
    Panca piana 4x8-10 rec 90s
    Affondi manubri – 3 serie da 12 per gamba
    Plank 3x45" → duration 45s
    Curl bilanciere 3 x 10 (lenta) pausa 60s
    Lat machine 12-15 ripetizioni
    recupero 75s
  `,
  
  // Multi-giorno test
  multiDayTest: `
    GIORNO 1 - PUSH
    Panca piana 4x8-10
    Military Press 3x8
    
    GIORNO 2 - PULL
    Deadlift 5x5
    Pull-up 3x8
    
    GIORNO 3 - LEGS
    Squat 4x8-10
    Leg Press 3x12
  `,
  
  // File con testo vuoto
  emptyFile: '',
  
  // File con solo metadati
  metadataOnly: `
    /BaseFont /Helvetica
    /Encoding /WinAnsiEncoding
    endobj
    stream
    endstream
    xref
    trailer
    startxref
  `
};

/**
 * Crea un file di test
 */
function createTestFile(content: string, name: string = 'test.txt'): File {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], name, { type: 'text/plain' });
}

/**
 * Test principale aggiornato
 */
async function testAdvancedWorkoutAnalyzer() {
  console.log('🧪 === TEST ADVANCED WORKOUT ANALYZER ===\n');
  
  const testCases = [
    {
      name: 'PDF Testuale Standard',
      file: createTestFile(testFiles.standardPDF, 'standard.pdf'),
      expected: {
        hasRiscaldamento: true,
        hasEsercizi: true,
        hasStretching: true,
        minExercises: 3
      }
    },
    {
      name: 'Scansione Immagine',
      file: createTestFile(testFiles.scannedImage, 'scanned.jpg'),
      expected: {
        hasRiscaldamento: true,
        hasEsercizi: true,
        hasStretching: true,
        minExercises: 3
      }
    },
    {
      name: 'Layout Insolito',
      file: createTestFile(testFiles.unusualLayout, 'unusual.pdf'),
      expected: {
        hasRiscaldamento: true,
        hasEsercizi: true,
        hasStretching: true,
        minExercises: 3
      }
    },
    {
      name: 'Pattern Avanzati',
      file: createTestFile(testFiles.advancedPatterns, 'advanced.pdf'),
      expected: {
        hasRiscaldamento: true,
        hasEsercizi: true,
        hasStretching: false,
        minExercises: 5
      }
    },
    {
      name: 'Multi-Giorno',
      file: createTestFile(testFiles.multiDayTest, 'multiday.pdf'),
      expected: {
        hasRiscaldamento: false,
        hasEsercizi: true,
        hasStretching: false,
        minExercises: 6,
        multiDay: true
      }
    },
    {
      name: 'File Vuoto',
      file: createTestFile(testFiles.emptyFile, 'empty.pdf'),
      expected: {
        hasRiscaldamento: false,
        hasEsercizi: false,
        hasStretching: false,
        minExercises: 0
      }
    },
    {
      name: 'Solo Metadati',
      file: createTestFile(testFiles.metadataOnly, 'metadata.pdf'),
      expected: {
        hasRiscaldamento: false,
        hasEsercizi: false,
        hasStretching: false,
        minExercises: 0
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    
    try {
      const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(testCase.file);
      
      // Verifica risultati
      const hasRiscaldamento = result.riscaldamento.length > 0;
      const hasEsercizi = result.esercizi.length > 0;
      const hasStretching = result.stretching.length > 0;
      const totalExercises = result.riscaldamento.length + result.esercizi.length + result.stretching.length;
      
      // Log risultati
      console.log(`  ✅ Riscaldamento: ${result.riscaldamento.length} esercizi`);
      console.log(`  ✅ Esercizi principali: ${result.esercizi.length} esercizi`);
      console.log(`  ✅ Stretching: ${result.stretching.length} esercizi`);
      console.log(`  ✅ Confidence: ${result.metadata.confidence}%`);
      console.log(`  ✅ Source: ${result.metadata.extractionSource}`);
      console.log(`  ✅ Status: ${result.metadata.extractionStatus}`);
      
      if (result.multiDay) {
        console.log(`  ✅ Multi-giorno: ${result.daysFound?.length || 0} giorni trovati`);
      }
      
      if (result.metadata.warnings.length > 0) {
        console.log(`  ⚠️  Warnings: ${result.metadata.warnings.join(', ')}`);
      }
      
      // Verifica aspettative
      const tests = [
        { name: 'Riscaldamento', actual: hasRiscaldamento, expected: testCase.expected.hasRiscaldamento },
        { name: 'Esercizi', actual: hasEsercizi, expected: testCase.expected.hasEsercizi },
        { name: 'Stretching', actual: hasStretching, expected: testCase.expected.hasStretching },
        { name: 'Min esercizi', actual: totalExercises >= testCase.expected.minExercises, expected: true }
      ];
      
      if (testCase.expected.multiDay) {
        tests.push({ name: 'Multi-giorno', actual: result.multiDay || false, expected: true });
      }
      
      const passed = tests.every(test => test.actual === test.expected);
      
      if (passed) {
        console.log(`  🎉 Test PASSATO\n`);
      } else {
        console.log(`  ❌ Test FALLITO:`);
        tests.forEach(test => {
          if (test.actual !== test.expected) {
            console.log(`    - ${test.name}: atteso ${test.expected}, ottenuto ${test.actual}`);
          }
        });
        console.log('');
      }
      
    } catch (error) {
      console.log(`  ❌ Errore: ${error}\n`);
    }
  }
}

/**
 * Test regex specifiche
 */
async function testRegexPatterns() {
  console.log('🔍 === TEST REGEX PATTERNS ===\n');
  
  const testCases = [
    {
      name: 'Panca piana 4x8-10 rec 90s',
      expected: { name: 'Panca piana', sets: '4', reps: '8-10', rest: '90s' }
    },
    {
      name: 'Affondi manubri – 3 serie da 12 per gamba',
      expected: { name: 'Affondi manubri', sets: '3', reps: '12', notes: 'per gamba' }
    },
    {
      name: 'Plank 3x45"',
      expected: { name: 'Plank', sets: '3', duration: '45s' }
    },
    {
      name: 'Curl bilanciere 3 x 10 (lenta) pausa 60s',
      expected: { name: 'Curl bilanciere', sets: '3', reps: '10', notes: '(lenta)', rest: '60s' }
    },
    {
      name: 'Lat machine 12-15 ripetizioni',
      expected: { name: 'Lat machine', reps: '12-15' }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📝 Test regex: "${testCase.name}"`);
    
    try {
      const file = createTestFile(testCase.name);
      const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(file);
      
      if (result.esercizi.length > 0) {
        const exercise = result.esercizi[0];
        console.log(`  ✅ Parsed: ${exercise.name} - ${exercise.sets || 'N/A'}x${exercise.reps || exercise.duration || 'N/A'} ${exercise.rest ? `(${exercise.rest})` : ''}`);
      } else {
        console.log(`  ❌ Nessun esercizio parsato`);
      }
      
    } catch (error) {
      console.log(`  ❌ Errore: ${error}`);
    }
  }
  
  console.log('');
}

/**
 * Test logging dettagliato
 */
async function testLogging() {
  console.log('📝 === TEST LOGGING ===\n');
  
  // Abilita debug temporaneamente
  const originalDebug = import.meta.env.VITE_DEBUG_ANALYSIS;
// Note: Cannot modify import.meta.env in tests, using mock
  
  const file = createTestFile(testFiles.advancedPatterns, 'logging-test.pdf');
  
  try {
    console.log('🔍 Avvio analisi con logging...');
    const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(file);
    console.log('✅ Analisi completata con logging');
    
    if (result.metadata.debug) {
      console.log(`📊 Debug info: ${result.metadata.debug.linesTried} righe processate, ${result.metadata.debug.matches} match trovati`);
    }
    
  } catch (error) {
    console.log(`❌ Errore logging: ${error}`);
  }
  
  // Ripristina debug
  // Note: Cannot modify import.meta.env in tests
  console.log('');
}

/**
 * Test confidence score
 */
async function testConfidenceScore() {
  console.log('🎯 === TEST CONFIDENCE SCORE ===\n');
  
  const testCases = [
    { content: testFiles.standardPDF, expectedMin: 60 },
    { content: testFiles.advancedPatterns, expectedMin: 70 },
    { content: testFiles.emptyFile, expectedMin: 0 },
    { content: testFiles.metadataOnly, expectedMin: 20 }
  ];
  
  for (const testCase of testCases) {
    const file = createTestFile(testCase.content);
    
    try {
      const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(file);
      const confidence = result.metadata.confidence;
      
      console.log(`📊 Confidence: ${confidence}% (min atteso: ${testCase.expectedMin}%)`);
      
      if (confidence >= testCase.expectedMin) {
        console.log('  ✅ Confidence OK');
      } else {
        console.log('  ❌ Confidence troppo bassa');
      }
      
    } catch (error) {
      console.log(`❌ Errore: ${error}`);
    }
  }
  
  console.log('');
}

/**
 * Test warnings
 */
async function testWarnings() {
  console.log('⚠️  === TEST WARNINGS ===\n');
  
  const testCases = [
    { content: testFiles.emptyFile, expectedWarning: 'Nessun testo estratto' },
    { content: testFiles.metadataOnly, expectedWarning: 'Regex non hanno trovato match' }
  ];
  
  for (const testCase of testCases) {
    const file = createTestFile(testCase.content);
    
    try {
      const result = await AdvancedWorkoutAnalyzer.analyzeWorkoutFile(file);
      const warnings = result.metadata.warnings;
      
      console.log(`📋 Warnings trovati: ${warnings.length}`);
      warnings.forEach(warning => console.log(`  - ${warning}`));
      
      const hasExpectedWarning = warnings.some(w => w.includes(testCase.expectedWarning));
      
      if (hasExpectedWarning) {
        console.log('  ✅ Warning atteso trovato');
      } else {
        console.log('  ❌ Warning atteso non trovato');
      }
      
    } catch (error) {
      console.log(`❌ Errore: ${error}`);
    }
  }
  
  console.log('');
}

/**
 * Esegui tutti i test
 */
async function runAllTests() {
  console.log('🚀 === AVVIO TEST COMPLETI ===\n');
  
  await testAdvancedWorkoutAnalyzer();
  await testRegexPatterns();
  await testLogging();
  await testConfidenceScore();
  await testWarnings();
  
  console.log('✅ === TUTTI I TEST COMPLETATI ===');
}

// Esponi funzioni per test manuali
if (typeof window !== 'undefined') {
  (window as any).testAdvancedWorkoutAnalyzer = testAdvancedWorkoutAnalyzer;
  (window as any).testRegexPatterns = testRegexPatterns;
  (window as any).testLogging = testLogging;
  (window as any).testConfidenceScore = testConfidenceScore;
  (window as any).testWarnings = testWarnings;
  (window as any).runAllTests = runAllTests;
  
  console.log('🧪 Test functions disponibili in console:');
  console.log('- testAdvancedWorkoutAnalyzer()');
  console.log('- testRegexPatterns()');
  console.log('- testLogging()');
  console.log('- testConfidenceScore()');
  console.log('- testWarnings()');
  console.log('- runAllTests()');
}
