import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function inspectDatabase() {
  console.log('🔍 Discovering REAL Performance Prime Database Structure...');
  
  const inspection: any = {
    discoveredTables: [],
    authUsers: 0,
    profiles: { count: 0, sample: [], columns: [] },
    customTables: [],
    errors: []
  };

  try {
    // 1. Scopri tutte le tabelle esistenti con query RPC
    console.log('🔍 Step 1: Discovering all tables...');
    
    try {
      const { data: tablesRPC } = await supabaseAdmin
        .rpc('get_schema_tables');
      
      if (tablesRPC) {
        inspection.discoveredTables = tablesRPC;
        console.log('✅ Tables found via RPC:', tablesRPC);
      }
    } catch (rpcError) {
      console.log('❌ RPC method not available, trying alternative...');
    }

    // 2. Metodo alternativo - prova tabelle comuni
    const commonTables = [
      'profiles', 'users', 'user_profiles',
      'workouts', 'exercises', 'workout_plans', 'training_sessions',
      'subscriptions', 'payments', 'stripe_customers',
      'goals', 'progress', 'measurements',
      'admin_users', 'admin_sessions', 'admin_audit_logs'
    ];

    console.log('🔍 Step 2: Testing common table names...');
    
    for (const tableName of commonTables) {
      try {
        const { data, error, count } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (!error) {
          inspection.customTables.push({
            name: tableName,
            count: count,
            hasData: data && data.length > 0,
            sample: data?.[0] || null
          });
          console.log(`✅ Table "${tableName}" exists with ${count} records`);
        }
      } catch (tableError) {
        // Tabella non esiste, continua
      }
    }

    // 3. Analisi dettagliata tabella profiles
    console.log('🔍 Step 3: Analyzing profiles table...');
    
    const { data: profiles, count: profileCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profiles && profiles.length > 0) {
      inspection.profiles = {
        count: profileCount,
        sample: profiles.map(p => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          created_at: p.created_at,
          all_columns: Object.keys(p)
        })),
        columns: Object.keys(profiles[0])
      };
      
      console.log('✅ Profiles analysis:', inspection.profiles);
    }

    // 4. Conta utenti auth
    console.log('🔍 Step 4: Checking auth users...');
    
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin?.listUsers();
      if (authUsers) {
        inspection.authUsers = authUsers.users.length;
        console.log('✅ Auth users:', authUsers.users.length);
      }
    } catch (authError) {
      console.log('❌ Cannot access auth.admin');
    }

    // 5. Prova a scoprire tabelle con informazioni schema
    console.log('🔍 Step 5: Schema discovery...');
    
    try {
      // Query per scoprire tabelle dal information_schema
      const { data: schemaTables } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaTables) {
        inspection.schemaTables = schemaTables.map(t => t.table_name);
        console.log('✅ Schema tables:', schemaTables);
      }
    } catch (schemaError) {
      console.log('❌ Cannot access information_schema');
    }

  } catch (error) {
    console.error('❌ General inspection error:', error);
    inspection.errors.push(error);
  }

  console.log('📊 COMPLETE DATABASE DISCOVERY:', inspection);
  return inspection;
}