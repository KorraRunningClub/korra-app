-- Controle financeiro dos alunos de personal + notificações do treinador.
create table if not exists public.personal_alunos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 100),
  telefone text,
  plano text not null check (plano in ('mensal', 'trimestral', 'semestral', 'anual', 'avulso')),
  valor numeric(10,2) not null check (valor >= 0),
  inicio date not null,
  fim date not null,
  pago boolean not null default false,
  pago_em date,
  situacao text not null default 'ativo' check (situacao in ('ativo', 'pausado', 'cancelado')),
  obs text,
  criado_em timestamptz not null default now()
);
create table if not exists public.personal_historico (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.personal_alunos(id) on delete cascade,
  dono uuid not null default auth.uid(),
  plano text not null, valor numeric(10,2) not null, inicio date not null, fim date not null,
  pago boolean not null, pago_em date, criado_em timestamptz not null default now()
);
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  chave text not null,
  titulo text not null,
  texto text,
  link text,
  lida boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (dono, chave)
);
alter table public.agenda_itens add column if not exists personal_id uuid references public.personal_alunos(id) on delete set null;

alter table public.personal_alunos enable row level security;
alter table public.personal_historico enable row level security;
alter table public.notificacoes enable row level security;
drop policy if exists "personal: só o dono" on public.personal_alunos;
create policy "personal: só o dono" on public.personal_alunos for all using (dono = auth.uid() and public.eh_treinador()) with check (dono = auth.uid() and public.eh_treinador());
drop policy if exists "historico: só o dono" on public.personal_historico;
create policy "historico: só o dono" on public.personal_historico for all using (dono = auth.uid() and public.eh_treinador()) with check (dono = auth.uid() and public.eh_treinador());
drop policy if exists "notificacoes: só o dono" on public.notificacoes;
create policy "notificacoes: só o dono" on public.notificacoes for all using (dono = auth.uid()) with check (dono = auth.uid());
grant select, insert, update, delete on public.personal_alunos, public.personal_historico, public.notificacoes to authenticated;
grant select, insert, update, delete on public.personal_alunos, public.personal_historico, public.notificacoes to service_role;
