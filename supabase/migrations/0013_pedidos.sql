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
