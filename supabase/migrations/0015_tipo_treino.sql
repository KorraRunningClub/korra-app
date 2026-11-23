-- O aluno marca o tipo de cada treino (para futuras conquistas).
create table if not exists public.treino_marcacoes (
  atividade_id bigint primary key,
  user_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('intervalado', 'rodagem', 'longao', 'fartlek', 'regenerativo')),
  data date not null,
  marcado_em timestamptz not null default now()
);
create index if not exists treino_marcacoes_user_idx on public.treino_marcacoes (user_id, tipo, data);

alter table public.treino_marcacoes enable row level security;
drop policy if exists "marcacoes: ver as próprias ou treinador" on public.treino_marcacoes;
create policy "marcacoes: ver as próprias ou treinador" on public.treino_marcacoes
  for select using (user_id = auth.uid() or public.eh_treinador());
drop policy if exists "marcacoes: aluno marca as próprias" on public.treino_marcacoes;
create policy "marcacoes: aluno marca as próprias" on public.treino_marcacoes
  for insert with check (user_id = auth.uid());
drop policy if exists "marcacoes: aluno muda as próprias" on public.treino_marcacoes;
create policy "marcacoes: aluno muda as próprias" on public.treino_marcacoes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "marcacoes: aluno apaga as próprias" on public.treino_marcacoes;
create policy "marcacoes: aluno apaga as próprias" on public.treino_marcacoes
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.treino_marcacoes to authenticated;
grant select, insert, update, delete on public.treino_marcacoes to service_role;
