-- Calendário oficial da assessoria (treinos, encontros e provas oficiais). Só o treinador cria/edita.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('coletivo', 'presencial', 'prova', 'encontro', 'aviso')),
  titulo text not null check (char_length(titulo) between 2 and 120),
  data date not null,
  hora_inicio time,
  hora_fim time,
  local_nome text,
  endereco text,
  descricao text,
  prova_id uuid references public.provas(id) on delete set null,
  grupo uuid,                         -- eventos repetidos (toda semana) compartilham o mesmo grupo
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists eventos_data_idx on public.eventos (data);

alter table public.eventos enable row level security;
drop policy if exists "eventos: ver (ativos)" on public.eventos;
create policy "eventos: ver (ativos)" on public.eventos for select using (public.ativo_ou_treinador());
drop policy if exists "eventos: treinador gerencia" on public.eventos;
create policy "eventos: treinador gerencia" on public.eventos for all using (public.eh_treinador()) with check (public.eh_treinador());

grant select, insert, update, delete on public.eventos to authenticated;
grant select, insert, update, delete on public.eventos to service_role;
