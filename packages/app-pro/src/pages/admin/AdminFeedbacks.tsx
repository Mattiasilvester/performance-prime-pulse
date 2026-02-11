import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  Clock,
  CheckCircle2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  listFeedbacks,
  approveFeedback,
  unapproveFeedback,
  deleteFeedback,
  type LandingFeedback,
  type FeedbackFilter,
} from '@/services/adminFeedbacksService';

export type SourceFilter = 'all' | 'landing' | 'dashboard';

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<LandingFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFeedbacks(filter);
      setFeedbacks(data);
    } catch (err) {
      console.error('Fetch feedbacks error:', err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleApprove = async (id: string) => {
    try {
      await approveFeedback(id);
      fetchFeedbacks();
    } catch (err) {
      console.error('Approve error:', err);
      alert("Errore nell'approvazione del feedback");
    }
  };

  const handleUnapprove = async (id: string) => {
    try {
      await unapproveFeedback(id);
      fetchFeedbacks();
    } catch (err) {
      console.error('Unapprove error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Sei sicuro di voler eliminare questo feedback? L'azione è irreversibile."
      )
    )
      return;
    try {
      await deleteFeedback(id);
      fetchFeedbacks();
    } catch (err) {
      console.error('Delete error:', err);
      alert("Errore nell'eliminazione del feedback");
    }
  };

  const filteredBySource =
    sourceFilter === 'all'
      ? feedbacks
      : sourceFilter === 'dashboard'
        ? feedbacks.filter((f) => (f.source ?? 'landing_page') === 'dashboard')
        : feedbacks.filter((f) => (f.source ?? 'landing_page') !== 'dashboard');
  const total = filteredBySource.length;
  const pending = filteredBySource.filter((f) => !f.is_approved).length;
  const approved = filteredBySource.filter((f) => f.is_approved).length;
  const avgRating =
    filteredBySource.length > 0
      ? filteredBySource.reduce((s, f) => s + f.rating, 0) / filteredBySource.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-white">
          Gestione Feedback Landing
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Approva o rifiuta i feedback dei professionisti
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Totali</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-white">{total}</p>
          </div>
          <div className="rounded-xl border border-yellow-600/30 bg-yellow-900/30 p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="h-5 w-5" />
              <span className="text-sm">In attesa</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-white">{pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-600/30 bg-emerald-900/30 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Approvati</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-white">{approved}</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="h-5 w-5" />
              <span className="text-sm">Rating medio</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-white">
              {avgRating > 0 ? avgRating.toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(['all', 'pending', 'approved'] as FeedbackFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? 'rounded-lg bg-[#EEBA2B] px-4 py-2 text-sm font-semibold text-black'
                  : 'rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-400 hover:text-white'
              }
            >
              {f === 'all' ? 'Tutti' : f === 'pending' ? 'In attesa' : 'Approvati'}
            </button>
          ))}
        </div>
        {/* Filtro per provenienza */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 self-center">Provenienza:</span>
          {(['all', 'landing', 'dashboard'] as SourceFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={
                sourceFilter === s
                  ? 'rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-400 hover:text-white'
              }
            >
              {s === 'all' ? 'Tutti' : s === 'landing' ? 'Landing' : 'Dashboard'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-gray-800"
                />
              ))}
            </>
          ) : filteredBySource.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <p className="text-gray-400">Nessun feedback ricevuto</p>
              <p className="mt-1 text-sm text-gray-500">
                I feedback appariranno qui quando i professionisti li inviano
                dalla landing page o dalla dashboard
              </p>
            </div>
          ) : (
            filteredBySource.map((feedback) => (
              <div
                key={feedback.id}
                className={`rounded-xl border border-gray-700 bg-gray-800 p-5 ${
                  feedback.is_approved
                    ? 'border-l-4 border-l-emerald-500'
                    : 'border-l-4 border-l-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">
                        {feedback.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          (feedback.source ?? 'landing_page') === 'dashboard'
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {(feedback.source ?? 'landing_page') === 'dashboard' ? 'Dashboard' : 'Landing'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {feedback.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i <= feedback.rating
                              ? 'text-[#EEBA2B] fill-[#EEBA2B]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(
                        new Date(feedback.created_at),
                        'd MMM yyyy, HH:mm',
                        { locale: it }
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {feedback.comment}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      feedback.is_approved
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {feedback.is_approved ? '✅ Approvato' : '⏳ In attesa'}
                  </span>
                  <div className="flex gap-2">
                    {feedback.is_approved ? (
                      <>
                        <button
                          onClick={() => handleUnapprove(feedback.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rimuovi approvazione
                        </button>
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Elimina
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(feedback.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approva
                        </button>
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Elimina
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
