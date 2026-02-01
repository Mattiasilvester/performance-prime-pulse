/**
 * Step 9: AreaChart margine netto — verde/rosso, linea bianca, reference 0.
 */
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

interface MarginTrendChartProps {
  data?: { month: string; margin: number }[];
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

export function MarginTrendChart({ data, loading }: MarginTrendChartProps) {
  if (loading || data == null) {
    return <ChartSkeleton title="Trend Margine Netto" />;
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Trend Margine Netto</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#22C55E" stopOpacity={0.05} />
              <stop offset="50%" stopColor="#EF4444" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
            </linearGradient>
          </defs>
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
            formatter={(value: number) => {
              const s = value >= 0 ? `€ ${value.toLocaleString('it-IT')}` : `−€ ${Math.abs(value).toLocaleString('it-IT')}`;
              return [s, 'Margine'];
            }}
          />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="margin"
            stroke="#FFFFFF"
            strokeWidth={2}
            fill="url(#marginGradient)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
