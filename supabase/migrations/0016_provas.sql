-- Área de provas: lista compartilhada de provas e as inscrições de cada aluno (alvo ou secundária)

create table if not exists public.provas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 3 and 120),
  data date not null,
  distancia text not null check (distancia in ('5k', '10k', '15k', '21k', '42k', 'trail', 'outra')),
  distancia_km numeric(6,2),
  cidade text,
  link text,
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);
create unique index if not exists provas_nome_data_uidx on public.provas (lower(nome), data, distancia);
create index if not exists provas_data_idx on public.provas (data);

create table if not exists public.prova_inscricoes (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references public.provas(id) on delete cascade,
  user_id uuid not null references public.perfis(id) on delete cascade,
  categoria text not null check (categoria in ('alvo', 'secundaria')),
  tempo_oficial_s integer check (tempo_oficial_s > 0),
  status text not null default 'inscrito' check (status in ('inscrito', 'concluida', 'nao_correu')),
  criado_em timestamptz not null default now(),
  unique (prova_id, user_id)
);
create index if not exists prova_inscricoes_user_idx on public.prova_inscricoes (user_id);

alter table public.provas enable row level security;
alter table public.prova_inscricoes enable row level security;

drop policy if exists "provas: ver (ativos)" on public.provas;
create policy "provas: ver (ativos)" on public.provas for select using (public.ativo_ou_treinador());
drop policy if exists "provas: cadastrar (ativos)" on public.provas;
create policy "provas: cadastrar (ativos)" on public.provas for insert with check (public.ativo_ou_treinador() and criado_por = auth.uid());
drop policy if exists "provas: editar (quem criou ou treinador)" on public.provas;
create policy "provas: editar (quem criou ou treinador)" on public.provas for update using (criado_por = auth.uid() or public.eh_treinador());
drop policy if exists "provas: apagar (treinador)" on public.provas;
create policy "provas: apagar (treinador)" on public.provas for delete using (public.eh_treinador());

drop policy if exists "inscricoes: ver as próprias ou treinador" on public.prova_inscricoes;
create policy "inscricoes: ver as próprias ou treinador" on public.prova_inscricoes for select using (user_id = auth.uid() or public.eh_treinador());
drop policy if exists "inscricoes: aluno gerencia as próprias" on public.prova_inscricoes;
create policy "inscricoes: aluno gerencia as próprias" on public.prova_inscricoes for all
  using ((user_id = auth.uid() and public.ativo_ou_treinador()) or public.eh_treinador())
  with check ((user_id = auth.uid() and public.ativo_ou_treinador()) or public.eh_treinador());

grant select, insert, update, delete on public.provas, public.prova_inscricoes to authenticated;
grant select, insert, update, delete on public.provas, public.prova_inscricoes to service_role;

-- Quem da Korrá vai correr cada prova (só nomes; para alunos ativos)
create or replace function public.provas_participantes()
returns table (prova_id uuid, nome text, categoria text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ativo_ou_treinador() then return; end if;
  return query
    select i.prova_id, p.nome, i.categoria
    from public.prova_inscricoes i join public.perfis p on p.id = i.user_id
    join public.provas pr on pr.id = i.prova_id
    where p.status = 'ativo' and i.status <> 'nao_correu' and pr.data >= current_date - 30;
end;
$$;
grant execute on function public.provas_participantes() to authenticated;
