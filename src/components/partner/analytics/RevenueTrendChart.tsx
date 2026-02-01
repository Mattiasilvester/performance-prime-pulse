/**
 * Step 9: LineChart ricavi mensili — oro #EEBA2B.
 */
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: 12,
};

interface RevenueTrendChartProps {
  data?: { month: string; revenue: number }[];
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

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  if (loading || data == null) {
    return <ChartSkeleton title="Trend Ricavi" />;
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Trend Ricavi</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EEBA2B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EEBA2B" stopOpacity={0.05} />
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
            formatter={(value: number) => [`€ ${value.toLocaleString('it-IT')}`, 'Ricavi']}
          />
          <Area type="monotone" dataKey="revenue" fill="url(#revenueFill)" stroke="none" />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#EEBA2B"
            strokeWidth={2}
            dot={{ fill: '#EEBA2B', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
