import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function DatabaseDiagnostic() {
  interface DiagnosticResults {
    profiles?: { success?: boolean; count?: number; error?: string; sample?: unknown };
    permissions?: { canRead?: boolean; error?: string };
    [key: string]: unknown;
  }
  const [results, setResults] = useState<DiagnosticResults>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runFullDiagnostic();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const runFullDiagnostic = async () => {
    console.log('🔍 DIAGNOSTIC: Starting full database check...');
    const diagnostic: DiagnosticResults = {};

    try {
      // Test 1: Raw query to profiles
      const { data: profiles, error: e1 } = await supabase
        .from('profiles')
        .select('*');
      
      diagnostic.profiles = {
        success: !e1,
        count: profiles?.length || 0,
        error: e1?.message,
        sample: profiles?.[0]
      };

      // Test 2: Check if auth.users exists
      const { data: authTest, error: e2 } = await supabase
        .rpc('get_user_count', {});
      
      diagnostic.authUsers = {
        error: e2?.message || 'RPC may not exist'
      };

      // Test 3: Direct SQL via RPC (if possible)
      const { data: sqlTest, error: e3 } = await supabase
        .rpc('exec_sql', { query: 'SELECT COUNT(*) FROM profiles' });
      
      diagnostic.directSQL = {
        error: e3?.message || 'Direct SQL not available'
      };

      // Test 4: Check permissions
      const { data: permissions, error: e4 } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      diagnostic.permissions = {
        canRead: !e4,
        error: e4?.message
      };

    } catch (error: unknown) {
      diagnostic.generalError = (error as Error)?.message;
    }

    setResults(diagnostic);
    setLoading(false);
    console.log('📊 DIAGNOSTIC RESULTS:', diagnostic);

    // Auto-fix attempt
    if (diagnostic.profiles?.count === 0) {
      await createSampleData();
    }
  };

  const createSampleData = async () => {
    console.log('🔧 Creating sample users...');
    
    const sampleUsers = [
      { 
        id: crypto.randomUUID(),
        email: 'john.doe@example.com',
        full_name: 'John Doe',
        role: 'user',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      },
      { 
        id: crypto.randomUUID(),
        email: 'jane.smith@example.com',
        full_name: 'Jane Smith',
        role: 'premium',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      },
      { 
        id: crypto.randomUUID(),
        email: 'test.user@example.com',
        full_name: 'Test User',
        role: 'user',
        subscription_status: 'free',
        created_at: new Date().toISOString()
      }
    ];

    for (const user of sampleUsers) {
      const { error } = await supabase
        .from('profiles')
        .insert(user);
      
      if (!error) {
        console.log('✅ Created user:', user.email);
        toast.success(`Utente creato: ${user.email}`);
      } else {
        console.error('❌ Error creating user:', error);
      }
    }

    // Refresh after creating
    setTimeout(() => window.location.reload(), 2000);
  };

  if (loading) return <div className="p-8 text-white">Loading diagnostic...</div>;

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Profiles Table</h3>
          <p>Success: {results.profiles?.success ? '✅' : '❌'}</p>
          <p>Count: {results.profiles?.count || 0} users</p>
          {results.profiles?.error && <p className="text-red-400">Error: {results.profiles.error}</p>}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Permissions</h3>
          <p>Can Read: {results.permissions?.canRead ? '✅' : '❌'}</p>
          {results.permissions?.error && <p className="text-red-400">Error: {results.permissions.error}</p>}
        </div>

        <button
          onClick={createSampleData}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
        >
          Create 3 Sample Users
        </button>

        <details className="mt-4">
          <summary className="cursor-pointer text-gray-400">Raw Results</summary>
          <pre className="mt-2 p-4 bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
