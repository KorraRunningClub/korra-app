-- Ranking com Strava

-- Opção de aparecer ou não no ranking
alter table public.perfis add column if not exists aparecer_ranking boolean not null default true;

-- Conexão de cada aluno com o Strava (tokens: só o servidor lê, nunca o navegador)
create table if not exists public.strava_conexoes (
  user_id uuid primary key references public.perfis (id) on delete cascade,
  athlete_id bigint unique not null,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  scope text,
  criado_em timestamptz not null default now()
);
alter table public.strava_conexoes enable row level security;
revoke all on public.strava_conexoes from anon, authenticated;

-- Corridas importadas
create table if not exists public.atividades (
  id bigint primary key,                 -- id da atividade no Strava
  user_id uuid not null references public.perfis (id) on delete cascade,
  fonte text not null default 'strava',
  inicio_local timestamp not null,        -- horário local da largada
  tipo text,
  esteira boolean not null default false,
  distancia_m numeric not null,
  tempo_mov_s integer not null,
  tempo_total_s integer not null,
  nome text,
  atualizado_em timestamptz not null default now()
);
create index if not exists atividades_inicio_idx on public.atividades (inicio_local);
create index if not exists atividades_user_idx on public.atividades (user_id, inicio_local);
alter table public.atividades enable row level security;
drop policy if exists "atividades: ver as próprias ou treinador" on public.atividades;
create policy "atividades: ver as próprias ou treinador" on public.atividades
  for select using (user_id = auth.uid() or public.eh_treinador());
grant select on public.atividades to authenticated;

-- O aluno logado tem Strava conectado?
create or replace function public.strava_conectado()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.strava_conexoes where user_id = auth.uid());
$$;
grant execute on function public.strava_conectado() to authenticated;

-- Ranking (só para alunos ativos e treinador). tipo: km | longa | rapida
create or replace function public.ranking(p_tipo text, p_inicio timestamp, p_fim timestamp)
returns table (user_id uuid, nome text, valor numeric, distancia_m numeric, tempo_mov_s integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.perfis
    where id = auth.uid() and (status = 'ativo' or papel = 'treinador')
  ) then
    return;
  end if;

  if p_tipo = 'km' then
    return query
      select a.user_id, p.nome, round(sum(a.distancia_m) / 1000, 2), sum(a.distancia_m), sum(a.tempo_mov_s)::integer
      from public.atividades a join public.perfis p on p.id = a.user_id
      where p.status = 'ativo' and p.aparecer_ranking
        and a.inicio_local >= p_inicio and a.inicio_local < p_fim
      group by a.user_id, p.nome
      order by 3 desc limit 50;
  elsif p_tipo = 'longa' then
    return query
      select distinct on (a.user_id) a.user_id, p.nome, round(a.distancia_m / 1000, 2), a.distancia_m, a.tempo_mov_s
      from public.atividades a join public.perfis p on p.id = a.user_id
      where p.status = 'ativo' and p.aparecer_ranking
        and a.inicio_local >= p_inicio and a.inicio_local < p_fim
        and a.tempo_total_s - a.tempo_mov_s <= 120
      order by a.user_id, a.distancia_m desc;
  elsif p_tipo = 'rapida' then
    return query
      select distinct on (a.user_id) a.user_id, p.nome, round(a.tempo_mov_s / (a.distancia_m / 1000), 1), a.distancia_m, a.tempo_mov_s
      from public.atividades a join public.perfis p on p.id = a.user_id
      where p.status = 'ativo' and p.aparecer_ranking
        and a.inicio_local >= p_inicio and a.inicio_local < p_fim
        and a.distancia_m >= 5000
        and a.tempo_total_s - a.tempo_mov_s <= 120
      order by a.user_id, a.tempo_mov_s / a.distancia_m asc;
  end if;
end;
$$;
grant execute on function public.ranking(text, timestamp, timestamp) to authenticated;
