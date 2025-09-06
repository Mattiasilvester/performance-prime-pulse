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
  
  try {
    await sendWelcomeEmail(mockUser);
  } catch (error) {
    console.error('❌ Errore test email benvenuto:', error);
  }
}

/**
 * Test invio email reset password
 */
export async function testPasswordResetEmail() {
  
  try {
    const resetLink = 'https://app.performanceprime.com/reset-password?token=test123';
    await sendPasswordResetEmail('test@example.com', resetLink);
  } catch (error) {
    console.error('❌ Errore test email reset password:', error);
  }
}

/**
 * Test invio email verifica account
 */
export async function testVerificationEmail() {
  
  try {
    const verificationLink = 'https://app.performanceprime.com/verify?token=test456';
    await sendVerificationEmail('test@example.com', verificationLink);
  } catch (error) {
    console.error('❌ Errore test email verifica:', error);
  }
}

/**
 * Esegue tutti i test
 */
export async function runAllTests() {
  
  await testWelcomeEmail();
  await testPasswordResetEmail();
  await testVerificationEmail();
  
}

// Esegui test se chiamato direttamente
if (import.meta.env.DEV) {
  runAllTests();
}

