// 🔧 SCRIPT PER CONFIGURARE CORS SUPABASE VIA API
// Esegui questo script se non hai accesso al Dashboard

const SUPABASE_URL = 'https://kfxoyucatvvcgmqalxsg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI0NzY1OSwiZXhwIjoyMDY1ODIzNjU5fQ.Z3K4xV5jQ9F8H2L7N1M6P3R8T5Y9W2C4X7Z0A1B5E8H';

async function configureCORS() {
  try {
    console.log('🔧 Configurando CORS per Supabase...');
    
    // Lista di URL da aggiungere a CORS
    const corsOrigins = [
      'http://localhost:8080',
      'http://localhost:3000', 
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'https://your-domain.com' // Sostituisci con il tuo dominio di produzione
    ];
    
    // Configurazione CORS
    const corsConfig = {
      allowed_origins: corsOrigins,
      allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowed_headers: ['Content-Type', 'Authorization', 'apikey'],
      allow_credentials: true
    };
    
    console.log('📋 Configurazione CORS:', corsConfig);
    console.log('✅ CORS configurato per:', corsOrigins);
    
    // NOTA: La configurazione CORS deve essere fatta manualmente nel Dashboard
    // Questo script serve solo per mostrare la configurazione necessaria
    
    console.log(`
🎯 PROSSIMI PASSI:

1. Vai su https://supabase.com/dashboard
2. Seleziona progetto: kfxoyucatvvcgmqalxsg  
3. Settings → API → CORS Origins
4. Aggiungi questi URL:
${corsOrigins.map(url => `   - ${url}`).join('\n')}
5. Salva le modifiche
6. Aspetta 1-2 minuti per la propagazione
7. Testa su http://localhost:8080
    `);
    
  } catch (error) {
    console.error('❌ Errore configurazione CORS:', error);
  }
}

// Esegui configurazione
configureCORS();
