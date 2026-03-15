import { supabase } from '@/integrations/supabase/client';
import type { Medal } from '@/types/medalSystem';

// Categorie canoniche per all_categories
const ALL_WORKOUT_CATEGORIES = [
  'forza', 'cardio', 'hiit', 'mobilita',
  'personalizzato', 'strength'
];

export async function checkAndUnlockMedals(
  userId: string,
  earnedMedalIds: string[]
): Promise<Medal[]> {
  const newMedals: Medal[] = [];
  const earned = new Set(earnedMedalIds);
  const now = new Date();

  // Helper per creare oggetto Medal
  function makeMedal(id: string, name: string, description: string,
    icon: string, rarity: Medal['rarity']): Medal {
    return {
      id,
      name,
      description,
      icon,
      earnedDate: now.toISOString(),
      challengeType: 'achievement',
      rarity,
    };
  }

  try {
    // ── QUERY 1: user_workout_stats (streak) ──────────────
    const { data: stats } = await supabase
      .from('user_workout_stats')
      .select('current_streak_days')
      .eq('user_id', userId)
      .maybeSingle();

    if (stats) {
      if (!earned.has('consistency_master') &&
          (stats.current_streak_days ?? 0) >= 30) {
        newMedals.push(makeMedal(
          'consistency_master',
          'Consistency Master',
          '30 giorni di streak consecutivi',
          '🔥', 'epic'
        ));
      }
      if (!earned.has('iron_streak') &&
          (stats.current_streak_days ?? 0) >= 60) {
        newMedals.push(makeMedal(
          'iron_streak',
          'Iron Streak',
          '60 giorni di streak consecutivi',
          '⚡', 'legendary'
        ));
      }
    }

    // ── QUERY 2: workout_diary (una sola query) ───────────
    const { data: diary } = await supabase
      .from('workout_diary')
      .select('completed_at, duration_minutes, workout_type')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null);

    if (diary && diary.length > 0) {
      // Prepara dati
      const completedDates = diary
        .map(d => new Date(d.completed_at!))
        .filter(d => !isNaN(d.getTime()));

      // early_bird — almeno 1 workout prima delle 7:00
      if (!earned.has('early_bird')) {
        const hasEarlyBird = completedDates.some(d => d.getHours() < 7);
        if (hasEarlyBird) newMedals.push(makeMedal(
          'early_bird', 'Early Bird',
          'Completa un allenamento prima delle 7:00',
          '🌅', 'rare'
        ));
      }

      // night_owl — almeno 1 workout dopo le 21:00
      if (!earned.has('night_owl')) {
        const hasNightOwl = completedDates.some(d => d.getHours() >= 21);
        if (hasNightOwl) newMedals.push(makeMedal(
          'night_owl', 'Night Owl',
          'Completa un allenamento dopo le 21:00',
          '🦉', 'rare'
        ));
      }

      // speed_demon — almeno 1 workout < 20 min
      if (!earned.has('speed_demon')) {
        const hasSpeedDemon = diary.some(
          d => d.duration_minutes !== null && d.duration_minutes < 20
        );
        if (hasSpeedDemon) newMedals.push(makeMedal(
          'speed_demon', 'Speed Demon',
          'Completa un allenamento in meno di 20 minuti',
          '⚡', 'rare'
        ));
      }

      // weekly_warrior — >= 5 workout nella settimana corrente
      if (!earned.has('weekly_warrior')) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weeklyCount = completedDates.filter(
          d => d >= startOfWeek
        ).length;
        if (weeklyCount >= 5) newMedals.push(makeMedal(
          'weekly_warrior', 'Weekly Warrior',
          '5 allenamenti in una settimana',
          '💪', 'epic'
        ));
      }

      // month_warrior — >= 20 workout nel mese corrente
      if (!earned.has('month_warrior')) {
        const startOfMonth = new Date(
          now.getFullYear(), now.getMonth(), 1
        );
        const monthlyCount = completedDates.filter(
          d => d >= startOfMonth
        ).length;
        if (monthlyCount >= 20) newMedals.push(makeMedal(
          'month_warrior', 'Month Warrior',
          '20 allenamenti in un mese',
          '🏆', 'epic'
        ));
      }

      // versatile — >= 3 workout_type distinti
      if (!earned.has('versatile')) {
        const types = new Set(
          diary
            .map(d => d.workout_type?.toLowerCase())
            .filter(Boolean)
        );
        if (types.size >= 3) newMedals.push(makeMedal(
          'versatile', 'Versatile',
          'Allenati con 3 categorie diverse',
          '🎯', 'rare'
        ));
      }

      // all_categories — tutti i tipi canonici usati
      if (!earned.has('all_categories')) {
        const usedTypes = new Set(
          diary
            .map(d => d.workout_type?.toLowerCase())
            .filter(Boolean)
        );
        const hasAll = ALL_WORKOUT_CATEGORIES.every(
          cat => usedTypes.has(cat)
        );
        if (hasAll) newMedals.push(makeMedal(
          'all_categories', 'All Categories',
          'Allenati con tutte le categorie disponibili',
          '🌟', 'legendary'
        ));
      }

      // year_warrior — primo workout >= 365 giorni fa
      if (!earned.has('year_warrior')) {
        const minDate = new Date(
          Math.min(...completedDates.map(d => d.getTime()))
        );
        const daysSinceFirst = Math.floor(
          (now.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceFirst >= 365) newMedals.push(makeMedal(
          'year_warrior', 'Year Warrior',
          'Usi Performance Prime da oltre un anno',
          '📅', 'legendary'
        ));
      }
    }

    // ── QUERY 3: nutrition_plans ──────────────────────────
    const { count: nutritionCount } = await supabase
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (nutritionCount !== null) {
      if (!earned.has('nutrition_start') && nutritionCount >= 1) {
        newMedals.push(makeMedal(
          'nutrition_start', 'Nutrition Start',
          'Crea il tuo primo piano nutrizionale',
          '🥗', 'common'
        ));
      }
      if (!earned.has('nutrition_master') && nutritionCount >= 20) {
        newMedals.push(makeMedal(
          'nutrition_master', 'Nutrition Master',
          '20 piani nutrizionali creati',
          '👨‍🍳', 'legendary'
        ));
      }
    }

    // ── QUERY 4: primebot_interactions ───────────────────
    const { count: primebotCount } = await supabase
      .from('primebot_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (primebotCount !== null) {
      if (!earned.has('primebot_buddy') && primebotCount >= 1) {
        newMedals.push(makeMedal(
          'primebot_buddy', 'PrimeBot Buddy',
          'Prima conversazione con PrimeBot',
          '🤖', 'common'
        ));
      }
      if (!earned.has('primebot_master') && primebotCount >= 50) {
        newMedals.push(makeMedal(
          'primebot_master', 'PrimeBot Master',
          '50 conversazioni con PrimeBot',
          '🧠', 'epic'
        ));
      }
    }

  } catch (err) {
    console.error('medalCheckService error:', err);
  }

  return newMedals;
}
