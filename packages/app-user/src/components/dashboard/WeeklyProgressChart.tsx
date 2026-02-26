import { memo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklyData } from './WeeklyProgress';

type WeeklyProgressChartProps = {
  data: WeeklyData[];
};

const WeeklyProgressChart = ({ data }: WeeklyProgressChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#EEBA2B', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
        />
        <YAxis
          tick={{ fill: '#EEBA2B', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
        />
        <Bar
          dataKey="workouts"
          fill="#EEBA2B"
          radius={[4, 4, 0, 0]}
          className="hover:opacity-80 transition-opacity"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default memo(WeeklyProgressChart);

