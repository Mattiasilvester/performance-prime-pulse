import { onboardingService } from '@/services/onboardingService';

/**
 * Script di test per verificare service onboarding
 * ESEGUIRE SOLO IN DEVELOPMENT
 * ELIMINARE DOPO TEST
 * 
 * USO:
 * import { testOnboardingService } from '@/test-onboarding-service';
 * testOnboardingService('user-id-here');
 */
export async function testOnboardingService(userId: string) {
  console.log('🧪 Testing Onboarding Service...');
  console.log('User ID:', userId);

  // Test 1: Load data
  console.log('\n1️⃣ Loading data...');
  const data = await onboardingService.loadOnboardingData(userId);
  console.log('Data:', data);

  // Test 2: Save data
  console.log('\n2️⃣ Saving data...');
  const saveResult = await onboardingService.saveOnboardingData(userId, {
    obiettivo: 'massa',
    livello_esperienza: 'principiante',
    giorni_settimana: 3,
    luoghi_allenamento: ['casa', 'palestra'],
    tempo_sessione: 45,
  });
  console.log('Save result:', saveResult);

  // Test 3: Get summary
  console.log('\n3️⃣ Getting summary...');
  const summary = await onboardingService.getOnboardingSummary(userId);
  console.log('Summary:', summary);

  // Test 4: Check complete
  console.log('\n4️⃣ Checking if complete...');
  const isComplete = await onboardingService.checkOnboardingComplete(userId);
  console.log('Is complete:', isComplete);

  // Test 5: Build hash
  if (data) {
    console.log('\n5️⃣ Building hash...');
    const hash = onboardingService.buildResponsesHash(data);
    console.log('Hash:', hash);
  }

  console.log('\n✅ Tests completed!');
}

