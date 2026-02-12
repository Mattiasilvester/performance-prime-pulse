import { useEffect, useMemo, useState } from 'react';
import { X, User } from 'lucide-react';
import type { AdminUser } from '@/types/admin.types';
import {
  getProfessionalDetail,
  ProfessionalDetailPayload,
} from '@/services/adminProfessionalService';
import ProfessionalDetailSections, { DetailTab } from '@/components/admin/ProfessionalDetailSections';

interface ProfessionalDetailPanelProps {
  user: AdminUser;
  onClose: () => void;
}

const tabs: { key: DetailTab; label: string }[] = [
  { key: 'profile', label: 'Profilo' },
  { key: 'services', label: 'Servizi' },
  { key: 'clients', label: 'Clienti' },
  { key: 'bookings', label: 'Prenotazioni' },
  { key: 'projects', label: 'Progetti' },
  { key: 'activity', label: 'Attività' },
];

function getInitials(name: string | undefined, email: string): string {
  const source = (name || email || 'SA').trim();
  const parts = source.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function toBoolLabel(value: boolean): { text: string; cls: string } {
  return value
    ? { text: 'Sì', cls: 'bg-green-500/20 text-green-300 border-green-500/40' }
    : { text: 'No', cls: 'bg-red-500/20 text-red-300 border-red-500/40' };
}

export default function ProfessionalDetailPanel({ user, onClose }: ProfessionalDetailPanelProps) {
  const [detail, setDetail] = useState<ProfessionalDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('profile');

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfessionalDetail({ userId: user.id });
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore caricamento dettaglio');
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [user.id]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const profile = detail?.professional;
  const statusActive = toBoolLabel(Boolean(profile?.is_active));
  const statusApproved = toBoolLabel(Boolean(profile?.is_approved));

  const subtitle = useMemo(() => {
    if (!profile) return 'Nessun profilo professionista collegato';
    return [profile.category, profile.city].filter(Boolean).join(' • ') || 'Dettaglio professionista';
  }, [profile]);

  return (
    <div
      className="fixed inset-0 z-[12000] bg-black/80 backdrop-blur-sm p-2 sm:p-4 flex items-start sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[96vh] sm:h-[92vh] rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Dettaglio Professionista</h2>
            <p className="text-gray-400 text-sm mt-1 truncate">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            aria-label="Chiudi dettaglio professionista"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-gray-800 p-4 sm:p-5 space-y-4 bg-gray-900/40">
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.full_name}
                className="w-20 h-20 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-semibold">
                {getInitials(user.full_name || user.name, user.email)}
              </div>
            )}

            <div>
              <div className="text-white font-semibold truncate">{profile?.full_name || user.full_name || user.name}</div>
              <div className="text-sm text-gray-400 truncate">{profile?.email || user.email}</div>
              <div className="text-sm text-gray-400 truncate mt-0.5">{profile?.phone || '-'}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs border ${statusActive.cls}`}>
                Attivo: {statusActive.text}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${statusApproved.cls}`}>
                Approvato: {statusApproved.text}
              </span>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-xs text-gray-300 space-y-1">
              <div className="flex items-center gap-2 text-gray-200">
                <User className="w-4 h-4" />
                Riepilogo account
              </div>
              <div>Role profilo: {user.role}</div>
              <div>Creato: {new Date(user.created_at).toLocaleDateString('it-IT')}</div>
              <div>Ultimo login user: {user.last_login ? new Date(user.last_login).toLocaleString('it-IT') : 'Mai'}</div>
            </div>
          </aside>

          <section className="min-h-0 flex flex-col">
            <div className="px-4 sm:px-6 pt-4 border-b border-gray-800">
              <div className="flex flex-wrap gap-2 pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ProfessionalDetailSections
                activeTab={activeTab}
                loading={loading}
                error={error}
                detail={detail}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

