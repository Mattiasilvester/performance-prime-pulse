import type { PulseCheck } from '@/types/admin.types'

interface PulseCheckCardsProps {
  pulseCheck: PulseCheck | null | undefined
  loading?: boolean
}

const cardsConfig = [
  {
    key: 'mrrTotal',
    title: 'MRR Totale',
    format: (v: number) => `€${v}`,
    subtitle: 'Abbonamenti attivi × prezzo',
    icon: '💰',
  },
  {
    key: 'totalUsers',
    title: 'Utenti Totali',
    format: (v: number) => String(v),
    subtitle: 'Profiles registrati',
    icon: '👤',
  },
  {
    key: 'activeProfessionals',
    title: 'Professionisti Attivi',
    format: (v: number) => String(v),
    subtitle: 'Approvati e attivi',
    icon: '💼',
  },
  {
    key: 'bookingsThisMonth',
    title: 'Booking Questo Mese',
    format: (v: number) => String(v),
    subtitle: 'Volume piattaforma',
    icon: '📅',
  },
  {
    key: 'trialConversionRate',
    title: 'Conversione Trial→Paid %',
    format: (v: number) => `${v}%`,
    subtitle: 'Trial convertiti',
    icon: '📈',
  },
  {
    key: 'avgRating',
    title: 'Rating Medio',
    format: (v: number) => (v > 0 ? `${v.toFixed(1)} ⭐` : '—'),
    subtitle: 'NPS / recensioni',
    icon: '⭐',
  },
] as const

export default function PulseCheckCards({ pulseCheck, loading }: PulseCheckCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-5 rounded-lg border border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2" />
            <div className="h-8 bg-gray-600 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  const pc = pulseCheck ?? {
    mrrTotal: 0,
    mrrUsers: 0,
    mrrProfessionals: 0,
    totalUsers: 0,
    activeProfessionals: 0,
    bookingsThisMonth: 0,
    bookingsCompleted: 0,
    gmvThisMonth: 0,
    trialConversionRate: 0,
    avgRating: 0,
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-amber-400/90 mb-4">Pulse Check — Il polso del business</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardsConfig.map(({ key, title, format, subtitle, icon }) => (
          <div
            key={key}
            className="bg-gray-800/80 border border-gray-700 rounded-lg p-5 hover:border-amber-500/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs uppercase tracking-wide">{title}</span>
              <span className="text-xl" aria-hidden>{icon}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {format((pc as Record<string, number>)[key] ?? 0)}
            </div>
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
