
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
          <div key={professional.id} className="prof-card">
            <div className="prof-card__avatar">
              <div className="text-2xl flex items-center justify-center w-full h-full">
                {professional.avatar}
              </div>
            </div>
            
            <div className="prof-card__content">
              <h4 className="prof-card__name">
                {professional.name}
              </h4>
              <p className="prof-card__role">{professional.specialty}</p>
              
              <div className="prof-card__rating">
                <Star className="h-3 w-3 prof-card__rating-star fill-current" />
                <span className="prof-card__rating-value text-sm ml-1">
                  {professional.rating}
                </span>
                <span className="text-sm text-slate-500 ml-1">
                  ({professional.reviews} recensioni)
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="prof-card__experience">{professional.experience} esperienza</span>
                <span className="prof-card__rate font-semibold">{professional.price}</span>
              </div>
              
              <div className="prof-card__actions">
                <button className="prof-card__chat-btn flex-1">
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </button>
                <button 
                  className="prof-card__book-btn flex-1"
                  disabled={!professional.available}
                >
                  <Calendar className="h-3 w-3" />
                  Prenota
                </button>
              </div>
            </div>
            
            <div className={`prof-card__status-dot ${professional.available ? 'online' : 'offline'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
