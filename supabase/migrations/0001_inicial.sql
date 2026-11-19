-- Korrá Running Club · estrutura inicial do banco (fase 1)
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run.

-- 1. Perfis (um por usuário do login)
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text,
  telefone text,
  data_nascimento date,
  papel text not null default 'aluno' check (papel in ('aluno', 'treinador')),
  status text not null default 'pendente' check (status in ('pendente', 'ativo', 'bloqueado')),
  responsavel_nome text,          -- obrigatório para menores de idade
  consentimento_responsavel boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém entra pela primeira vez
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Função auxiliar: o usuário atual é treinador?
create or replace function public.eh_treinador()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'treinador');
$$;

-- 2. Planos
create table if not exists public.planos (
  id text primary key,
  nome text not null,
  valor numeric(10,2) not null,
  meses int not null default 1,
  ativo boolean not null default true
);
insert into public.planos (id, nome, valor, meses) values ('mensal', 'Mensal', 165.00, 1)
on conflict (id) do nothing;

-- 3. Pagamentos (vão ser preenchidos automaticamente pelo Asaas na próxima etapa)
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  plano_id text references public.planos (id),
  valor numeric(10,2) not null,
  vencimento date not null,
  pago_em timestamptz,
  forma text check (forma in ('pix', 'cartao', 'boleto', 'dinheiro', 'outro')),
  status text not null default 'aberto' check (status in ('aberto', 'pago', 'atrasado', 'cancelado')),
  gateway_id text unique,          -- id da cobrança no Asaas
  criado_em timestamptz not null default now()
);

-- 4. Despesas do fluxo de caixa
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  categoria text not null check (categoria in ('gasolina', 'hidratacao', 'material', 'alimentacao', 'aplicativos', 'outros')),
  descricao text,
  valor numeric(10,2) not null check (valor >= 0),
  criado_em timestamptz not null default now()
);

-- 5. Segurança (RLS): cada aluno só vê o que é dele; o treinador vê tudo
alter table public.perfis enable row level security;
alter table public.planos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.despesas enable row level security;

drop policy if exists "perfil: ver o próprio ou treinador" on public.perfis;
create policy "perfil: ver o próprio ou treinador" on public.perfis
  for select using (id = auth.uid() or public.eh_treinador());

drop policy if exists "perfil: aluno edita dados básicos" on public.perfis;
create policy "perfil: aluno edita dados básicos" on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "perfil: treinador edita" on public.perfis;
create policy "perfil: treinador edita" on public.perfis
  for update using (public.eh_treinador());

-- Aluno não pode mudar o próprio papel nem status
create or replace function public.proteger_campos_perfil()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.eh_treinador() then
    new.papel := old.papel;
    new.status := old.status;
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_perfil on public.perfis;
create trigger proteger_perfil before update on public.perfis
  for each row execute function public.proteger_campos_perfil();

drop policy if exists "planos: todos leem" on public.planos;
create policy "planos: todos leem" on public.planos for select using (true);
drop policy if exists "planos: treinador gerencia" on public.planos;
create policy "planos: treinador gerencia" on public.planos for all using (public.eh_treinador()) with check (public.eh_treinador());

drop policy if exists "pagamentos: ver os próprios ou treinador" on public.pagamentos;
create policy "pagamentos: ver os próprios ou treinador" on public.pagamentos
  for select using (aluno_id = auth.uid() or public.eh_treinador());
drop policy if exists "pagamentos: treinador gerencia" on public.pagamentos;
create policy "pagamentos: treinador gerencia" on public.pagamentos
  for all using (public.eh_treinador()) with check (public.eh_treinador());

drop policy if exists "despesas: só treinador" on public.despesas;
create policy "despesas: só treinador" on public.despesas
  for all using (public.eh_treinador()) with check (public.eh_treinador());

-- 6. Depois de entrar no app pela primeira vez com o seu e-mail, rode a linha abaixo
--    (trocando o e-mail) para virar treinador:
-- update public.perfis set papel = 'treinador', status = 'ativo' where email = 'SEU-EMAIL@exemplo.com';
