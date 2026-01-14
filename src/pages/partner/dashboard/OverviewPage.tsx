import { Users, Calendar, FolderKanban, Euro, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OverviewPage() {
  const [userName, setUserName] = useState('Professionista');
  const [stats, setStats] = useState({
    clienti: 0,
    prenotazioni: 0,
    progetti: 0,
    guadagni: 0
  });

  useEffect(() => {
    // Carica nome utente
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Carica dati professionista
        const { data: professional } = await supabase
          .from('professionals')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();
        
        if (professional) {
          setUserName(`${professional.first_name} ${professional.last_name}`);
        }
      }
    };

    loadUserData();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const statCards = [
    {
      label: 'Clienti totali',
      value: stats.clienti,
      icon: Users,
      bgColor: 'bg-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      label: 'Prenotazioni questo mese',
      value: stats.prenotazioni,
      icon: Calendar,
      bgColor: 'bg-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Progetti attivi',
      value: stats.progetti,
      icon: FolderKanban,
      bgColor: 'bg-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Guadagni mese',
      value: `€${stats.guadagni}`,
      icon: Euro,
      bgColor: 'bg-green-200',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bentornato, {userName}!
        </h1>
        <p className="text-gray-500 capitalize">{formattedDate}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prossimi Appuntamenti */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Prossimi appuntamenti
        </h2>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun appuntamento in programma</p>
        </div>
      </div>

      {/* Attività Recenti */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Attività recenti
        </h2>
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessuna attività recente</p>
        </div>
      </div>
    </div>
  );
}

