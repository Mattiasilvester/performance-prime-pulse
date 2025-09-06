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
  
  for (const email of testEmails) {
    
    try {
      const result = await emailValidation.validateEmail(email);
      
      
      if (result.errors.length > 0) {
      }
      
      if (result.warnings.length > 0) {
      }
      
    } catch (error) {
      console.error(`❌ Errore validazione ${email}:`, error);
    }
  }
  
}

// Esegui test se chiamato direttamente
if (typeof window !== 'undefined') {
  testEmailValidation();
}

export { testEmailValidation };

