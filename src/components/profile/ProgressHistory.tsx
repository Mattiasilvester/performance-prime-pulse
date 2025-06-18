
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const progressData = [
  { month: 'Gen', workouts: 12, hours: 18 },
  { month: 'Feb', workouts: 16, hours: 24 },
  { month: 'Mar', workouts: 14, hours: 21 },
  { month: 'Apr', workouts: 18, hours: 28 },
  { month: 'Mag', workouts: 22, hours: 35 },
  { month: 'Giu', workouts: 20, hours: 32 },
];

export const ProgressHistory = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Storico Progressi</h3>
        <select className="text-sm border border-slate-300 rounded-lg px-3 py-1">
          <option>Ultimi 6 mesi</option>
          <option>Ultimo anno</option>
          <option>Tutto il tempo</option>
        </select>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
            />
            <Line 
              type="monotone" 
              dataKey="workouts" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="hours" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-slate-900">Allenamenti</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">20</div>
          <div className="text-sm text-slate-600">Questo mese</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-slate-900">Ore totali</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">32h</div>
          <div className="text-sm text-slate-600">Questo mese</div>
        </div>
      </div>
    </div>
  );
};
