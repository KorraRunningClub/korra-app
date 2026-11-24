-- Agenda pessoal do treinador (aulas de personal, treinos, compromissos). Só ele vê.
create table if not exists public.agenda_itens (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('personal', 'assessoria', 'treino', 'outro')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null check (hora_fim > hora_inicio),
  local text,
  obs text,
  grupo uuid,
  criado_em timestamptz not null default now()
);
create index if not exists agenda_itens_data_idx on public.agenda_itens (dono, data);

alter table public.agenda_itens enable row level security;
drop policy if exists "agenda: só o dono (treinador)" on public.agenda_itens;
create policy "agenda: só o dono (treinador)" on public.agenda_itens for all
  using (dono = auth.uid() and public.eh_treinador()) with check (dono = auth.uid() and public.eh_treinador());
grant select, insert, update, delete on public.agenda_itens to authenticated;
grant select, insert, update, delete on public.agenda_itens to service_role;
