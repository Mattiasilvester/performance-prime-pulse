alter table if exists public.profiles enable row level security;
alter table if exists public.custom_workouts enable row level security;
alter table if exists public.user_workout_stats enable row level security;

-- Rimuovi eventuali policy dev aperte (se esistono)
drop policy if exists "dev_read_anon_profiles" on public.profiles;
drop policy if exists "dev_read_anon_custom_workouts" on public.custom_workouts;
drop policy if exists "dev_read_anon_user_workout_stats" on public.user_workout_stats;

-- Policy selezione dati dell'utente autenticato
create policy if not exists "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy if not exists "custom_workouts_select_own_or_shared"
on public.custom_workouts for select
to authenticated
using (
  user_id = auth.uid()
  or (shared_with is not null and shared_with @> array[auth.uid()])
);

create policy if not exists "user_workout_stats_select_own"
on public.user_workout_stats for select
to authenticated
using (user_id = auth.uid());
