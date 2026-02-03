/**
 * Step 9: BarChart confronto mese corrente vs precedente — Ricavi, Costi, Margine.
 */
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

interface MonthComparisonChartProps {
  data: {
    current: { revenue: number; costs: number; margin: number };
    previous: { revenue: number; costs: number; margin: number };
  } | null;
  loading?: boolean;
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
      <div className="h-[300px] w-full bg-gray-800/50 rounded animate-pulse" />
    </div>
  );
}

export function MonthComparisonChart({ data, loading }: MonthComparisonChartProps) {
  if (loading) {
    return <ChartSkeleton title="Confronto Mese Corrente vs Precedente" />;
  }
  if (!data) return null;

  const chartData = [
    { name: 'Ricavi', meseCorrente: data.current.revenue, mesePrecedente: data.previous.revenue },
    { name: 'Costi', meseCorrente: data.current.costs, mesePrecedente: data.previous.costs },
    { name: 'Margine', meseCorrente: data.current.margin, mesePrecedente: data.previous.margin },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Confronto Mese Corrente vs Precedente</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`€ ${value.toLocaleString('it-IT')}`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
          <Bar dataKey="meseCorrente" name="Mese corrente" fill="#EEBA2B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="mesePrecedente" name="Mese precedente" fill="#6B7280" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
