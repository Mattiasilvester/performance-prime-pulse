
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockAppointments = [
  { date: 15, type: 'training', professional: 'Dr. Rossi' },
  { date: 18, type: 'nutrition', professional: 'Dott.ssa Bianchi' },
  { date: 22, type: 'physio', professional: 'Fisio Verdi' },
];

export const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const hasAppointment = (day: number) => {
    return mockAppointments.some(apt => apt.date === day);
  };

  const getAppointmentType = (day: number) => {
    const apt = mockAppointments.find(apt => apt.date === day);
    if (!apt) return null;
    
    const colors = {
      training: 'bg-blue-500',
      nutrition: 'bg-green-500',
      physio: 'bg-orange-500',
    };
    
    return colors[apt.type as keyof typeof colors] || 'bg-slate-500';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}
        {days.map(day => (
          <div
            key={day}
            className={`p-2 text-center text-sm rounded-lg cursor-pointer transition-colors relative ${
              hasAppointment(day)
                ? 'bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            {day}
            {hasAppointment(day) && (
              <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${getAppointmentType(day)}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
