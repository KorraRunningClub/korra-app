-- Cadastro completo do aluno
alter table public.perfis
  add column if not exists objetivo text,
  add column if not exists responsavel_telefone text,
  add column if not exists autoriza_imagem boolean not null default false,
  add column if not exists aceite_termos_em timestamptz,
  add column if not exists cadastro_completo boolean not null default false;
