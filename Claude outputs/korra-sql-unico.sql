-- KORRÁ · SQL ÚNICO (migrações 0011 a 0034).
-- Pode rodar de uma vez, mesmo que alguma parte já tenha sido rodada antes: tudo é seguro para repetir.


-- ===================== migrations/0011_loja_estoque.sql =====================
-- Loja: estoque das peças e caixa da loja (controle manual do treinador)

create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  produto text not null check (produto in ('camiseta', 'squeeze', 'outro')),
  nome text not null unique,
  quantidade integer not null default 0 check (quantidade >= 0),
  ordem integer not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.loja_movimentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('saldo_inicial', 'venda', 'compra', 'retirada', 'ajuste')),
  descricao text,
  valor numeric(10,2) not null,          -- entrada positiva, saída negativa
  criado_em timestamptz not null default now()
);
create index if not exists loja_mov_data_idx on public.loja_movimentos (data desc);

alter table public.estoque_itens enable row level security;
alter table public.loja_movimentos enable row level security;
drop policy if exists "estoque: só treinador" on public.estoque_itens;
create policy "estoque: só treinador" on public.estoque_itens for all using (public.eh_treinador()) with check (public.eh_treinador());
drop policy if exists "caixa loja: só treinador" on public.loja_movimentos;
create policy "caixa loja: só treinador" on public.loja_movimentos for all using (public.eh_treinador()) with check (public.eh_treinador());

grant select, insert, update, delete on public.estoque_itens, public.loja_movimentos to authenticated;
grant select, insert, update, delete on public.estoque_itens, public.loja_movimentos to service_role;


-- ===================== migrations/0012_semestral.sql =====================
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


-- ===================== migrations/0013_pedidos.sql =====================
-- Pedidos da loja feitos pelo site (viram mensagem no WhatsApp e reservam as peças no estoque)

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  criado_em timestamptz not null default now(),
  user_id uuid references public.perfis(id) on delete set null,
  nome text not null,
  telefone text,
  item_id text not null,
  item_nome text not null,
  quantidade integer not null check (quantidade between 1 and 10),
  valor numeric(10,2) not null,
  observacao text,
  status text not null default 'pendente' check (status in ('pendente', 'entregue', 'cancelado')),
  finalizado_em timestamptz
);
create index if not exists pedidos_status_idx on public.pedidos (status, criado_em desc);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  descricao text not null
);
create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
drop policy if exists "pedidos: só treinador" on public.pedidos;
create policy "pedidos: só treinador" on public.pedidos for all using (public.eh_treinador()) with check (public.eh_treinador());
drop policy if exists "pedido_itens: só treinador" on public.pedido_itens;
create policy "pedido_itens: só treinador" on public.pedido_itens for all using (public.eh_treinador()) with check (public.eh_treinador());

grant select, insert, update, delete on public.pedidos, public.pedido_itens to authenticated;
grant select, insert, update, delete on public.pedidos, public.pedido_itens to service_role;
grant select on public.estoque_itens to service_role;

-- Pagamento via Pix: pendente → pago (comprovante recebido) → entregue
alter table public.pedidos add column if not exists pago_em timestamptz;
alter table public.pedidos drop constraint if exists pedidos_status_check;
alter table public.pedidos add constraint pedidos_status_check check (status in ('pendente', 'pago', 'entregue', 'cancelado'));


-- ===================== migrations/0014_estilo_camiseta.sql =====================
-- Camisetas: sem "estampa" (todas têm peito e costas), com "estilo" (Tradicional unissex ou Baby look),
-- tamanhos P, M, G e GG. Funciona tanto se a versão anterior deste SQL já foi rodada quanto se não foi.

create temp table mapa_camisetas as
select id, quantidade,
  case
    when nome ~ '^Camiseta (Preta|Branca) · (Tradicional|Baby look) · (Peito|Costas) · '
      then regexp_replace(nome, '^Camiseta (Preta|Branca) · (Tradicional|Baby look) · (Peito|Costas) · ', 'Camiseta \1 · \2 · ')
    when nome ~ '^Camiseta (Preta|Branca) · (Peito|Costas) · '
      then regexp_replace(nome, '^Camiseta (Preta|Branca) · (Peito|Costas) · ', 'Camiseta \1 · Tradicional · ')
  end as novo
from public.estoque_itens
where produto = 'camiseta';
delete from mapa_camisetas where novo is null;

-- junta as quantidades (ex.: Peito + Costas do mesmo tamanho viram uma linha só)
insert into public.estoque_itens (produto, nome, quantidade, ordem)
select 'camiseta', novo, sum(quantidade), 400 from mapa_camisetas group by novo
on conflict (nome) do update set quantidade = public.estoque_itens.quantidade + excluded.quantidade;

-- pedidos apontam para a linha nova
update public.pedido_itens pi set estoque_item_id = e.id
from mapa_camisetas m join public.estoque_itens e on e.nome = m.novo
where pi.estoque_item_id = m.id;

update public.pedido_itens set descricao = regexp_replace(descricao, '^Camiseta (Preta|Branca) · (Tradicional|Baby look) · (Peito|Costas) · ', 'Camiseta \1 · \2 · ')
where descricao ~ '^Camiseta (Preta|Branca) · (Tradicional|Baby look) · (Peito|Costas) · ';
update public.pedido_itens set descricao = regexp_replace(descricao, '^Camiseta (Preta|Branca) · (Peito|Costas) · ', 'Camiseta \1 · Tradicional · ')
where descricao ~ '^Camiseta (Preta|Branca) · (Peito|Costas) · ';

delete from public.estoque_itens where id in (select id from mapa_camisetas);

-- PP e XGG zerados saem da lista
delete from public.estoque_itens where produto = 'camiseta' and quantidade = 0 and nome ~ ' · (PP|XGG)$';

-- cria as combinações que faltam, zeradas
insert into public.estoque_itens (produto, nome, quantidade, ordem)
select 'camiseta', format('Camiseta %s · %s · %s', c.cor, e.estilo, t.tam), 0, 500
from (values ('Preta'), ('Branca')) c(cor)
cross join (values ('Tradicional'), ('Baby look')) e(estilo)
cross join (values ('P'), ('M'), ('G'), ('GG')) t(tam)
on conflict (nome) do nothing;

drop table mapa_camisetas;


-- ===================== migrations/0015_tipo_treino.sql =====================
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

-- Tipo "prova" (dia de competição)
alter table public.treino_marcacoes drop constraint if exists treino_marcacoes_tipo_check;
alter table public.treino_marcacoes add constraint treino_marcacoes_tipo_check
  check (tipo in ('intervalado', 'rodagem', 'longao', 'fartlek', 'regenerativo', 'prova', 'teste'));

-- Com quem correu (sozinho, dupla, grupo); o tipo passa a ser opcional
alter table public.treino_marcacoes alter column tipo drop not null;
alter table public.treino_marcacoes add column if not exists companhia text;
alter table public.treino_marcacoes drop constraint if exists treino_marcacoes_companhia_check;
alter table public.treino_marcacoes add constraint treino_marcacoes_companhia_check
  check (companhia in ('sozinho', 'dupla', 'grupo'));


-- ===================== migrations/0016_provas.sql =====================
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


-- ===================== migrations/0017_calendario.sql =====================
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


-- ===================== migrations/0018_fases.sql =====================
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


-- ===================== migrations/0019_viajante.sql =====================
-- Conquista "O viajante": estado (UF) de cada prova e o estado onde o aluno mora.
alter table public.provas add column if not exists uf text;
alter table public.provas drop constraint if exists provas_uf_check;
alter table public.provas add constraint provas_uf_check check (uf is null or uf in
  ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO','EX'));
alter table public.perfis add column if not exists uf_casa text not null default 'SC';


-- ===================== migrations/0020_pontos_diz_ai.sql =====================
-- Pontos do Diz Aí: 10 pontos por post, no máximo 1 post pontuado por dia (fuso de SP).
-- Fica guardado à parte porque os posts somem em 24 h.
create table if not exists public.pontos_diz_ai (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  post_id uuid,
  dia date not null,
  pontos integer not null default 10,
  criado_em timestamptz not null default now(),
  unique (user_id, dia)
);

alter table public.pontos_diz_ai enable row level security;
drop policy if exists "pontos: ver os próprios ou treinador" on public.pontos_diz_ai;
create policy "pontos: ver os próprios ou treinador" on public.pontos_diz_ai for select using (user_id = auth.uid() or public.eh_treinador());
grant select on public.pontos_diz_ai to authenticated;
grant select, insert, update, delete on public.pontos_diz_ai to service_role;

create or replace function public.pontuar_post_diz_ai()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pontos_diz_ai (user_id, post_id, dia)
  values (new.autor_id, new.id, (new.criado_em at time zone 'America/Sao_Paulo')::date)
  on conflict (user_id, dia) do nothing;
  return new;
end;
$$;
drop trigger if exists posts_pontuar on public.posts;
create trigger posts_pontuar after insert on public.posts for each row execute function public.pontuar_post_diz_ai();

-- posts que ainda estão no ar também contam
insert into public.pontos_diz_ai (user_id, post_id, dia)
select autor_id, id, (criado_em at time zone 'America/Sao_Paulo')::date from public.posts
on conflict (user_id, dia) do nothing;


-- ===================== migrations/0021_ciclo.sql =====================
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


-- ===================== migrations/0022_agenda.sql =====================
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


-- ===================== migrations/0023_personal_financeiro.sql =====================
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


-- ===================== migrations/0024_ranking_complementar.sql =====================
-- Ranking "Treino de força ou complementar": dias com treino extra (força, mobilidade, outro) no período.
create or replace function public.ranking_complementar(p_inicio date, p_fim date)
returns table (user_id uuid, nome text, valor bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.perfis where id = auth.uid() and (status = 'ativo' or papel = 'treinador')) then
    return;
  end if;
  return query
    select e.user_id, p.nome, count(distinct e.data)
    from public.treinos_extras e join public.perfis p on p.id = e.user_id
    where p.status = 'ativo' and p.aparecer_ranking
      and e.tipo in ('forca', 'mobilidade', 'outro')
      and e.data >= p_inicio and e.data < p_fim
    group by e.user_id, p.nome
    order by 3 desc limit 50;
end;
$$;
grant execute on function public.ranking_complementar(date, date) to authenticated;


-- ===================== migrations/0025_extras_strava.sql =====================
-- Treinos de força/complementares vindos do Strava (musculação, crossfit, yoga...) viram "treinos extras".
alter table public.treinos_extras add column if not exists strava_id bigint unique;


-- ===================== migrations/0026_complementar_so_strava.sql =====================
-- Ranking Força / compl.: só treinos vindos do Strava (automático).
create or replace function public.ranking_complementar(p_inicio date, p_fim date)
returns table (user_id uuid, nome text, valor bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.perfis where id = auth.uid() and (status = 'ativo' or papel = 'treinador')) then
    return;
  end if;
  return query
    select e.user_id, p.nome, count(distinct e.data)
    from public.treinos_extras e join public.perfis p on p.id = e.user_id
    where p.status = 'ativo' and p.aparecer_ranking
      and e.strava_id is not null
      and e.tipo in ('forca', 'mobilidade', 'outro')
      and e.data >= p_inicio and e.data < p_fim
    group by e.user_id, p.nome
    order by 3 desc limit 50;
end;
$$;


-- ===================== migrations/0027_atividades_complementares.sql =====================
-- Treinos complementares do Strava aparecem em "Minhas últimas atividades" com hora e as categorias que o aluno marcar.
alter table public.treinos_extras add column if not exists inicio_local timestamp;
alter table public.treinos_extras add column if not exists categorias text[] not null default '{}';
alter table public.treinos_extras drop constraint if exists treinos_extras_categorias_check;
alter table public.treinos_extras add constraint treinos_extras_categorias_check
  check (categorias <@ array['forca', 'flexibilidade', 'pliometria', 'potencia']::text[]);


-- ===================== migrations/0028_comprovantes.sql =====================
-- Comprovante (foto/print ou PDF) anexado a cada despesa. Arquivos privados, só o treinador acessa.
alter table public.despesas add column if not exists comprovante text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "comprovantes: treinador envia" on storage.objects;
create policy "comprovantes: treinador envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and public.eh_treinador());
drop policy if exists "comprovantes: treinador vê" on storage.objects;
create policy "comprovantes: treinador vê" on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and public.eh_treinador());
drop policy if exists "comprovantes: treinador apaga" on storage.objects;
create policy "comprovantes: treinador apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes' and public.eh_treinador());


-- ===================== migrations/0029_zonas.sql =====================
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


-- ===================== migrations/0030_teste_atividade.sql =====================
-- Teste pode vir de uma atividade do Strava do aluno
alter table public.testes_zonas add column if not exists atividade_id bigint;


-- ===================== migrations/0031_tipo_teste.sql =====================
-- Tipo de treino "teste" (o aluno marca; o treinador recebe aviso e registra o teste)
alter table public.treino_marcacoes drop constraint if exists treino_marcacoes_tipo_check;
alter table public.treino_marcacoes add constraint treino_marcacoes_tipo_check
  check (tipo in ('intervalado', 'rodagem', 'longao', 'fartlek', 'regenerativo', 'prova', 'teste'));


-- ===================== migrations/0032_vdot.sql =====================
-- Metodologia VDOT: entra o teste de 2400 m.
alter table public.testes_zonas drop constraint if exists testes_zonas_teste_check;
alter table public.testes_zonas add constraint testes_zonas_teste_check check (teste in ('t1600', 't2400', 't3000', 't5000'));


-- ===================== migrations/0033_biblioteca_treinos.sql =====================
-- Biblioteca de treinos do treinador (por fase e nível). Só o treinador vê e edita.
create table if not exists public.treinos_modelo (
  id uuid primary key default gen_random_uuid(),
  fase text not null check (fase in ('base', 'especifico', 'polimento')),
  nivel text not null check (nivel in ('iniciante', 'intermediario', 'avancado', 'todos')),
  nome text not null check (char_length(nome) between 2 and 80),
  zona integer not null check (zona between 1 and 6),
  reps_min integer not null check (reps_min between 1 and 60),
  reps_max integer check (reps_max is null or reps_max >= reps_min),
  duracao numeric(7,2) not null check (duracao > 0),
  unidade text not null default 'min' check (unidade in ('min', 'm')),
  recuperacao text,
  aquecimento text not null default 'Aquecimento',
  desaquecimento text not null default 'Desaquecimento',
  obs text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
alter table public.treinos_modelo enable row level security;
drop policy if exists "treinos_modelo: só treinador" on public.treinos_modelo;
create policy "treinos_modelo: só treinador" on public.treinos_modelo for all using (public.eh_treinador()) with check (public.eh_treinador());
grant select, insert, update, delete on public.treinos_modelo to authenticated;
grant select, insert, update, delete on public.treinos_modelo to service_role;

-- Primeiros treinos: Limiar fracionado (período de base)
insert into public.treinos_modelo (fase, nivel, nome, zona, reps_min, reps_max, duracao, unidade, recuperacao, obs, ordem)
select * from (values
  ('base', 'iniciante', 'Limiar fracionado', 4, 4, null::int, 5, 'min', '1 min a 1min20 de trote', '20 min totais em limiar.', 1),
  ('base', 'intermediario', 'Limiar fracionado', 4, 7, null::int, 4, 'min', '1 min de trote', '28 min totais em limiar.', 2),
  ('base', 'avancado', 'Limiar fracionado', 4, 10, 12, 4, 'min', '1 min de trote', '40 a 48 min totais em limiar.', 3)
) v(fase, nivel, nome, zona, reps_min, reps_max, duracao, unidade, recuperacao, obs, ordem)
where not exists (select 1 from public.treinos_modelo where nome = 'Limiar fracionado');


-- ===================== migrations/0034_treinos_estruturados.sql =====================
-- Biblioteca de treinos: treinos montados por blocos (rodagem, regenerativo, longo e intervalados).
alter table public.treinos_modelo add column if not exists tipo text not null default 'intervalado';
alter table public.treinos_modelo add column if not exists subtipo text;
alter table public.treinos_modelo add column if not exists estrutura jsonb not null default '{}'::jsonb;
alter table public.treinos_modelo drop constraint if exists treinos_modelo_tipo_check;
alter table public.treinos_modelo add constraint treinos_modelo_tipo_check check (tipo in ('rodagem', 'regenerativo', 'longo', 'intervalado'));
alter table public.treinos_modelo alter column zona drop not null;
alter table public.treinos_modelo alter column reps_min drop not null;
alter table public.treinos_modelo alter column duracao drop not null;

-- os treinos de Limiar fracionado que já existiam passam para o formato novo
update public.treinos_modelo set
  subtipo = 'limiar_fracionado',
  estrutura = jsonb_build_object(
    'aquecimento', jsonb_build_object('valor', 15, 'unidade', 'min', 'zona', 2),
    'serie', jsonb_build_object('series', reps_min, 'series_max', reps_max, 'valor', duracao, 'unidade', 'min', 'zona', zona),
    'descanso_s', 60,
    'descanso_max_s', case when nivel = 'iniciante' then 80 else null end,
    'volta_calma', jsonb_build_object('valor', 10, 'unidade', 'min', 'zona', 1))
where estrutura = '{}'::jsonb and nome = 'Limiar fracionado';

