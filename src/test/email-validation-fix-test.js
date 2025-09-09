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
  
  for (const email of testEmails) {
    
    try {
      const result = await emailValidation.validateEmail(email);
      
      console.log(`✅ Email: ${email}`, {
        valid: result.valid,
        format: result.checks.format,
        disposable: result.checks.disposable,
        dns: result.checks.dns,
        smtp: result.checks.smtp
      });
      
      if (result.errors.length > 0) {
        console.log(`⚠️ Errori: ${result.errors.join(', ')}`);
      }
      
      if (result.warnings.length > 0) {
        console.log(`⚠️ Avvertimenti: ${result.warnings.join(', ')}`);
      }
      
      if (result.details.length > 0) {
        console.log(`ℹ️ Dettagli: ${result.details.join(', ')}`);
      }
      
      // Verifica che Gmail sia sempre valida
      if (email.includes('@gmail.com') && !result.valid) {
        console.error(`❌ ERRORE: Gmail ${email} dovrebbe essere valida!`);
      }
      
    } catch (error) {
      console.error(`❌ Errore validazione ${email}:`, error);
    }
  }
  
  console.log('🎉 Test completati!');
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testEmailValidationFix();
}

export { testEmailValidationFix };

