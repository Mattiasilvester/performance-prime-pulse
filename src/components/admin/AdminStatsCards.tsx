import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default function AdminStatsCards() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalWorkouts: 0,
    totalPT: 0,
    weeklyGrowth: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);

  const fetchStats = async () => {
    console.log('🔍 RICALCOLO UTENTI ATTIVI CORRETTO:');
    setLoading(true);
    
    try {
      // USA supabaseAdmin invece di supabase normale
      const { count: totalUsers, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total users result:', { totalUsers, usersError });
      
      if (usersError) {
        console.error('Users count error:', usersError);
        throw usersError;
      }

      // 🔍 CALCOLO UTENTI ONLINE ORA - Solo chi è connesso adesso
      console.log('🔍 CALCOLO UTENTI ONLINE ORA - Solo chi è connesso adesso');
      
      // Conta solo utenti online negli ultimi 5 minuti
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const { data: onlineUsers, error: onlineError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, last_login')
        .gte('last_login', fiveMinutesAgo.toISOString());
      
      console.log('🟢 Utenti online ORA (ultimi 5 min):', onlineUsers?.length || 0);
      console.log('🟢 Utenti online:', onlineUsers?.map(u => u.email) || []);
      
      if (onlineError) {
        console.error('❌ Errore query online:', onlineError);
      }
      
      const currentlyActiveUsers = onlineUsers?.length || 0;

      // Altri conteggi
      const { count: totalWorkouts } = await supabaseAdmin
        .from('custom_workouts')
        .select('*', { count: 'exact', head: true });

      const { count: totalPT } = await supabaseAdmin
        .from('professionals')
        .select('*', { count: 'exact', head: true });

      // Crescita settimanale
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: weeklyNewUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      const statsData = {
        totalUsers: totalUsers || 0,
        activeUsers: currentlyActiveUsers, // Solo chi è online ORA
        inactiveUsers: (totalUsers || 0) - currentlyActiveUsers,
        totalWorkouts: totalWorkouts || 0,
        totalPT: totalPT || 0,
        weeklyGrowth: weeklyNewUsers || 0
      };

      console.log('📊 RIEPILOGO FINALE:');
      console.log('- Utenti totali:', totalUsers);
      console.log('- Utenti online ORA:', currentlyActiveUsers);
      console.log('- Utenti offline:', (totalUsers || 0) - currentlyActiveUsers);
      console.log('- Percentuale online:', 
        Math.round((currentlyActiveUsers / (totalUsers || 1)) * 100) + '%');
      console.log('✅ Final stats with ADMIN client:', statsData);
      
      setStats(statsData);

    } catch (error) {
      console.error('❌ Stats error:', error);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalWorkouts: 0,
        totalPT: 0,
        weeklyGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 🎉 Notifica visiva quando ci sono nuovi utenti
  useEffect(() => {
    if (stats.totalUsers > lastCount && lastCount > 0) {
      // Nuovo utente rilevato!
      console.log('🎉 NUOVO UTENTE!', stats.totalUsers);
      
      // Highlight temporaneo della card obiettivo
      const card = document.querySelector('[data-card="objective"]');
      if (card) {
        card.style.boxShadow = '0 0 20px #00ff00';
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
          card.style.boxShadow = '';
          card.style.transform = '';
        }, 3000);
      }
    }
    setLastCount(stats.totalUsers);
  }, [stats.totalUsers, lastCount]);

  const cards = [
    {
      title: "OBIETTIVO: 500 UTENTI",
      value: `${stats.totalUsers}/500`,
      percentage: Math.round((stats.totalUsers / 500) * 100 * 10) / 10,
      subtitle: `${stats.activeUsers} online • Aggiornato: ${new Date().toLocaleTimeString('it-IT')}`,
      icon: stats.totalUsers >= 500 ? "🎉" : "🎯",
      color: stats.totalUsers >= 500 ? "green" : stats.totalUsers >= 250 ? "yellow" : "red",
      'data-card': 'objective'
    },
    {
      title: "UTENTI ONLINE ORA",
      value: stats.activeUsers,
      subtitle: "Connessi negli ultimi 5 min",
      icon: "🟢",
      color: "green"
    },
    {
      title: "Utenti Inattivi", 
      value: stats.inactiveUsers,
      subtitle: "Da riattivare",
      icon: "😴",
      color: "orange"
    },
    {
      title: "Crescita Settimanale",
      value: `+${stats.weeklyGrowth}`,
      subtitle: "Nuovi utenti",
      icon: "📈", 
      color: "blue"
    },
    {
      title: "Allenamenti Totali",
      value: stats.totalWorkouts,
      subtitle: "Workout creati",
      icon: "💪",
      color: "purple"
    },
    {
      title: "Personal Trainer",
      value: stats.totalPT,
      subtitle: "PT registrati",
      icon: "🏋️‍♂️",
      color: "indigo"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: "bg-green-600 border-green-500",
      yellow: "bg-yellow-600 border-yellow-500", 
      red: "bg-red-600 border-red-500",
      blue: "bg-blue-600 border-blue-500",
      purple: "bg-purple-600 border-purple-500",
      orange: "bg-orange-600 border-orange-500",
      indigo: "bg-indigo-600 border-indigo-500"
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`p-6 rounded-lg border-2 ${getColorClasses(card.color)}`}
          data-card={card['data-card'] || ''}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
              {card.title}
            </h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          
          <div className="text-3xl font-bold text-white mb-2">
            {card.value}
          </div>
          
          {card.percentage && (
            <div className="mb-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(card.percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-300 mt-1">{card.percentage}% completato</p>
            </div>
          )}
          
          {card.subtitle && (
            <p className="text-gray-300 text-sm">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}