// src/pages/partner/dashboard/ProgettiPage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  FolderOpen, Search, Plus,
  CheckCircle, PauseCircle, PlayCircle,
  Calendar, Target, User, MoreVertical,
  Trash2, ChevronDown
} from 'lucide-react';
import AddProjectModal from '@/components/partner/projects/AddProjectModal';
import ProjectDetailModal from '@/components/partner/projects/ProjectDetailModal';

interface Project {
  id: string;
  client_id: string;
  name: string;
  objective: string | null;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  client?: {
    full_name: string;
    is_pp_subscriber: boolean;
  };
}

interface Stats {
  active: number;
  paused: number;
  completed: number;
}

export default function ProgettiPage() {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [stats, setStats] = useState<Stats>({ active: 0, paused: 0, completed: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  const loadProfessionalId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      toast.error('Errore nel caricamento dei dati');
    }
  };

  // Fetch progetti quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchProjects();
    }
  }, [professionalId]);

  const fetchProjects = async () => {
    if (!professionalId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(full_name, is_pp_subscriber)
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) {
        // Se la tabella non esiste o errore, mostra messaggio
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.log('Tabella projects non disponibile. Esegui la migrazione SQL.');
          setProjects([]);
          calculateStats([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setProjects(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error('Errore fetch progetti:', err);
      toast.error('Errore nel caricamento dei progetti');
      setProjects([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsList: Project[]) => {
    const stats = {
      active: projectsList.filter(p => p.status === 'active').length,
      paused: projectsList.filter(p => p.status === 'paused').length,
      completed: projectsList.filter(p => p.status === 'completed').length
    };
    setStats(stats);
  };

  const handleStatsClick = (status: 'active' | 'paused' | 'completed') => {
    if (statusFilter === status) {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: 'active' | 'paused' | 'completed') => {
    try {
      const updateData: any = { status: newStatus };
      
      // Se completato, imposta end_date
      if (newStatus === 'completed') {
        updateData.end_date = new Date().toISOString().split('T')[0];
      } else if (newStatus === 'active' && statusFilter !== 'completed') {
        // Se riattivato, rimuovi end_date
        updateData.end_date = null;
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      const statusLabels = {
        active: 'riattivato',
        paused: 'messo in pausa',
        completed: 'completato'
      };

      toast.success(`Progetto ${statusLabels[newStatus]}`);
      fetchProjects();
    } catch (err: any) {
      console.error('Errore aggiornamento progetto:', err);
      if (err.code === '42501' || err.code === 'PGRST301') {
        toast.error('Errore permessi: verifica le RLS policies');
      } else {
        toast.error('Errore nell\'aggiornamento');
      }
    }
    setMenuOpen(null);
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Eliminare questo progetto? L\'azione è irreversibile.')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Progetto eliminato');
      fetchProjects();
    } catch (err: any) {
      console.error('Errore eliminazione progetto:', err);
      if (err.code === '42501' || err.code === 'PGRST301') {
        toast.error('Errore permessi: verifica le RLS policies');
      } else {
        toast.error('Errore nell\'eliminazione');
      }
    }
    setMenuOpen(null);
  };

  // Filtra progetti
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.objective && project.objective.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-4 h-4" />;
      case 'paused': return <PauseCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'paused': return 'In Pausa';
      case 'completed': return 'Completato';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
            <FolderOpen className="w-6 h-6 text-[#EEBA2B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Progetti</h1>
        </div>
        <p className="text-gray-500">Gestisci i percorsi di allenamento dei tuoi clienti</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => handleStatsClick('active')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'active' 
              ? 'border-green-500 bg-green-50 shadow-lg' 
              : 'border-transparent bg-white hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <PlayCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
          </div>
          <p className="text-xs text-gray-500">Attivi</p>
        </button>

        <button
          onClick={() => handleStatsClick('paused')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'paused' 
              ? 'border-orange-500 bg-orange-50 shadow-lg' 
              : 'border-transparent bg-white hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <PauseCircle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.paused}</span>
          </div>
          <p className="text-xs text-gray-500">In Pausa</p>
        </button>

        <button
          onClick={() => handleStatsClick('completed')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'completed' 
              ? 'border-gray-500 bg-gray-100 shadow-lg' 
              : 'border-transparent bg-white hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
          </div>
          <p className="text-xs text-gray-500">Completati</p>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="w-full sm:flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca progetto o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]"
            />
          </div>

          {/* Filter + Button */}
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none w-full px-3 sm:pl-4 sm:pr-10 py-2.5 pr-8 sm:pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent cursor-pointer text-sm sm:text-base"
              >
                <option value="all">📁 Tutti</option>
                <option value="active">🟢 Attivi</option>
                <option value="paused">🟠 In Pausa</option>
                <option value="completed">✓ Completati</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EEBA2B] text-white rounded-xl hover:bg-[#d4a826] transition-colors font-medium text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Progetto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded ml-2 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Nessun progetto trovato' 
              : 'Nessun progetto creato'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#EEBA2B] text-white rounded-xl font-medium hover:bg-[#d4a826] transition-colors"
            >
              + Crea primo progetto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  {/* Cliente */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{project.client?.full_name || 'Cliente non assegnato'}</span>
                    {project.client?.is_pp_subscriber && (
                      <span className="text-[#EEBA2B] flex-shrink-0">⭐</span>
                    )}
                  </div>
                </div>

                {/* Menu azioni */}
                <div className="relative flex-shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Previeni l'apertura del modal quando si clicca sul menu
                      setMenuOpen(menuOpen === project.id ? null : project.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>

                  {menuOpen === project.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setMenuOpen(null)} 
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {project.status !== 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateProjectStatus(project.id, 'active');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4 text-green-600" />
                            Riattiva
                          </button>
                        )}
                        {project.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateProjectStatus(project.id, 'paused');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <PauseCircle className="w-4 h-4 text-orange-600" />
                            Metti in pausa
                          </button>
                        )}
                        {project.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateProjectStatus(project.id, 'completed');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 text-gray-600" />
                            Segna completato
                          </button>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Obiettivo */}
              {project.objective && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4 mt-0.5 text-[#EEBA2B] flex-shrink-0" />
                  <span>{project.objective}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Iniziato: {new Date(project.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {project.end_date && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Completato: {new Date(project.end_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Aggiungi Progetto */}
      {showAddModal && professionalId && (
        <AddProjectModal
          professionalId={professionalId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchProjects();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Modal Dettaglio Progetto */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={() => {
            fetchProjects();
            setSelectedProject(null);
          }}
          onDelete={(projectId) => {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            calculateStats(projects.filter(p => p.id !== projectId));
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
