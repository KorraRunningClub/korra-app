-- Ciclo de treino da prova-alvo (configurado pelo treinador) + treinos extras marcados pelo aluno.
alter table public.prova_inscricoes
  add column if not exists ciclo_semanas integer check (ciclo_semanas between 1 and 52),
  add column if not exists ciclo_inicio date,
  add column if not exists ciclo_meta integer check (ciclo_meta between 1 and 14),
  add column if not exists ciclo_ajustes jsonb not null default '{}'::jsonb;

-- só o treinador mexe no ciclo
create or replace function public.proteger_ciclo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.eh_treinador() then
    new.ciclo_semanas := old.ciclo_semanas;
    new.ciclo_inicio := old.ciclo_inicio;
    new.ciclo_meta := old.ciclo_meta;
    new.ciclo_ajustes := old.ciclo_ajustes;
  end if;
  return new;
end;
$$;
drop trigger if exists prova_inscricoes_proteger_ciclo on public.prova_inscricoes;
create trigger prova_inscricoes_proteger_ciclo before update on public.prova_inscricoes
  for each row execute function public.proteger_ciclo();

create table if not exists public.treinos_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  tipo text not null check (tipo in ('forca', 'mobilidade', 'corrida', 'outro')),
  descricao text,
  criado_em timestamptz not null default now()
);
create index if not exists treinos_extras_user_idx on public.treinos_extras (user_id, data);
alter table public.treinos_extras enable row level security;
drop policy if exists "extras: ver os próprios ou treinador" on public.treinos_extras;
create policy "extras: ver os próprios ou treinador" on public.treinos_extras for select using (user_id = auth.uid() or public.eh_treinador());
drop policy if exists "extras: aluno gerencia os próprios" on public.treinos_extras;
create policy "extras: aluno gerencia os próprios" on public.treinos_extras for all
  using (user_id = auth.uid() or public.eh_treinador()) with check (user_id = auth.uid() or public.eh_treinador());
grant select, insert, update, delete on public.treinos_extras to authenticated;
grant select, insert, update, delete on public.treinos_extras to service_role;
