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
