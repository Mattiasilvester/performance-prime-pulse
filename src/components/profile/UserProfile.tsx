
import { Edit, MapPin, Calendar, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UserProfile = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      
      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-12 left-6">
          <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-4xl">
            👨‍💼
          </div>
        </div>
        
        {/* Edit Button */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        </div>
        
        {/* Info */}
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-slate-900">Marco Rossi</h3>
          <p className="text-slate-600 mb-4">Appassionato di fitness e benessere</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">89</div>
              <div className="text-sm text-slate-600">Allenamenti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-sm text-slate-600">Medaglie</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">156h</div>
              <div className="text-sm text-slate-600">Tempo totale</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-slate-600">Obiettivi</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>Milano, Italia</span>
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Membro da Gennaio 2024</span>
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <Trophy className="h-4 w-4 mr-2" />
              <span>Livello: Intermedio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
