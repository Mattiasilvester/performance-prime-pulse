import { useState, useEffect } from 'react';
import { Users, CalendarCheck, TrendingUp, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayStatus } from '@/utils/bookingHelpers';
import { KPICard } from './KPICard';
import { ClientGrowthView } from './ClientGrowthView';
import { AppointmentsView } from './AppointmentsView';
import { RevenueView } from './RevenueView';
import { RatingView } from './RatingView';

export type KPIViewType = 'overview' | 'clients' | 'appointments' | 'revenue' | 'rating';

type KPIType = 'clients' | 'appointments' | 'revenue' | 'rating';

interface KPICardsSectionProps {
  professionalId: string | null;
  activeView: KPIViewType;
  onNavigateToView: (view: KPIViewType) => void;
  onBack: () => void;
}

interface KPIData {
  clients: {
    total: number;
    newThisMonth: number;
    lastMonth: number;
    growthPercent: number;
    monthlyTrend: Array<{ name: string; value: number }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    incomplete: number;
    completedPercent: number;
    monthlyTrend: Array<{ name: string; value: number }>;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growthPercent: number;
    monthlyTrend: Array<{ name: string; value: number }>;
    /** Booking completed nel mese con price NULL (per alert prezzi mancanti). */
    missingPriceCount: number;
  };
  rating: {
    average: number;
    total: number;
    verified: number;
    distribution: Record<number, number>;
    monthlyTrend: Array<{ name: string; value: number }>;
    recentReviews: Array<{
      id: string;
      rating: number;
      text: string;
      date: string;
      author: string;
    }>;
  };
}

function formatDateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
}

/** Dati vuoti per card e viste quando non ci sono dati reali (nessun placeholder/demo). */
function getEmptyKPIData(): KPIData {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { name: getMonthLabel(d), value: 0 };
  });
  return {
    clients: {
      total: 0,
      newThisMonth: 0,
      lastMonth: 0,
      growthPercent: 0,
      monthlyTrend: months,
    },
    appointments: {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      incomplete: 0,
      completedPercent: 0,
      monthlyTrend: months,
    },
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      growthPercent: 0,
      monthlyTrend: months,
      missingPriceCount: 0,
    },
    rating: {
      average: 0,
      total: 0,
      verified: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      monthlyTrend: months,
      recentReviews: [],
    },
  };
}

export function KPICardsSection({
  professionalId,
  activeView,
  onNavigateToView,
  onBack,
}: KPICardsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData>(getEmptyKPIData());

  useEffect(() => {
    if (professionalId) {
      fetchAllKPIData();
    } else {
      setData(getEmptyKPIData());
      setLoading(false);
    }
  // Esegui fetch quando cambia professionalId; fetchAllKPIData non in deps per evitare loop
  }, [professionalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllKPIData = async () => {
    if (!professionalId) return;

    setLoading(true);

    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const startThis = formatDateToString(firstDayThisMonth);
      const endThis = formatDateToString(lastDayThisMonth);
      const startLast = formatDateToString(firstDayLastMonth);
      const endLast = formatDateToString(lastDayLastMonth);

      const endThisMonthISO = new Date(lastDayThisMonth);
      endThisMonthISO.setHours(23, 59, 59, 999);
      const endLastMonthISO = new Date(lastDayLastMonth);
      endLastMonthISO.setHours(23, 59, 59, 999);

      // Ultimi 6 mesi per trend
      const monthsForTrend: Array<{ start: Date; end: Date; label: string }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        monthsForTrend.push({
          start: d,
          end: lastDay,
          label: getMonthLabel(d),
        });
      }

      const [
        clientsTotalRes,
        clientsThisMonthRes,
        clientsLastMonthRes,
        bookingsThisMonthRes,
        revenueThisMonthRes,
        revenueLastMonthRes,
        reviewsRes,
        recentReviewsRes,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('professional_id', professionalId),

        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .gte('created_at', firstDayThisMonth.toISOString())
          .lte('created_at', endThisMonthISO.toISOString()),

        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', endLastMonthISO.toISOString()),

        supabase
          .from('bookings')
          .select('status, booking_date')
          .eq('professional_id', professionalId)
          .gte('booking_date', startThis)
          .lte('booking_date', endThis),

        supabase
          .from('bookings')
          .select(`
            id,
            price,
            service_id,
            service:professional_services(price)
          `)
          .eq('professional_id', professionalId)
          .eq('status', 'completed')
          .gte('booking_date', startThis)
          .lte('booking_date', endThis),

        supabase
          .from('bookings')
          .select(`
            id,
            price,
            service_id,
            service:professional_services(price)
          `)
          .eq('professional_id', professionalId)
          .eq('status', 'completed')
          .gte('booking_date', startLast)
          .lte('booking_date', endLast),

        supabase
          .from('reviews')
          .select('rating, is_verified, created_at')
          .eq('professional_id', professionalId),

        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, user_id')
          .eq('professional_id', professionalId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalClients = clientsTotalRes.count ?? 0;
      const newThisMonth = clientsThisMonthRes.count ?? 0;
      const lastMonthClients = clientsLastMonthRes.count ?? 0;
      const clientGrowth =
        lastMonthClients > 0
          ? Math.round(((newThisMonth - lastMonthClients) / lastMonthClients) * 100)
          : newThisMonth > 0
            ? 100
            : 0;

      const bookings = bookingsThisMonthRes.data ?? [];
      const completed = bookings.filter((b) => b.status === 'completed').length;
      const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
      const pending = bookings.filter(
        (b) => getDisplayStatus({ status: b.status, booking_date: b.booking_date }) === 'pending'
      ).length;
      const incomplete = bookings.filter(
        (b) => getDisplayStatus({ status: b.status, booking_date: b.booking_date }) === 'incomplete'
      ).length;
      const totalBookings = bookings.length;
      const completedPercent =
        totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;

      /** Somma solo bookings.price (contabile). Nessun fallback su professional_services. */
      const sumBookingRevenueContabile = (
        rows: Array<{ price?: string | number | null }>
      ): { revenue: number; missingPriceCount: number } => {
        let revenue = 0;
        let missingPriceCount = 0;
        for (const b of rows) {
          if (b.price != null && b.price !== '') {
            const n = parseFloat(String(b.price));
            if (!Number.isNaN(n) && n >= 0) revenue += n;
            else missingPriceCount += 1;
          } else {
            missingPriceCount += 1;
          }
        }
        return { revenue, missingPriceCount };
      };

      const thisMonthRows = revenueThisMonthRes.data ?? [];
      const { revenue: thisMonthRevenue, missingPriceCount } = sumBookingRevenueContabile(thisMonthRows);
      const { revenue: lastMonthRevenue } = sumBookingRevenueContabile(revenueLastMonthRes.data ?? []);
      const revenueGrowth =
        lastMonthRevenue > 0
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : thisMonthRevenue > 0
            ? 100
            : 0;

      const reviews = reviewsRes.data ?? [];
      const totalReviews = reviews.length;
      const verifiedReviews = (reviews as Array<{ is_verified?: boolean }>).filter(
        (r) => r.is_verified
      ).length;
      const avgRating =
        totalReviews > 0
          ? (reviews as Array<{ rating: number }>).reduce((s, r) => s + r.rating, 0) / totalReviews
          : 0;
      const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      (reviews as Array<{ rating: number }>).forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
      });

      // Fetch monthly trends (6 mesi)
      const clientsMonthlyPromises = monthsForTrend.map((m) =>
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .gte('created_at', m.start.toISOString())
          .lte('created_at', new Date(m.end.getTime() + 86400000).toISOString())
      );
      const bookingsMonthlyPromises = monthsForTrend.map((m) =>
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('professional_id', professionalId)
          .gte('booking_date', formatDateToString(m.start))
          .lte('booking_date', formatDateToString(m.end))
          .neq('status', 'cancelled')
      );
      const revenueMonthlyPromises = monthsForTrend.map((m) =>
        supabase
          .from('bookings')
          .select(`
            id,
            price,
            service_id,
            service:professional_services(price)
          `)
          .eq('professional_id', professionalId)
          .eq('status', 'completed')
          .gte('booking_date', formatDateToString(m.start))
          .lte('booking_date', formatDateToString(m.end))
      );
      const ratingMonthlyPromises = monthsForTrend.map((m) =>
        supabase
          .from('reviews')
          .select('rating')
          .eq('professional_id', professionalId)
          .gte('created_at', m.start.toISOString())
          .lte(
            'created_at',
            new Date(m.end.getTime() + 86400000).toISOString()
          )
      );

      const [
        clientsMonthlyResults,
        bookingsMonthlyResults,
        revenueMonthlyResults,
        ratingMonthlyResults,
      ] = await Promise.all([
        Promise.all(clientsMonthlyPromises),
        Promise.all(bookingsMonthlyPromises),
        Promise.all(revenueMonthlyPromises),
        Promise.all(ratingMonthlyPromises),
      ]);

      const clientsMonthlyTrend = monthsForTrend.map((m, i) => ({
        name: m.label,
        value: clientsMonthlyResults[i]?.count ?? 0,
      }));
      const appointmentsMonthlyTrend = monthsForTrend.map((m, i) => ({
        name: m.label,
        value: bookingsMonthlyResults[i]?.count ?? 0,
      }));
      const revenueMonthlyTrend = monthsForTrend.map((m, i) => {
        const rows = revenueMonthlyResults[i]?.data ?? [];
        const { revenue } = sumBookingRevenueContabile(rows);
        return { name: m.label, value: revenue };
      });
      const ratingMonthlyTrend = monthsForTrend.map((m, i) => {
        const rows = (ratingMonthlyResults[i]?.data ?? []) as Array<{ rating: number }>;
        const avg =
          rows.length > 0
            ? rows.reduce((s, r) => s + r.rating, 0) / rows.length
            : 0;
        return { name: m.label, value: Math.round(avg * 10) / 10 };
      });

      const recentReviewsRaw = recentReviewsRes.data ?? [];
      const userIds = [...new Set((recentReviewsRaw as Array<{ user_id: string }>).map((r) => r.user_id))];
      let profilesMap: Map<string, string> = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profilesData) {
          profilesMap = new Map(
            profilesData.map((p: { id: string; full_name: string | null }) => [
              p.id,
              p.full_name ?? 'Cliente',
            ])
          );
        }
      }
      const recentReviews = (recentReviewsRaw as Array<{
        id: string;
        rating: number;
        comment: string | null;
        created_at: string;
        user_id: string;
      }>).map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.comment ?? '',
        date: new Date(r.created_at).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        author: profilesMap.get(r.user_id) ?? 'Cliente',
      }));

      const hasNoData =
        totalClients === 0 &&
        totalBookings === 0 &&
        thisMonthRevenue === 0 &&
        totalReviews === 0;

      setData(
        hasNoData
          ? getEmptyKPIData()
          : {
              clients: {
                total: totalClients,
                newThisMonth,
                lastMonth: lastMonthClients,
                growthPercent: clientGrowth,
                monthlyTrend: clientsMonthlyTrend,
              },
              appointments: {
                total: totalBookings,
                completed,
                cancelled,
                pending,
                incomplete,
                completedPercent,
                monthlyTrend: appointmentsMonthlyTrend,
              },
              revenue: {
                thisMonth: thisMonthRevenue,
                lastMonth: lastMonthRevenue,
                growthPercent: revenueGrowth,
                monthlyTrend: revenueMonthlyTrend,
                missingPriceCount,
              },
              rating: {
                average: avgRating,
                total: totalReviews,
                verified: verifiedReviews,
                distribution,
                monthlyTrend: ratingMonthlyTrend,
                recentReviews,
              },
            }
      );
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (kpi: KPIType) => {
    onNavigateToView(kpi);
  };

  // Vista dettaglio full-page: sostituisce tutto il contenuto
  if (activeView !== 'overview') {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#EEBA2B] border-t-transparent" />
        </div>
      );
    }
    switch (activeView) {
      case 'clients':
        return (
          <ClientGrowthView
            data={{
              ...data.clients,
              monthlyTrend: data.clients.monthlyTrend,
            }}
            onBack={onBack}
          />
        );
      case 'appointments':
        return (
          <AppointmentsView
            data={{
              ...data.appointments,
              monthlyTrend: data.appointments.monthlyTrend,
            }}
            onBack={onBack}
            professionalId={professionalId}
            onDataChange={fetchAllKPIData}
          />
        );
      case 'revenue':
        return (
          <RevenueView
            data={{
              ...data.revenue,
              monthlyTrend: data.revenue.monthlyTrend,
            }}
            onBack={onBack}
          />
        );
      case 'rating':
        return (
          <RatingView
            data={{
              ...data.rating,
              monthlyTrend: data.rating.monthlyTrend,
              recentReviews: data.rating.recentReviews,
            }}
            onBack={onBack}
          />
        );
      default:
        return null;
    }
  }

  // Overview: grid di 4 card
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Crescita Clienti"
          value={`${data.clients.growthPercent >= 0 ? '+' : ''}${data.clients.growthPercent}%`}
          subtitle={`${data.clients.total} clienti totali`}
          trend={
            data.clients.growthPercent !== 0
              ? {
                  value: Math.abs(data.clients.growthPercent),
                  isPositive: data.clients.growthPercent > 0,
                }
              : undefined
          }
          icon={Users}
          isActive={false}
          onClick={() => handleCardClick('clients')}
          isLoading={loading}
        />

        <KPICard
          title="Appuntamenti"
          value={`${data.appointments.completed}/${data.appointments.total}`}
          subtitle={`${data.appointments.completedPercent}% completati`}
          icon={CalendarCheck}
          isActive={false}
          onClick={() => handleCardClick('appointments')}
          isLoading={loading}
        />

        <div>
          <KPICard
            title="Incassi Mese"
            value={`€${data.revenue.thisMonth.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle="questo mese"
            trend={
              data.revenue.growthPercent !== 0
                ? {
                    value: Math.abs(data.revenue.growthPercent),
                    isPositive: data.revenue.growthPercent > 0,
                  }
                : undefined
            }
            icon={TrendingUp}
            isActive={false}
            onClick={() => handleCardClick('revenue')}
            isLoading={loading}
          />
          {data.revenue.missingPriceCount != null && data.revenue.missingPriceCount > 0 && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Prezzi mancanti: {data.revenue.missingPriceCount} prestazioni escluse dall&apos;incasso.
            </p>
          )}
        </div>

        <KPICard
          title="Rating"
          value={data.rating.average.toFixed(1)}
          subtitle={`${data.rating.total} recensioni`}
          icon={Star}
          isActive={false}
          onClick={() => handleCardClick('rating')}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
