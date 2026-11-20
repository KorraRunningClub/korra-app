-- Novas categorias de despesa: inscrições em provas e brindes
alter table public.despesas drop constraint if exists despesas_categoria_check;
alter table public.despesas add constraint despesas_categoria_check
  check (categoria in ('gasolina', 'hidratacao', 'material', 'alimentacao', 'aplicativos', 'inscricoes', 'brindes', 'outros'));
