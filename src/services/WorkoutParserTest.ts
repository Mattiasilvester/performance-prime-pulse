// ===== WORKOUT PARSER TEST - FLUSSO UNICO COMPLETO =====

import WorkoutParser from './WorkoutParser';

// Test files per verificare il flusso unico
const testFiles = {
  // Test con esercizi standard
  standardWorkout: `
    RISCALDAMENTO
    Mobilità articolare: 5 min
    Cardio leggero: 5 min
    
    ESERCIZI PRINCIPALI
    Squat: 4x8-10 riposo 2 min
    Panca piana: 3x8 riposo 90 sec
    Rematore: 3x10 riposo 60 sec
    Stacchi: 3x6 riposo 3 min
    
    STRETCHING
    Stretching generale: 5 min
  `,

  // Test con contenuti binari PDF
  binaryFile: `
    /BaseFont /Helvetica
    /Encoding /WinAnsiEncoding
    endobj 123
    stream
    %PDF-1.4
    obj 456
    
    RISCALDAMENTO
    Mobilità: 5 min
    
    ESERCIZI
    Squat: 4x8-10
    Panca: 3x8
    
    STRETCHING
    Stretching: 5 min
  `,

  // Test multi-giorno
  multiDayWorkout: `
    GIORNO 1 - PUSH
    RISCALDAMENTO
    Mobilità spalle: 5 min
    
    ESERCIZI
    Panca piana: 4x8 riposo 2 min
    Military press: 3x8 riposo 90 sec
    Dips: 3x10 riposo 60 sec
    
    STRETCHING
    Stretching spalle: 5 min
    
    GIORNO 2 - PULL
    RISCALDAMENTO
    Mobilità schiena: 5 min
    
    ESERCIZI
    Stacchi: 4x6 riposo 3 min
    Rematore: 3x10 riposo 90 sec
    Trazioni: 3x8 riposo 60 sec
    
    STRETCHING
    Stretching schiena: 5 min
  `,

  // Test con simboli Unicode
  unicodeFile: `
    RISCALDAMENTO
    Mobilità articolare: 5 min
    
    ESERCIZI PRINCIPALI
    Squat: 4×8–10 riposo 2 min
    Panca piana: 3×8 riposo 90 sec
    Rematore: 3×10 riposo 60 sec
    
    STRETCHING
    Stretching generale: 5 min
  `
};

// Funzione helper per creare file di test
function createTestFile(content: string, filename: string): File {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], filename, { type: 'text/plain' });
}

// Test principale del parser
async function testWorkoutParser() {
  console.log('🧪 === TEST WORKOUT PARSER ===\n');
  
  const testCases = [
    { name: 'Standard Workout', content: testFiles.standardWorkout },
    { name: 'Unicode Symbols', content: testFiles.unicodeFile },
    { name: 'Multi-Day Workout', content: testFiles.multiDayWorkout }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    
    try {
      const file = createTestFile(testCase.content, `${testCase.name}.txt`);
      const result = await WorkoutParser.parseWorkoutFile(file);
      
      console.log(`✅ Successo: ${result.esercizi.length} esercizi trovati`);
      console.log(`   - Riscaldamento: ${result.riscaldamento.length}`);
      console.log(`   - Esercizi principali: ${result.esercizi.length}`);
      console.log(`   - Stretching: ${result.stretching.length}`);
      console.log(`   - Giorno: ${result.giorno}`);
      
      // Verifica struttura JSON
      if (result.riscaldamento && Array.isArray(result.riscaldamento) &&
          result.esercizi && Array.isArray(result.esercizi) &&
          result.stretching && Array.isArray(result.stretching) &&
          typeof result.giorno === 'number') {
        console.log(`   ✅ Struttura JSON valida`);
      } else {
        console.log(`   ❌ Struttura JSON non valida`);
      }
      
      // Verifica che non ci siano contenuti binari
      const allText = JSON.stringify(result);
      const binaryPatterns = ['/BaseFont', '/Encoding', '/Subtype', '/Type', '/Font', 'endobj', 'stream', 'endstream', '%PDF', 'obj'];
      const hasBinaryContent = binaryPatterns.some(pattern => allText.includes(pattern));
      
      if (!hasBinaryContent) {
        console.log(`   ✅ Nessun contenuto binario`);
      } else {
        console.log(`   ❌ Contenuti binari trovati`);
      }
      
    } catch (error) {
      console.log(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
    
    console.log('');
  }
}

// Test per verificare la pulizia dei contenuti binari
async function testBinaryContentFiltering() {
  console.log('🧹 === TEST FILTRAGGIO CONTENUTI BINARI ===\n');
  
  const binaryContent = testFiles.binaryFile;
  
  try {
    const file = createTestFile(binaryContent, 'binary-test.txt');
    const result = await WorkoutParser.parseWorkoutFile(file);
    
    console.log(`📊 Risultati test filtraggio contenuti binari:`);
    console.log(`- Esercizi trovati: ${result.esercizi.length}`);
    console.log(`- Riscaldamento: ${result.riscaldamento.length}`);
    console.log(`- Stretching: ${result.stretching.length}`);
    
    // Verifica che non ci siano contenuti binari nel risultato
    const allText = JSON.stringify(result);
    const binaryPatterns = ['/BaseFont', '/Encoding', '/Subtype', '/Type', '/Font', 'endobj', 'stream', 'endstream', '%PDF', 'obj'];
    
    const hasBinaryContent = binaryPatterns.some(pattern => allText.includes(pattern));
    
    if (hasBinaryContent) {
      console.log(`❌ ERRORE: Contenuti binari ancora presenti nel risultato`);
      binaryPatterns.forEach(pattern => {
        if (allText.includes(pattern)) {
          console.log(`  - Trovato: ${pattern}`);
        }
      });
    } else {
      console.log(`✅ SUCCESSO: Tutti i contenuti binari filtrati correttamente`);
    }
    
    // Verifica che gli esercizi siano stati estratti correttamente
    if (result.esercizi.length > 0) {
      console.log(`✅ SUCCESSO: Esercizi estratti nonostante contenuti binari`);
      result.esercizi.forEach((exercise, index) => {
        console.log(`  ${index + 1}. ${exercise.nome}`);
      });
    } else {
      console.log(`❌ ERRORE: Nessun esercizio estratto`);
    }
    
  } catch (error) {
    console.error(`❌ Errore test filtraggio contenuti binari:`, error);
  }
}

// Test per verificare la normalizzazione Unicode
async function testUnicodeNormalization() {
  console.log('🔤 === TEST NORMALIZZAZIONE UNICODE ===\n');
  
  const unicodeContent = testFiles.unicodeFile;
  
  try {
    const file = createTestFile(unicodeContent, 'unicode-test.txt');
    const result = await WorkoutParser.parseWorkoutFile(file);
    
    console.log(`📊 Risultati test normalizzazione Unicode:`);
    console.log(`- Esercizi trovati: ${result.esercizi.length}`);
    
    // Verifica che i simboli Unicode siano stati normalizzati
    const allText = JSON.stringify(result);
    
    if (allText.includes('×') || allText.includes('–')) {
      console.log(`❌ ERRORE: Simboli Unicode non normalizzati`);
      if (allText.includes('×')) console.log(`  - Trovato: ×`);
      if (allText.includes('–')) console.log(`  - Trovato: –`);
    } else {
      console.log(`✅ SUCCESSO: Simboli Unicode normalizzati correttamente`);
    }
    
    // Verifica che gli esercizi siano stati estratti
    if (result.esercizi.length > 0) {
      console.log(`✅ SUCCESSO: Esercizi estratti con simboli Unicode`);
      result.esercizi.forEach((exercise, index) => {
        console.log(`  ${index + 1}. ${exercise.nome} - ${exercise.ripetizioni}`);
      });
    } else {
      console.log(`❌ ERRORE: Nessun esercizio estratto`);
    }
    
  } catch (error) {
    console.error(`❌ Errore test normalizzazione Unicode:`, error);
  }
}

// Test per verificare la gestione multi-giorno
async function testMultiDayHandling() {
  console.log('📅 === TEST GESTIONE MULTI-GIORNO ===\n');
  
  const multiDayContent = testFiles.multiDayWorkout;
  
  try {
    const file = createTestFile(multiDayContent, 'multi-day-test.txt');
    const result = await WorkoutParser.parseWorkoutFile(file);
    
    console.log(`📊 Risultati test gestione multi-giorno:`);
    console.log(`- Giorno rilevato: ${result.giorno}`);
    console.log(`- Esercizi trovati: ${result.esercizi.length}`);
    
    // Verifica che il primo giorno sia stato estratto
    if (result.giorno >= 1) {
      console.log(`✅ SUCCESSO: Giorno rilevato correttamente`);
    } else {
      console.log(`❌ ERRORE: Giorno non rilevato`);
    }
    
    // Verifica che gli esercizi siano stati estratti
    if (result.esercizi.length > 0) {
      console.log(`✅ SUCCESSO: Esercizi del primo giorno estratti`);
      result.esercizi.forEach((exercise, index) => {
        console.log(`  ${index + 1}. ${exercise.nome}`);
      });
    } else {
      console.log(`❌ ERRORE: Nessun esercizio estratto`);
    }
    
  } catch (error) {
    console.error(`❌ Errore test gestione multi-giorno:`, error);
  }
}

// Esegui tutti i test
async function runAllTests() {
  console.log('🚀 === AVVIO TEST COMPLETI WORKOUT PARSER ===\n');
  
  await testWorkoutParser();
  await testBinaryContentFiltering();
  await testUnicodeNormalization();
  await testMultiDayHandling();
  
  console.log('✅ === TUTTI I TEST COMPLETATI ===');
}

// Esponi le funzioni globalmente per accesso dalla console
(window as any).testWorkoutParser = testWorkoutParser;
(window as any).testBinaryContentFiltering = testBinaryContentFiltering;
(window as any).testUnicodeNormalization = testUnicodeNormalization;
(window as any).testMultiDayHandling = testMultiDayHandling;
(window as any).runAllTests = runAllTests;

// Log per indicare che i test sono disponibili
console.log('🧪 WorkoutParserTest caricato. Usa runAllTests() per eseguire tutti i test.');

export {
  testWorkoutParser,
  testBinaryContentFiltering,
  testUnicodeNormalization,
  testMultiDayHandling,
  runAllTests
};
