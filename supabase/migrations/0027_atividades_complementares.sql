-- Treinos complementares do Strava aparecem em "Minhas últimas atividades" com hora e as categorias que o aluno marcar.
alter table public.treinos_extras add column if not exists inicio_local timestamp;
alter table public.treinos_extras add column if not exists categorias text[] not null default '{}';
alter table public.treinos_extras drop constraint if exists treinos_extras_categorias_check;
alter table public.treinos_extras add constraint treinos_extras_categorias_check
  check (categorias <@ array['forca', 'flexibilidade', 'pliometria', 'potencia']::text[]);
