/**
 * Step 9: PieChart distribuzione costi per categoria (mese corrente).
 */
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#EEBA2B',
  '#3B82F6',
  '#22C55E',
  '#EF4444',
  '#A855F7',
  '#F97316',
  '#06B6D4',
  '#EC4899',
  '#6B7280',
];

const TOOLTIP_STYLE = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

interface CostsDistributionChartProps {
  data?: { name: string; value: number }[];
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

export function CostsDistributionChart({ data, loading }: CostsDistributionChartProps) {
  if (loading) {
    return <ChartSkeleton title="Distribuzione Costi (mese corrente)" />;
  }
  const safeData = data ?? [];
  const total = safeData.reduce((s, d) => s + d.value, 0);
  const withColor = safeData.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));

  if (safeData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Distribuzione Costi</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Nessun costo nel mese corrente
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-1">Distribuzione Costi (mese corrente)</h3>
      <p className="text-[#EEBA2B] text-sm mb-4">Totale: € {total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={withColor as { name: string; value: number; color: string }[]}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#9CA3AF' }}
          >
            {withColor.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string, props: { payload: { value: number } }) => {
              const p = total > 0 ? ((props.payload.value / total) * 100).toFixed(0) : '0';
              return [`€ ${value.toLocaleString('it-IT')} (${p}%)`, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
