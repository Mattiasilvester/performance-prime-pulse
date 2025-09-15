import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const mockData = [
    { month: 'Gen', users: 120, revenue: 3600 },
    { month: 'Feb', users: 145, revenue: 4350 },
    { month: 'Mar', users: 178, revenue: 5340 },
    { month: 'Apr', users: 203, revenue: 6090 },
    { month: 'Mag', users: 234, revenue: 7020 },
    { month: 'Giu', users: 267, revenue: 8010 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Crescita Utenti</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Revenue Mensile</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
              <Bar dataKey="revenue" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
