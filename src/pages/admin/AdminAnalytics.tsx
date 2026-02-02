import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface AnalyticsMonth {
  month: string;
  monthKey: string;
  users: number;
  professionals: number;
  revenue: number;
  revenueB2B: number;
  revenueB2C: number;
  mrrTotal: number;
}

export interface AnalyticsResponse {
  months: AnalyticsMonth[];
  activeTrialsCount?: number;
}

async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY non configurata');

  const res = await fetch(`${FUNCTIONS_URL}/admin-analytics`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Errore caricamento analytics');
  }
  const data = await res.json();
  return {
    months: Array.isArray(data.months) ? data.months : [],
    activeTrialsCount: typeof data.activeTrialsCount === 'number' ? data.activeTrialsCount : 0,
  };
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsMonth[]>([]);
  const [activeTrialsCount, setActiveTrialsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics();
      setData(result.months);
      setActiveTrialsCount(result.activeTrialsCount ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento');
      setData([]);
      setActiveTrialsCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl animate-pulse h-[320px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-6">
          {error}
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
        >
          Riprova
        </button>
      </div>
    );
  }

  const defaultPoint: AnalyticsMonth = {
    month: '—',
    monthKey: 'fallback',
    users: 0,
    professionals: 0,
    revenue: 0,
    revenueB2B: 0,
    revenueB2C: 0,
    mrrTotal: 0,
  };
  const chartData = data.length > 0 ? data : [defaultPoint];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Dati reali da database. Legenda: B2C = utenti; B2B = professionisti; MRR = ricavi ricorrenti mensili.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
            Trial attivi B2B: {activeTrialsCount}
          </span>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            Aggiorna
          </button>
        </div>
      </div>

      {/* Legenda: quali grafici sono B2B / B2C */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-300 text-sm"><strong>Utenti (B2C)</strong> – Grafico 1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-gray-300 text-sm"><strong>Professionisti (B2B)</strong> – Grafico 2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-gray-300 text-sm"><strong>Revenue / MRR (B2B + B2C)</strong> – Grafici 3 e 4</span>
        </div>
      </div>

      {/* Riga 1: Grafico 1 (Utenti B2C) | Grafico 2 (Professionisti B2B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-1">1. Crescita Utenti (B2C)</h2>
          <p className="text-gray-500 text-xs mb-4">Solo utenti: esclusi i professionisti.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} key="chart-users-b2c">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="Utenti B2C" key="line-users" />
            </LineChart>
          </ResponsiveContainer>
          {data.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Nessun dato negli ultimi 6 mesi.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-1">2. Crescita Professionisti (B2B)</h2>
          <p className="text-gray-500 text-xs mb-4">Solo professionisti PrimePro.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} key="chart-professionals-b2b">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
              <Line type="monotone" dataKey="professionals" stroke="#8B5CF6" strokeWidth={2} name="Professionisti B2B" key="line-professionals" />
            </LineChart>
          </ResponsiveContainer>
          {data.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Nessun dato negli ultimi 6 mesi.</p>
          )}
        </div>
      </div>

      {/* Riga 2: Grafico 3 (Revenue mensile) | Grafico 4 (MRR Totale) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-1">3. Revenue Mensile (B2B + B2C)</h2>
          <p className="text-gray-500 text-xs mb-4">Totale incassi da abbonamenti.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} key="chart-revenue-total">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(v) => `€${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} formatter={(v: number) => [`€${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6B7280" strokeWidth={2} name="Revenue" key="line-revenue" />
            </LineChart>
          </ResponsiveContainer>
          {data.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Nessun dato negli ultimi 6 mesi.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-1">4. MRR Totale (B2B + B2C)</h2>
          <p className="text-gray-500 text-xs mb-4">Monthly Recurring Revenue: ricavi ricorrenti mensili da abbonamenti.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} key="chart-mrr-total">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(v) => `€${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} formatter={(v: number) => [`€${v}`, 'MRR']} />
              <Line type="monotone" dataKey="mrrTotal" stroke="#F59E0B" strokeWidth={2} name="MRR Totale" key="line-mrr" />
            </LineChart>
          </ResponsiveContainer>
          {data.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Nessun dato negli ultimi 6 mesi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
