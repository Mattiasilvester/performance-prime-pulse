/**
 * Edge Function: admin-analytics
 * Dati reali per grafici Analytics SuperAdmin: crescita utenti (cumulativa) e revenue mensile (solo abbonamenti B2B + B2C).
 * B2B: subscription_invoices (PrimePro). B2C: user subscriptions (quando implementato).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MONTH_LABELS: Record<number, string> = {
  0: 'Gen', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mag', 5: 'Giu',
  6: 'Lug', 7: 'Ago', 8: 'Set', 9: 'Ott', 10: 'Nov', 11: 'Dic',
};

function getLast6Months(): { year: number; month: number; label: string; lastDay: string }[] {
  const now = new Date();
  const out: { year: number; month: number; label: string; lastDay: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    out.push({
      year,
      month,
      label: MONTH_LABELS[month],
      lastDay: lastDay.toISOString().slice(0, 10),
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server config missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const months = getLast6Months();
    const firstMonth = months[0];
    const firstDay = `${firstMonth.year}-${String(firstMonth.month + 1).padStart(2, '0')}-01`;

    // Crescita utenti B2C: count profiles con created_at <= ultimo giorno del mese
    // ESCLUSI i professionisti (profiles.id presenti in professionals.user_id)
    // Calcolo: totale profili - profili che sono professionisti (evita .not('id','in',...) che può fallire)
    const { data: professionalUserIds } = await supabase
      .from('professionals')
      .select('user_id')
      .not('user_id', 'is', null);
    const proUserIds = (professionalUserIds ?? []).map((r) => r.user_id).filter(Boolean);

    const [totalCounts, proCounts] = await Promise.all([
      // Totale profili per mese (created_at <= lastDay)
      Promise.all(
        months.map((m) =>
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .lte('created_at', `${m.lastDay}T23:59:59.999Z`)
        )
      ),
      // Profili che sono professionisti, per mese (created_at <= lastDay AND id IN proUserIds)
      proUserIds.length > 0
        ? Promise.all(
            months.map((m) =>
              supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .lte('created_at', `${m.lastDay}T23:59:59.999Z`)
                .in('id', proUserIds)
            )
          )
        : Promise.resolve(months.map(() => ({ count: 0 }))),
    ]);

    const userCounts = months.map((m, i) => ({
      count: Math.max(0, (totalCounts[i]?.count ?? 0) - (proCounts[i]?.count ?? 0)),
    }));

    // Revenue per mese: SOLO abbonamenti B2B (subscription_invoices) + B2C (quando disponibile)
    const revenueByMonth: Record<string, number> = {};
    months.forEach((m) => {
      const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    });

    // Revenue B2B e B2C per mese (per grafici separati e MRR totale)
    const revenueB2BByMonth: Record<string, number> = {};
    const revenueB2CByMonth: Record<string, number> = {};
    months.forEach((m) => {
      const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
      revenueB2BByMonth[key] = 0;
      revenueB2CByMonth[key] = 0;
    });

    // B2B: fatture abbonamenti PrimePro (subscription_invoices). Solo dati reali, nessun mock.
    const { data: b2bInvoices } = await supabase
      .from('subscription_invoices')
      .select('amount, paid_at, invoice_date')
      .eq('status', 'paid')
      .or(`paid_at.gte.${firstDay},invoice_date.gte.${firstDay}`);

    (b2bInvoices ?? []).forEach((inv: { amount?: number; paid_at: string | null; invoice_date: string }) => {
      const dateStr = inv.paid_at?.slice(0, 7) ?? inv.invoice_date?.slice(0, 7);
      if (dateStr && revenueByMonth[dateStr] != null) {
        const euro = Number(inv.amount) || 0;
        revenueByMonth[dateStr] += euro;
        revenueB2BByMonth[dateStr] = (revenueB2BByMonth[dateStr] ?? 0) + euro;
      }
    });

    // B2C: abbonamenti utenti (user_subscriptions) - da integrare quando la tabella esiste
    // const { data: b2cInvoices } = await supabase.from('user_subscription_invoices')...
    // (b2cInvoices ?? []).forEach(...) → revenueB2CByMonth[dateStr] += ...

    // Crescita professionisti B2B: count professionals con created_at <= ultimo giorno del mese
    const professionalCounts = await Promise.all(
      months.map((m) =>
        supabase
          .from('professionals')
          .select('id', { count: 'exact', head: true })
          .lte('created_at', `${m.lastDay}T23:59:59.999Z`)
      )
    );

    // Trial attivi B2B: professionisti con subscription in trialing e trial_end >= oggi
    const today = new Date().toISOString().slice(0, 10);
    const { count: activeTrialsCount } = await supabase
      .from('professional_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'trialing')
      .or(`trial_end.is.null,trial_end.gte.${today}`);

    const chartData = months.map((m, i) => {
      const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
      return {
        month: m.label,
        monthKey,
        users: userCounts[i]?.count ?? 0,
        professionals: professionalCounts[i]?.count ?? 0,
        revenue: Math.round(revenueByMonth[monthKey] ?? 0),
        revenueB2B: Math.round(revenueB2BByMonth[monthKey] ?? 0),
        revenueB2C: Math.round(revenueB2CByMonth[monthKey] ?? 0),
        mrrTotal: Math.round(revenueByMonth[monthKey] ?? 0),
      };
    });

    return new Response(
      JSON.stringify({
        months: chartData,
        activeTrialsCount: activeTrialsCount ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    console.error('[admin-analytics]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
