
import { Star, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const professionals = [
  {
    id: 1,
    name: 'Dr. Marco Rossi',
    specialty: 'Personal Trainer',
    rating: 4.9,
    reviews: 127,
    experience: '8 anni',
    price: '€50/h',
    avatar: '👨‍⚕️',
    available: true,
  },
  {
    id: 2,
    name: 'Dott.ssa Laura Bianchi',
    specialty: 'Nutrizionista',
    rating: 4.8,
    reviews: 89,
    experience: '5 anni',
    price: '€60/h',
    avatar: '👩‍⚕️',
    available: true,
  },
  {
    id: 3,
    name: 'Giuseppe Verdi',
    specialty: 'Fisioterapista',
    rating: 4.7,
    reviews: 156,
    experience: '12 anni',
    price: '€45/h',
    avatar: '🧑‍⚕️',
    available: false,
  },
];

export const ProfessionalsList = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Professionisti</h3>
        <Button variant="ghost" size="sm" className="text-blue-600">
          Esplora tutti
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-start space-x-3 mb-3">
              <div className="text-2xl">{professional.avatar}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {professional.name}
                </h4>
                <p className="text-sm text-slate-600">{professional.specialty}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-slate-700 ml-1">
                      {professional.rating}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">
                    ({professional.reviews} recensioni)
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${professional.available ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
            
            <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
              <span>{professional.experience} esperienza</span>
              <span className="font-semibold text-slate-900">{professional.price}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" className="flex-1">
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!professional.available}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Prenota
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
