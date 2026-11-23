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
