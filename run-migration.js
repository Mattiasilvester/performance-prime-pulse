/**
 * Script per eseguire migration SQL su Supabase
 * Usa Service Role Key per bypassare RLS
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurazione Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kfxoyucatvvcgmqalxsg.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI0NzY1OSwiZXhwIjoyMDY1ODIzNjU5fQ.uUYhj86MjOS2y4P0XS1okWYZNqRp2iZ0rO4TE1INh3E';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🔧 Esecuzione migration: fix_workout_stats_trigger');
    console.log('📍 Database:', SUPABASE_URL);
    
    // Leggi file SQL
    const sqlFile = join(__dirname, 'supabase/migrations/20251010_fix_workout_stats_trigger.sql');
    const sql = readFileSync(sqlFile, 'utf-8');
    
    console.log('📄 SQL caricato, lunghezza:', sql.length, 'caratteri');
    
    // Esegui SQL usando rpc (più sicuro per DDL)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Errore esecuzione SQL:', error);
      
      // Fallback: prova con query diretta (meno sicuro ma funziona)
      console.log('🔄 Tentativo con approccio alternativo...');
      
      // Split SQL in statements individuali
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`📋 Trovati ${statements.length} statements SQL`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`\n▶️ Esecuzione statement ${i + 1}/${statements.length}...`);
        console.log(`SQL: ${statement.substring(0, 100)}...`);
        
        // NOTA: Supabase JS client non supporta DDL direttamente
        // Questo approccio NON funzionerà - serve SQL Editor o CLI
        console.warn('⚠️ ATTENZIONE: Supabase JS non supporta DDL (CREATE TRIGGER, ecc.)');
        console.warn('⚠️ Devi eseguire la migration manualmente:');
        console.warn('   1. Vai su https://supabase.com/dashboard/project/kfxoyucatvvcgmqalxsg/editor');
        console.warn('   2. Copia il contenuto di: supabase/migrations/20251010_fix_workout_stats_trigger.sql');
        console.warn('   3. Incolla ed esegui nel SQL Editor');
        return;
      }
    }
    
    console.log('✅ Migration completata con successo!');
    console.log('📊 Risultato:', data);
    
  } catch (error) {
    console.error('❌ Errore durante migration:', error);
    process.exit(1);
  }
}

runMigration();


