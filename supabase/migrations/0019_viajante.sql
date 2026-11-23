-- Conquista "O viajante": estado (UF) de cada prova e o estado onde o aluno mora.
alter table public.provas add column if not exists uf text;
alter table public.provas drop constraint if exists provas_uf_check;
alter table public.provas add constraint provas_uf_check check (uf is null or uf in
  ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO','EX'));
alter table public.perfis add column if not exists uf_casa text not null default 'SC';
