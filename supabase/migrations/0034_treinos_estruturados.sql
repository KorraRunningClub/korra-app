-- Biblioteca de treinos: treinos montados por blocos (rodagem, regenerativo, longo e intervalados).
alter table public.treinos_modelo add column if not exists tipo text not null default 'intervalado';
alter table public.treinos_modelo add column if not exists subtipo text;
alter table public.treinos_modelo add column if not exists estrutura jsonb not null default '{}'::jsonb;
alter table public.treinos_modelo drop constraint if exists treinos_modelo_tipo_check;
alter table public.treinos_modelo add constraint treinos_modelo_tipo_check check (tipo in ('rodagem', 'regenerativo', 'longo', 'intervalado'));
alter table public.treinos_modelo alter column zona drop not null;
alter table public.treinos_modelo alter column reps_min drop not null;
alter table public.treinos_modelo alter column duracao drop not null;

-- os treinos de Limiar fracionado que já existiam passam para o formato novo
update public.treinos_modelo set
  subtipo = 'limiar_fracionado',
  estrutura = jsonb_build_object(
    'aquecimento', jsonb_build_object('valor', 15, 'unidade', 'min', 'zona', 2),
    'serie', jsonb_build_object('series', reps_min, 'series_max', reps_max, 'valor', duracao, 'unidade', 'min', 'zona', zona),
    'descanso_s', 60,
    'descanso_max_s', case when nivel = 'iniciante' then 80 else null end,
    'volta_calma', jsonb_build_object('valor', 10, 'unidade', 'min', 'zona', 1))
where estrutura = '{}'::jsonb and nome = 'Limiar fracionado';
