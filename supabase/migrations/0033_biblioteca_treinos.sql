-- Biblioteca de treinos do treinador (por fase e nível). Só o treinador vê e edita.
create table if not exists public.treinos_modelo (
  id uuid primary key default gen_random_uuid(),
  fase text not null check (fase in ('base', 'especifico', 'polimento')),
  nivel text not null check (nivel in ('iniciante', 'intermediario', 'avancado', 'todos')),
  nome text not null check (char_length(nome) between 2 and 80),
  zona integer not null check (zona between 1 and 6),
  reps_min integer not null check (reps_min between 1 and 60),
  reps_max integer check (reps_max is null or reps_max >= reps_min),
  duracao numeric(7,2) not null check (duracao > 0),
  unidade text not null default 'min' check (unidade in ('min', 'm')),
  recuperacao text,
  aquecimento text not null default 'Aquecimento',
  desaquecimento text not null default 'Desaquecimento',
  obs text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
alter table public.treinos_modelo enable row level security;
drop policy if exists "treinos_modelo: só treinador" on public.treinos_modelo;
create policy "treinos_modelo: só treinador" on public.treinos_modelo for all using (public.eh_treinador()) with check (public.eh_treinador());
grant select, insert, update, delete on public.treinos_modelo to authenticated;
grant select, insert, update, delete on public.treinos_modelo to service_role;

-- Primeiros treinos: Limiar fracionado (período de base)
insert into public.treinos_modelo (fase, nivel, nome, zona, reps_min, reps_max, duracao, unidade, recuperacao, obs, ordem)
select * from (values
  ('base', 'iniciante', 'Limiar fracionado', 4, 4, null::int, 5, 'min', '1 min a 1min20 de trote', '20 min totais em limiar.', 1),
  ('base', 'intermediario', 'Limiar fracionado', 4, 7, null::int, 4, 'min', '1 min de trote', '28 min totais em limiar.', 2),
  ('base', 'avancado', 'Limiar fracionado', 4, 10, 12, 4, 'min', '1 min de trote', '40 a 48 min totais em limiar.', 3)
) v(fase, nivel, nome, zona, reps_min, reps_max, duracao, unidade, recuperacao, obs, ordem)
where not exists (select 1 from public.treinos_modelo where nome = 'Limiar fracionado');
