import { useNavigate } from 'react-router-dom'
import type { PulseCheck } from '@/types/admin.types'
import { ExternalLink } from 'lucide-react'

interface AdminKpiAggiuntiviProps {
  pulseCheck: PulseCheck | null | undefined
  loading?: boolean
}

export default function AdminKpiAggiuntivi({ pulseCheck, loading }: AdminKpiAggiuntiviProps) {
  const navigate = useNavigate()
  const pc = pulseCheck ?? {}

  const churnB2B = pc.churnB2BCanceledCount ?? 0
  const bookingCompletion = pc.bookingCompletionRate ?? 0
  const inScadenza = pc.cancellationsInScadenza ?? 0
  const b2cActive = pc.b2cActiveCount ?? 0
  const b2cTotal = pc.b2cTotalCount ?? 0
  const b2cPercent = pc.b2cActivePercent ?? 0

  const cardBase =
    'bg-gray-800/80 border border-gray-700 rounded-lg p-5 hover:border-amber-500/30 transition-colors min-h-[120px] flex flex-col justify-between'

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-amber-400/90 mb-4">KPI Aggiuntivi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 min-h-[120px] p-5 rounded-lg border border-gray-700 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-amber-400/90 mb-4">KPI Aggiuntivi</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Churn professionisti B2B */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">Churn B2B</span>
            <span className="text-xl" aria-hidden>📉</span>
          </div>
          <div className="text-2xl font-bold text-white">{churnB2B}</div>
          <p className="text-gray-500 text-xs mt-1">Abbonamenti cancellati (totale)</p>
        </div>

        {/* 2. Tasso completamento booking */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">Booking completati %</span>
            <span className="text-xl" aria-hidden>✅</span>
          </div>
          <div className="text-2xl font-bold text-white">{bookingCompletion}%</div>
          <p className="text-gray-500 text-xs mt-1">Completati / totali questo mese</p>
        </div>

        {/* 3. Cancellazioni in scadenza (link a pagina Cancellazioni) */}
        <button
          type="button"
          onClick={() => navigate('/nexus-prime-control/cancellations')}
          className={`${cardBase} text-left w-full group`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">In scadenza</span>
            <span className="text-xl group-hover:opacity-80" aria-hidden>⏳</span>
          </div>
          <div className="text-2xl font-bold text-white">{inScadenza}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-500 text-xs">Subscription con fine periodo</p>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
          </div>
        </button>

        {/* 4. Utenti B2C attivi */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">Utenti B2C attivi</span>
            <span className="text-xl" aria-hidden>🏃</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {b2cActive} <span className="text-base font-normal text-gray-400">/ {b2cTotal}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">{b2cPercent}% con almeno 1 workout</p>
        </div>
      </div>
    </div>
  )
}
