-- Ranking semestral: quem completar mais semanas com 3+ corridas de 3 km ou mais.
-- O app recalcula a partir do Strava a cada corrida nova; aqui fica só o resumo por semestre.

create table if not exists public.sequencias_semestre (
  user_id uuid not null references public.perfis(id) on delete cascade,
  semestre text not null,                 -- ex.: '2026-2' (jul–dez)
  semanas_ok date[] not null default '{}', -- segundas-feiras das semanas em que bateu a meta
  km_total numeric(8,2) not null default 0,
  corridas integer not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, semestre)
);

alter table public.sequencias_semestre enable row level security;
drop policy if exists "sequencia: ver a própria" on public.sequencias_semestre;
create policy "sequencia: ver a própria" on public.sequencias_semestre for select using (user_id = auth.uid());

grant select on public.sequencias_semestre to authenticated;
grant select, insert, update, delete on public.sequencias_semestre to service_role;

-- Lista do semestre para quem está ativo (ou o treinador). Só alunos ativos que aparecem no ranking.
create or replace function public.ranking_semestral(p_semestre text)
returns table (user_id uuid, nome text, semanas_ok date[], km_total numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.perfis where id = auth.uid() and (status = 'ativo' or papel = 'treinador')
  ) then
    return;
  end if;
  return query
    select s.user_id, p.nome, s.semanas_ok, s.km_total
    from public.sequencias_semestre s join public.perfis p on p.id = s.user_id
    where s.semestre = p_semestre and p.status = 'ativo' and p.aparecer_ranking;
end;
$$;
grant execute on function public.ranking_semestral(text) to authenticated;
