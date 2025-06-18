
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
    <div className="bg-black rounded-2xl p-6 shadow-lg border-2 border-pp-gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Progressi Settimanali</h3>
        <span className="text-sm text-white">Questa settimana</span>
      </div>
      
      <div className="h-64">
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
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-pp-gold/80">
          <span className="font-semibold text-pp-gold">11 allenamenti</span> completati questa settimana
        </p>
      </div>
    </div>
  );
};
