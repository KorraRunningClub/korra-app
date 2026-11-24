-- Treinos de força/complementares vindos do Strava (musculação, crossfit, yoga...) viram "treinos extras".
alter table public.treinos_extras add column if not exists strava_id bigint unique;
