/**
 * Test per la validazione email
 * Verifica che le email comuni come Gmail vengano accettate
 */

import emailValidation from '../services/emailValidation.js';

// Test con email Gmail (che causava il problema)
const testEmails = [
  'nicholascapponi@gmail.com',
  'mario.rossi@gmail.com',
  'test@yahoo.com',
  'user@hotmail.com',
  'example@outlook.com',
  'test@icloud.com'
];

async function testEmailValidation() {
  console.log('🧪 Test validazione email...');
  
  for (const email of testEmails) {
    console.log(`\n📧 Testando: ${email}`);
    
    try {
      const result = await emailValidation.validateEmail(email);
      
      console.log(`✅ Risultato: ${result.valid ? 'VALIDA' : 'NON VALIDA'}`);
      console.log(`📊 Score: ${result.score}/100`);
      console.log(`🔍 Checks:`, result.checks);
      
      if (result.errors.length > 0) {
        console.log(`❌ Errori:`, result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.log(`⚠️ Warning:`, result.warnings);
      }
      
    } catch (error) {
      console.error(`❌ Errore validazione ${email}:`, error);
    }
  }
  
  console.log('\n✅ Test completato!');
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testEmailValidation();
}

export { testEmailValidation };
