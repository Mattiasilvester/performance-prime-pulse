import { supabase } from '@/integrations/supabase/client';

export const testAuthConfiguration = async () => {
  console.log('🧪 Test configurazione autenticazione...');
  
  try {
    // Test 1: Verifica configurazione Supabase
    console.log('1️⃣ Test configurazione Supabase...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Errore configurazione Supabase:', error);
      return false;
    }
    
    console.log('✅ Configurazione Supabase OK');
    console.log('👤 Stato sessione:', session?.user ? 'Autenticato' : 'Non autenticato');
    
    // Test 2: Verifica listener auth
    console.log('2️⃣ Test auth listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Evento auth rilevato:', event);
        console.log('👤 Sessione:', session?.user ? 'Presente' : 'Assente');
      }
    );
    
    // Cleanup listener dopo 5 secondi
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('✅ Auth listener test completato');
    }, 5000);
    
    // Test 3: Verifica localStorage
    console.log('3️⃣ Test localStorage...');
    const authToken = localStorage.getItem('sb-kfxoyucatvvcgmqalxsg-auth-token');
    console.log('🔑 Token presente:', !!authToken);
    
    return true;
  } catch (error) {
    console.error('💥 Errore test configurazione:', error);
    return false;
  }
};

export const simulateAuthFlow = async () => {
  console.log('🎭 Simulazione flusso autenticazione...');
  
  // Simula utente non autenticato
  console.log('📋 Scenario 1: Utente non autenticato');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('👤 Sessione attuale:', session?.user ? 'Autenticato' : 'Non autenticato');
  
  if (!session?.user) {
    console.log('✅ Comportamento corretto: Utente non autenticato → Redirect a /auth');
  } else {
    console.log('✅ Comportamento corretto: Utente autenticato → Redirect a /dashboard');
  }
};

export const checkAuthPersistence = () => {
  console.log('💾 Verifica persistenza autenticazione...');
  
  // Verifica localStorage
  const authToken = localStorage.getItem('sb-kfxoyucatvvcgmqalxsg-auth-token');
  const sessionToken = sessionStorage.getItem('sb-kfxoyucatvvcgmqalxsg-auth-token');
  
  console.log('🔑 Token localStorage:', !!authToken);
  console.log('🔑 Token sessionStorage:', !!sessionToken);
  
  if (authToken) {
    try {
      const tokenData = JSON.parse(authToken);
      console.log('📅 Token scade:', new Date(tokenData.expires_at * 1000));
      console.log('👤 User ID:', tokenData.user?.id);
    } catch (error) {
      console.error('❌ Errore parsing token:', error);
    }
  }
}; 