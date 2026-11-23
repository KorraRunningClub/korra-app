-- Fases do treinamento no calendário (base, específico, competitivo, polimento...): um período colorido.
create table if not exists public.fases (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 60),
  descricao text,
  inicio date not null,
  fim date not null check (fim >= inicio),
  cor text not null check (cor in ('vermelho', 'laranja', 'amarelo', 'verde', 'azul', 'roxo', 'cinza')),
  criado_em timestamptz not null default now()
);
create index if not exists fases_periodo_idx on public.fases (inicio, fim);

alter table public.fases enable row level security;
drop policy if exists "fases: ver (ativos)" on public.fases;
create policy "fases: ver (ativos)" on public.fases for select using (public.ativo_ou_treinador());
drop policy if exists "fases: treinador gerencia" on public.fases;
create policy "fases: treinador gerencia" on public.fases for all using (public.eh_treinador()) with check (public.eh_treinador());

grant select, insert, update, delete on public.fases to authenticated;
grant select, insert, update, delete on public.fases to service_role;
