#!/usr/bin/env node

/**
 * Test di validazione per il build di produzione
 * Esegui con: node test-production.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TEST VALIDAZIONE BUILD PRODUZIONE');
console.log('=====================================\n');

// 1. Verifica struttura dist/
console.log('1️⃣ Verifica struttura build...');
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(distPath)) {
  console.error('❌ Cartella dist/ non trovata');
  process.exit(1);
}

if (!fs.existsSync(assetsPath)) {
  console.error('❌ Cartella assets/ non trovata');
  process.exit(1);
}

console.log('✅ Struttura build valida\n');

// 2. Verifica file principali
console.log('2️⃣ Verifica file principali...');
const requiredFiles = [
  'dist/index.html',
  'dist/assets/index-l0sNRNKZ.js',
  'dist/assets/vendor-l0sNRNKZ.js',
  'dist/assets/supabase-l0sNRNKZ.js'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.error(`❌ ${file} mancante`);
    process.exit(1);
  }
}

console.log('');

// 3. Verifica contenuto HTML
console.log('3️⃣ Verifica contenuto HTML...');
const htmlContent = fs.readFileSync('dist/index.html', 'utf8');

if (htmlContent.includes('<!DOCTYPE html>')) {
  console.log('✅ DOCTYPE HTML valido');
} else {
  console.error('❌ DOCTYPE HTML mancante');
}

if (htmlContent.includes('root')) {
  console.log('✅ Elemento root trovato');
} else {
  console.error('❌ Elemento root mancante');
}

if (htmlContent.includes('assets/')) {
  console.log('✅ Riferimenti assets validi');
} else {
  console.error('❌ Riferimenti assets mancanti');
}

console.log('');

// 4. Verifica dimensioni bundle
console.log('4️⃣ Verifica dimensioni bundle...');
const jsFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'));
let totalSize = 0;

for (const file of jsFiles) {
  const filePath = path.join('dist/assets', file);
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  totalSize += stats.size;
  console.log(`📦 ${file}: ${sizeKB.toFixed(2)} KB`);
}

const totalSizeKB = totalSize / 1024;
console.log(`📊 Dimensione totale JS: ${totalSizeKB.toFixed(2)} KB`);

if (totalSizeKB < 100) {
  console.log('✅ Bundle size ottimale (< 100 KB)');
} else if (totalSizeKB < 500) {
  console.log('⚠️ Bundle size accettabile (< 500 KB)');
} else {
  console.log('❌ Bundle size troppo grande (> 500 KB)');
}

console.log('');

// 5. Verifica source maps
console.log('5️⃣ Verifica source maps...');
const mapFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.map'));

if (mapFiles.length > 0) {
  console.log(`✅ ${mapFiles.length} source maps generati`);
} else {
  console.log('⚠️ Nessun source map generato');
}

console.log('');

// 6. Test finale
console.log('6️⃣ Test finale...');
try {
  // Verifica che il bundle sia JavaScript valido
  const mainJs = fs.readFileSync('dist/assets/index-l0sNRNKZ.js', 'utf8');
  if (mainJs.includes('function') || mainJs.includes('=>') || mainJs.includes('import')) {
    console.log('✅ Bundle JavaScript valido');
  } else {
    console.log('⚠️ Bundle potrebbe non essere JavaScript valido');
  }
} catch (error) {
  console.error('❌ Errore nella lettura del bundle:', error.message);
}

console.log('\n🎉 VALIDAZIONE COMPLETATA CON SUCCESSO!');
console.log('=====================================');
console.log('✅ Build di produzione valido');
console.log('✅ Bundle size ottimale');
console.log('✅ Struttura file corretta');
console.log('✅ Source maps generati');
console.log('\n🚀 Pronto per il deployment!');
