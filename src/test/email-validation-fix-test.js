/**
 * Test per verificare che la validazione email funzioni correttamente
 * dopo le correzioni per Gmail e altri domini comuni
 */

import emailValidation from '../services/emailValidation.js';

// Test con email Gmail che causava il problema
const testEmails = [
  'nicholascapponi@gmail.com', // Email che causava il problema
  'mario.rossi@gmail.com',
  'test@yahoo.com',
  'user@hotmail.com',
  'example@outlook.com',
  'test@icloud.com',
  'user@protonmail.com'
];

async function testEmailValidationFix() {
  console.log('🧪 Test validazione email dopo correzioni...');
  console.log('📧 Testando email Gmail che causava problemi...');
  
  for (const email of testEmails) {
    console.log(`\n📧 Testando: ${email}`);
    
    try {
      const result = await emailValidation.validateEmail(email);
      
      console.log(`✅ Risultato: ${result.valid ? 'VALIDA' : 'NON VALIDA'}`);
      console.log(`📊 Score: ${result.score}/100`);
      console.log(`🔍 Checks:`, {
        format: result.checks.format,
        disposable: result.checks.disposable,
        dns: result.checks.dns,
        smtp: result.checks.smtp
      });
      
      if (result.errors.length > 0) {
        console.log(`❌ Errori:`, result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.log(`⚠️ Warning:`, result.warnings);
      }
      
      if (result.details.length > 0) {
        console.log(`ℹ️ Dettagli:`, result.details);
      }
      
      // Verifica che Gmail sia sempre valida
      if (email.includes('@gmail.com') && !result.valid) {
        console.error(`❌ ERRORE: Gmail ${email} dovrebbe essere valida!`);
      }
      
    } catch (error) {
      console.error(`❌ Errore validazione ${email}:`, error);
    }
  }
  
  console.log('\n✅ Test completato!');
  console.log('📝 Se Gmail è valida, il problema è risolto!');
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testEmailValidationFix();
}

export { testEmailValidationFix };
