import {
  ProfessionalDetailPayload,
  ProfessionalDetailProjectItem,
} from '@/services/adminProfessionalService';

type DetailTab = 'profile' | 'services' | 'clients' | 'bookings' | 'projects' | 'activity';

interface ProfessionalDetailSectionsProps {
  activeTab: DetailTab;
  loading: boolean;
  error: string | null;
  detail: ProfessionalDetailPayload | null;
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('it-IT');
}

function formatCurrency(value: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '-';
  return `${minutes} min`;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeTime(value: string | null): string {
  if (!value) return 'Mai';
  const deltaMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'Adesso';
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} giorni fa`;
  const months = Math.floor(days / 30);
  return `${months} mesi fa`;
}

function bookingBadge(status: string | null): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'confirmed') return 'bg-green-500/20 text-green-300 border-green-500/40';
  if (normalized === 'pending') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  if (normalized === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/40';
  if (normalized === 'completed') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  return 'bg-gray-600/30 text-gray-300 border-gray-500/40';
}

function projectBadge(status: string | null): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'active') return 'bg-green-500/20 text-green-300 border-green-500/40';
  if (normalized === 'paused') return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  if (normalized === 'completed') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  return 'bg-gray-600/30 text-gray-300 border-gray-500/40';
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center text-gray-400">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-gray-800 rounded-lg" />
      <div className="h-24 bg-gray-800 rounded-lg" />
      <div className="h-24 bg-gray-800 rounded-lg" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
      Errore caricamento dettagli: {message}
    </div>
  );
}

function renderProfileTab(detail: ProfessionalDetailPayload) {
  const p = detail.professional;
  if (!p) return <EmptyState text="Nessun profilo professionista trovato per questo utente." />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Professioni</div>
          {p.professions.length ? (
            <div className="flex flex-wrap gap-2">
              {p.professions.map((item) => (
                <span key={item} className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs border border-blue-500/30">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">Nessuna professione specificata</div>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Specializzazioni</div>
          {p.specializations.length ? (
            <div className="flex flex-wrap gap-2">
              {p.specializations.map((item) => (
                <span key={item} className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs border border-purple-500/30">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">Nessuna specializzazione</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Bio</div>
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{p.bio || 'Nessuna bio disponibile'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Contatti e sede</div>
          <div className="space-y-1 text-gray-200">
            <div>Email: {p.email || '-'}</div>
            <div>Telefono: {p.phone || '-'}</div>
            <div>Città: {p.city || '-'}</div>
            <div>Indirizzo: {p.address || '-'}</div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Dati fiscali</div>
          <div className="space-y-1 text-gray-200">
            <div>Azienda: {p.company_name || '-'}</div>
            <div>P.IVA: {p.vat_number || '-'}</div>
            <div>Categoria: {p.category || '-'}</div>
            <div>Registrazione: {formatDateTime(p.created_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderServicesTab(detail: ProfessionalDetailPayload) {
  if (!detail.services.length) return <EmptyState text="Nessun servizio creato." />;
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-300">Totale servizi: <span className="font-semibold text-white">{detail.services.length}</span></div>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-3 py-2 text-left">Servizio</th>
              <th className="px-3 py-2 text-left">Descrizione</th>
              <th className="px-3 py-2 text-left">Durata</th>
              <th className="px-3 py-2 text-left">Prezzo</th>
              <th className="px-3 py-2 text-left">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {detail.services.map((service) => (
              <tr key={service.id} className="bg-gray-900/40">
                <td className="px-3 py-2 text-white">{service.name || '-'}</td>
                <td className="px-3 py-2 text-gray-300 max-w-[320px] truncate">{service.description || '-'}</td>
                <td className="px-3 py-2 text-gray-300">{formatDuration(service.duration_minutes)}</td>
                <td className="px-3 py-2 text-gray-300">{formatCurrency(service.price)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${service.is_active ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-gray-600/30 text-gray-300 border-gray-500/40'}`}>
                    {service.is_active ? 'Attivo' : 'Disattivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderClientsTab(detail: ProfessionalDetailPayload) {
  if (!detail.clients.length) return <EmptyState text="Nessun cliente registrato." />;
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-300">Totale clienti: <span className="font-semibold text-white">{detail.clients.length}</span></div>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Telefono</th>
              <th className="px-3 py-2 text-left">Abbonato PP</th>
              <th className="px-3 py-2 text-left">Data aggiunta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {detail.clients.map((client) => (
              <tr key={client.id} className="bg-gray-900/40">
                <td className="px-3 py-2 text-white">{client.full_name || '-'}</td>
                <td className="px-3 py-2 text-gray-300">{client.email || '-'}</td>
                <td className="px-3 py-2 text-gray-300">{client.phone || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${client.is_pp_subscriber ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-600/30 text-gray-300 border-gray-500/40'}`}>
                    {client.is_pp_subscriber ? 'Sì' : 'No'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-300">{formatDate(client.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderBookingsTab(detail: ProfessionalDetailPayload) {
  const stats = detail.booking_stats;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Totali', value: stats.total, cls: 'bg-gray-700/40 text-gray-200' },
          { label: 'Confermate', value: stats.confirmed, cls: 'bg-green-500/20 text-green-200' },
          { label: 'In attesa', value: stats.pending, cls: 'bg-yellow-500/20 text-yellow-200' },
          { label: 'Cancellate', value: stats.cancelled, cls: 'bg-red-500/20 text-red-200' },
          { label: 'Completate', value: stats.completed, cls: 'bg-blue-500/20 text-blue-200' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border border-gray-700 p-3 ${item.cls}`}>
            <div className="text-xs opacity-80">{item.label}</div>
            <div className="text-xl font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {!detail.bookings.length ? (
        <EmptyState text="Nessuna prenotazione disponibile." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Ora</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Servizio</th>
                <th className="px-3 py-2 text-left">Stato</th>
                <th className="px-3 py-2 text-left">Durata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {detail.bookings.map((booking) => (
                <tr key={booking.id} className="bg-gray-900/40">
                  <td className="px-3 py-2 text-gray-200">{formatDate(booking.booking_date)}</td>
                  <td className="px-3 py-2 text-gray-300">{booking.booking_time || '-'}</td>
                  <td className="px-3 py-2 text-white">{booking.client_name || '-'}</td>
                  <td className="px-3 py-2 text-gray-300">{booking.service_type || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs border capitalize ${bookingBadge(booking.status)}`}>
                      {booking.status || 'n/d'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{formatDuration(booking.duration_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderProjectsTab(detail: ProfessionalDetailPayload) {
  const attachmentsTotal = detail.projects.reduce((sum, p) => sum + p.attachment_count, 0);
  if (!detail.projects.length) return <EmptyState text="Nessun progetto creato." />;
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-300">
        Totale progetti: <span className="font-semibold text-white">{detail.projects.length}</span> • Allegati: <span className="font-semibold text-white">{attachmentsTotal}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Obiettivo</th>
              <th className="px-3 py-2 text-left">Stato</th>
              <th className="px-3 py-2 text-left">Inizio</th>
              <th className="px-3 py-2 text-left">N° allegati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {detail.projects.map((project: ProfessionalDetailProjectItem) => (
              <tr key={project.id} className="bg-gray-900/40">
                <td className="px-3 py-2 text-white">{project.name || '-'}</td>
                <td className="px-3 py-2 text-gray-300">{project.client_name || '-'}</td>
                <td className="px-3 py-2 text-gray-300 max-w-[240px] truncate">{project.objective || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs border capitalize ${projectBadge(project.status)}`}>
                    {project.status || 'n/d'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-300">{formatDate(project.start_date)}</td>
                <td className="px-3 py-2 text-gray-300">{project.attachment_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderActivityTab(detail: ProfessionalDetailPayload) {
  const p = detail.professional;
  if (!p) return <EmptyState text="Nessun dato attività disponibile." />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Clienti', value: detail.totals.clients },
          { label: 'Prenotazioni', value: detail.totals.bookings },
          { label: 'Progetti', value: detail.totals.projects },
          { label: 'Allegati', value: detail.totals.attachments },
          { label: 'Servizi', value: detail.totals.services },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-700 bg-gray-900/50 p-3">
            <div className="text-xs text-gray-400">{item.label}</div>
            <div className="text-2xl font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-sm text-gray-200 space-y-1">
          <div>Ultimo accesso: <span className="text-white font-medium">{relativeTime(detail.last_login)}</span></div>
          <div>Data registrazione: <span className="text-white font-medium">{formatDateTime(p.created_at)}</span></div>
          <div>Aggiornato: <span className="text-white font-medium">{formatDateTime(p.updated_at)}</span></div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-sm text-gray-200 space-y-1">
          <div>
            Stato abbonamento:{' '}
            <span className="text-white font-medium capitalize">
              {detail.subscription?.status || 'Non disponibile'}
            </span>
          </div>
          <div>Trial fino al: <span className="text-white font-medium">{formatDateTime(detail.subscription?.trial_ends_at ?? null)}</span></div>
          <div>Periodo corrente fino al: <span className="text-white font-medium">{formatDateTime(detail.subscription?.current_period_end ?? null)}</span></div>
          <div>Disdetta a fine periodo: <span className="text-white font-medium">{detail.subscription?.cancel_at_period_end ? 'Sì' : 'No'}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-sm text-gray-300">
        Dimensione totale allegati: <span className="text-white font-medium">{formatBytes(detail.projects.reduce((sum, pj) => sum + pj.attachments_total_size, 0))}</span>
      </div>
    </div>
  );
}

export default function ProfessionalDetailSections({
  activeTab,
  loading,
  error,
  detail,
}: ProfessionalDetailSectionsProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!detail) return <EmptyState text="Nessun dato disponibile." />;

  if (activeTab === 'profile') return renderProfileTab(detail);
  if (activeTab === 'services') return renderServicesTab(detail);
  if (activeTab === 'clients') return renderClientsTab(detail);
  if (activeTab === 'bookings') return renderBookingsTab(detail);
  if (activeTab === 'projects') return renderProjectsTab(detail);
  return renderActivityTab(detail);
}

export type { DetailTab };

