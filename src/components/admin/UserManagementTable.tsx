import React, { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminUser } from '@/types/admin.types'
import { toast } from 'sonner'

// Componente per azioni utente
const UserActions = ({ user, onUserUpdate }: { user: any, onUserUpdate: () => void }) => {
  const [loading, setLoading] = useState(false);

  const toggleUserStatus = async () => {
    setLoading(true);
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success(`Utente ${user.is_active ? 'sospeso' : 'riattivato'}`);
      onUserUpdate();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!confirm(`Eliminare definitivamente ${user.email}?`)) return;
    
    setLoading(true);
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Utente eliminato');
      onUserUpdate();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleUserStatus}
        disabled={loading}
        className={`px-3 py-1 rounded text-xs font-medium ${
          user.is_active 
            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {user.is_active ? '⏸️ Sospendi' : '▶️ Riattiva'}
      </button>
      
      <button
        onClick={deleteUser}
        disabled={loading}
        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
      >
        🗑️ Elimina
      </button>
    </div>
  );
};

interface UserManagementTableProps {
  users: AdminUser[]
  onAction: (userId: string, action: string) => void
  onUserUpdate: () => void
}

export default function UserManagementTable({ users, onAction, onUserUpdate }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  // Filtri semplici per gestire 500 utenti
  const filterOptions = [
    { value: 'all', label: 'Tutti gli utenti', count: users.length },
    { value: 'active', label: 'Solo attivi', count: users.filter(u => u.is_active_user).length },
    { value: 'inactive', label: 'Solo inattivi', count: users.filter(u => !u.is_active_user).length },
    { value: 'suspended', label: 'Sospesi', count: users.filter(u => !u.is_active).length }
  ];

  const getFilteredUsers = () => {
    let filtered = users;
    
    // Applica filtro
    switch (filter) {
      case 'active':
        filtered = users.filter(user => user.is_active_user);
        break;
      case 'inactive':
        filtered = users.filter(user => !user.is_active_user);
        break;
      case 'suspended':
        filtered = users.filter(user => !user.is_active);
        break;
      default:
        filtered = users;
    }
    
    // Applica search
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  const columns = [
    { 
      key: 'email', 
      label: 'Email',
      className: 'text-left'
    },
    { 
      key: 'full_name', 
      label: 'Nome',
      render: (user: any) => user.full_name || 'Senza nome'
    },
    {
      key: 'status',
      label: 'Stato Online',
      render: (user: any) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            user.is_active_user
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white'
          }`}>
            {user.is_active_user 
              ? '🟢 ONLINE ORA' 
              : '🔴 OFFLINE'
            }
          </span>
          
          <div className="text-xs text-gray-400">
            {user.minutes_since_login !== null 
              ? `${user.minutes_since_login}min fa`
              : 'Mai connesso'
            }
          </div>
          
          <span className={`px-2 py-1 rounded text-xs ${
            user.is_active 
              ? 'bg-blue-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {user.is_active ? '✅ Abilitato' : '❌ Sospeso'}
          </span>
        </div>
      )
    },
    {
      key: 'workouts',
      label: 'Allenamenti',
      render: (user: any) => (
        <div className="text-center">
          <div className="text-lg font-bold text-white">{user.total_workouts || 0}</div>
          <div className="text-xs text-gray-400">
            {user.last_workout_date 
              ? `Ultimo: ${new Date(user.last_workout_date).toLocaleDateString('it-IT')}`
              : 'Nessuno'
            }
          </div>
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Iscritto',
      render: (user: any) => new Date(user.created_at).toLocaleDateString('it-IT')
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (user: any) => <UserActions user={user} onUserUpdate={onUserUpdate} />
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header con filtri e search */}
      <div className="p-6 border-b border-gray-700">
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Cerca per email o nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filtri semplici */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${column.className || ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(user) : user[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con statistiche */}
      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Mostrando {filteredUsers.length} di {users.length} utenti
            {filter !== 'all' && ` (filtro: ${filterOptions.find(f => f.value === filter)?.label})`}
          </div>
          <div className="text-sm text-gray-400">
            {users.filter(u => u.is_active_user).length} attivi • {users.filter(u => !u.is_active_user).length} inattivi
          </div>
        </div>
      </div>
    </div>
  )
}