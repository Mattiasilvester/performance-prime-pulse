/**
 * Step 9: LineChart costi mensili — rosso #EF4444.
 */
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

interface CostsTrendChartProps {
  data?: { month: string; costs: number }[];
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

export function CostsTrendChart({ data, loading }: CostsTrendChartProps) {
  if (loading || data == null) {
    return <ChartSkeleton title="Trend Costi" />;
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Trend Costi</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`€ ${value.toLocaleString('it-IT')}`, 'Costi']}
          />
          <Line
            type="monotone"
            dataKey="costs"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ fill: '#EF4444', r: 4 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
