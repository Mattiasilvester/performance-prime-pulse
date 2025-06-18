
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lun', workouts: 2 },
  { name: 'Mar', workouts: 1 },
  { name: 'Mer', workouts: 3 },
  { name: 'Gio', workouts: 2 },
  { name: 'Ven', workouts: 1 },
  { name: 'Sab', workouts: 0 },
  { name: 'Dom', workouts: 2 },
];

export const WeeklyProgress = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Progressi Settimanali</h3>
        <span className="text-sm text-slate-500">Questa settimana</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
            />
            <Bar 
              dataKey="workouts" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-blue-600">11 allenamenti</span> completati questa settimana
        </p>
      </div>
    </div>
  );
};
