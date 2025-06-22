
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Gen', peso: 75, massa: 65 },
  { name: 'Feb', peso: 74, massa: 66 },
  { name: 'Mar', peso: 73, massa: 67 },
  { name: 'Apr', peso: 72, massa: 68 },
  { name: 'Mag', peso: 71, massa: 69 },
  { name: 'Giu', peso: 70, massa: 70 },
];

export const ProgressHistory = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Ultima settimana');

  const periods = [
    'Ultima settimana',
    'Ultimo mese', 
    'Ultimi 6 mesi',
    'Ultimo anno',
    'Sempre'
  ];

  return (
    <div className="bg-black rounded-2xl shadow-sm border-2 border-[#EEBA2B] p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-xl font-bold text-[#EEBA2B] mb-4 lg:mb-0">Storico Progressi</h3>
        
        {/* Desktop: Horizontal buttons */}
        <div className="hidden lg:flex space-x-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-[#EEBA2B] text-black'
                  : 'text-white hover:bg-gray-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Mobile: Dropdown */}
        <div className="lg:hidden">
          <label className="block text-sm text-white mb-2">Periodo</label>
          <select
            value={selectedPeriod}
            onChange={(e) =>  ((e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]"
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#EEBA2B" />
            <YAxis stroke="#EEBA2B" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#000', 
                border: '1px solid #EEBA2B',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="peso" 
              stroke="#38B6FF" 
              strokeWidth={3}
              name="Peso (kg)"
            />
            <Line 
              type="monotone" 
              dataKey="massa" 
              stroke="#EEBA2B" 
              strokeWidth={3}
              name="Massa Muscolare (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
