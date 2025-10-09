import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { AdminStats } from '@/types/admin.types';

interface AdminStatsCardsProps {
  stats?: AdminStats;
  loading?: boolean;
}

export default function AdminStatsCards({ stats: propsStats, loading: propsLoading }: AdminStatsCardsProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalWorkouts: 0,
    totalPT: 0,
    weeklyGrowth: 0,
    activationD0Rate: 0,
    retentionD7: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);

  // Usa props se disponibili, altrimenti mantieni stato locale
  useEffect(() => {
    if (propsStats) {
      setStats(propsStats);
      setLoading(false);
    }
  }, [propsStats]);

  // Fallback: se non ci sono props, mantieni comportamento originale
  useEffect(() => {
    if (!propsStats && !propsLoading) {
      console.log('⚠️ AdminStatsCards: Nessun props stats fornito, usando stato locale');
    }
  }, [propsStats, propsLoading]);

  // 🎉 Notifica visiva quando ci sono nuovi utenti
  useEffect(() => {
    if (stats.totalUsers > lastCount && lastCount > 0) {
      // Nuovo utente rilevato!
      console.log('🎉 NUOVO UTENTE!', stats.totalUsers);
      
      // Highlight temporaneo della card obiettivo
      const card = document.querySelector('[data-card="objective"]') as HTMLElement | null;
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
      title: "ACTIVATION D0 RATE",
      value: `${stats.activationD0Rate}%`,
      subtitle: stats.activationD0Rate >= 40 ? "✅ Target raggiunto" : "⚠️ Sotto target 40%",
      icon: "🚀",
      color: stats.activationD0Rate >= 40 ? "green" : "red"
    },
    {
      title: "RETENTION D7",
      value: `${stats.retentionD7}%`,
      subtitle: stats.retentionD7 >= 20 ? "✅ Target raggiunto" : "⚠️ Sotto target 20%",
      icon: "🔄",
      color: stats.retentionD7 >= 20 ? "green" : "orange"
    },
    {
      title: "WEEKLY GROWTH",
      value: `+${stats.weeklyGrowth}`,
      subtitle: "Nuovi utenti/settimana",
      icon: "📈", 
      color: "blue"
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

  const isLoading = propsLoading !== undefined ? propsLoading : loading;
  
  if (isLoading) {
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