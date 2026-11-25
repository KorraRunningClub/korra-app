-- Testes de campo (1600 m, 3000 m, melhor 5 km) e as zonas de treino calculadas para cada aluno.
create table if not exists public.testes_zonas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  teste text not null check (teste in ('t1600', 't3000', 't5000')),
  data date not null default current_date,
  tempo_s integer not null check (tempo_s > 0),
  obs text,
  criado_em timestamptz not null default now()
);
create index if not exists testes_zonas_user_idx on public.testes_zonas (user_id, data desc);
alter table public.testes_zonas enable row level security;
drop policy if exists "zonas: aluno vê as próprias, treinador tudo" on public.testes_zonas;
create policy "zonas: aluno vê as próprias, treinador tudo" on public.testes_zonas for select using (user_id = auth.uid() or public.eh_treinador());
drop policy if exists "zonas: só treinador lança" on public.testes_zonas;
create policy "zonas: só treinador lança" on public.testes_zonas for all using (public.eh_treinador()) with check (public.eh_treinador());
grant select, insert, update, delete on public.testes_zonas to authenticated;
grant select, insert, update, delete on public.testes_zonas to service_role;
