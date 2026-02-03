import React, { useState, useEffect } from 'react';
import { supabase } from '@pp/shared';
import { Loader2, AlertCircle, Calendar, User, MessageSquare } from 'lucide-react';

interface CancellationData {
  id: string;
  professional_id: string;
  cancellation_reason: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  status: string;
  plan: string;
  professional_name: string | null;
  professional_email: string | null;
}

export default function AdminCancellations() {
  const [cancellations, setCancellations] = useState<CancellationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCancellations();
  }, []);

  const loadCancellations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Recupera tutte le subscription cancellate o in cancellazione con motivo
      const { data: subscriptions, error: subError } = await supabase
        .from('professional_subscriptions')
        .select(`
          id,
          professional_id,
          cancellation_reason,
          canceled_at,
          cancel_at_period_end,
          current_period_end,
          status,
          plan
        `)
        .or('cancel_at_period_end.eq.true,status.eq.canceled')
        .order('canceled_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (subError) throw subError;

      if (!subscriptions || subscriptions.length === 0) {
        setCancellations([]);
        setLoading(false);
        return;
      }

      // Recupera informazioni professionisti
      const professionalIds = subscriptions
        .map(s => s.professional_id)
        .filter((id, index, self) => self.indexOf(id) === index);

      const { data: professionals, error: profError } = await supabase
        .from('professionals')
        .select('id, first_name, last_name, email')
        .in('id', professionalIds);

      if (profError) {
        console.error('Errore recupero professionisti:', profError);
      }

      // Combina dati
      const cancellationsWithProfessionals: CancellationData[] = subscriptions.map(sub => {
        const prof = professionals?.find(p => p.id === sub.professional_id);
        return {
          ...sub,
          professional_name: prof ? `${prof.first_name} ${prof.last_name}` : null,
          professional_email: prof?.email || null,
        };
      });

      setCancellations(cancellationsWithProfessionals);
    } catch (err: unknown) {
      console.error('Errore caricamento cancellazioni:', err);
      setError((err as Error)?.message || 'Errore nel caricamento delle cancellazioni');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Cancellazioni Abbonamenti</h1>
        <p className="text-gray-400">Visualizza i motivi di cancellazione degli abbonamenti</p>
      </div>

      {cancellations.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nessuna cancellazione trovata</p>
          <p className="text-gray-500 text-sm mt-2">
            Le cancellazioni con motivo appariranno qui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cancellations.map((cancellation) => (
            <div
              key={cancellation.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {cancellation.professional_name || 'Professionista sconosciuto'}
                    </h3>
                  </div>
                  {cancellation.professional_email && (
                    <p className="text-gray-400 text-sm ml-8">
                      {cancellation.professional_email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cancellation.status === 'canceled'
                      ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {cancellation.status === 'canceled' ? 'Cancellato' : 'In cancellazione'}
                  </span>
                </div>
              </div>

              {/* Motivo Cancellazione */}
              {cancellation.cancellation_reason ? (
                <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-300 mb-1">Motivo della cancellazione:</p>
                      <p className="text-white whitespace-pre-wrap">{cancellation.cancellation_reason}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700 border-dashed">
                  <p className="text-gray-500 text-sm italic">
                    Nessun motivo fornito
                  </p>
                </div>
              )}

              {/* Info aggiuntive */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Data cancellazione:</span>
                  <span className="text-white">
                    {cancellation.canceled_at 
                      ? formatDate(cancellation.canceled_at)
                      : cancellation.cancel_at_period_end && cancellation.current_period_end
                        ? `Fine periodo: ${formatDate(cancellation.current_period_end)}`
                        : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Piano:</span>
                  <span className="text-white capitalize">{cancellation.plan || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Tipo:</span>
                  <span className="text-white">
                    {cancellation.cancel_at_period_end ? 'Fine periodo' : 'Immediata'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
