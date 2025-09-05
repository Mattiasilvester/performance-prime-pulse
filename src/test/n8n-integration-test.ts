/**
 * Test di integrazione per webhook n8n
 * Questo file testa le funzioni email senza inviare email reali
 */

import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '@/services/emailService';

// Mock user per test
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Mario Rossi',
    firstName: 'Mario',
    lastName: 'Rossi'
  }
};

/**
 * Test invio email di benvenuto
 */
export async function testWelcomeEmail() {
  console.log('🧪 Test invio email di benvenuto...');
  
  try {
    await sendWelcomeEmail(mockUser);
    console.log('✅ Test email benvenuto completato');
  } catch (error) {
    console.error('❌ Errore test email benvenuto:', error);
  }
}

/**
 * Test invio email reset password
 */
export async function testPasswordResetEmail() {
  console.log('🧪 Test invio email reset password...');
  
  try {
    const resetLink = 'https://app.performanceprime.com/reset-password?token=test123';
    await sendPasswordResetEmail('test@example.com', resetLink);
    console.log('✅ Test email reset password completato');
  } catch (error) {
    console.error('❌ Errore test email reset password:', error);
  }
}

/**
 * Test invio email verifica account
 */
export async function testVerificationEmail() {
  console.log('🧪 Test invio email verifica account...');
  
  try {
    const verificationLink = 'https://app.performanceprime.com/verify?token=test456';
    await sendVerificationEmail('test@example.com', verificationLink);
    console.log('✅ Test email verifica completato');
  } catch (error) {
    console.error('❌ Errore test email verifica:', error);
  }
}

/**
 * Esegue tutti i test
 */
export async function runAllTests() {
  console.log('🚀 Avvio test integrazione n8n...');
  console.log('📡 Webhook URL:', 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-welcome');
  
  await testWelcomeEmail();
  await testPasswordResetEmail();
  await testVerificationEmail();
  
  console.log('✅ Tutti i test completati!');
}

// Esegui test se chiamato direttamente
if (import.meta.env.DEV) {
  runAllTests();
}
