-- Fórum de conteúdos (vídeos do YouTube) com comentários

create or replace function public.ativo_ou_treinador()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and (status = 'ativo' or papel = 'treinador'));
$$;
grant execute on function public.ativo_ou_treinador() to authenticated;

create table if not exists public.conteudos (
  id uuid primary key default gen_random_uuid(),
  aba text not null check (aba in ('conteudos', 'dicas')),
  categoria text not null check (categoria in ('tecnica', 'forca', 'fisioterapia', 'nutricao', 'massoterapia', 'provas')),
  titulo text not null check (char_length(titulo) between 3 and 140),
  descricao text,
  youtube_id text not null,
  parceiro_nome text,
  parceiro_instagram text,
  criado_em timestamptz not null default now()
);
create index if not exists conteudos_aba_idx on public.conteudos (aba, criado_em desc);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  conteudo_id uuid not null references public.conteudos (id) on delete cascade,
  autor_id uuid not null references public.perfis (id) on delete cascade,
  pai_id uuid references public.comentarios (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  criado_em timestamptz not null default now()
);
create index if not exists comentarios_conteudo_idx on public.comentarios (conteudo_id, criado_em);

alter table public.conteudos enable row level security;
alter table public.comentarios enable row level security;

drop policy if exists "conteudos: ativos leem" on public.conteudos;
create policy "conteudos: ativos leem" on public.conteudos for select using (public.ativo_ou_treinador());
drop policy if exists "conteudos: treinador gerencia" on public.conteudos;
create policy "conteudos: treinador gerencia" on public.conteudos for all using (public.eh_treinador()) with check (public.eh_treinador());

drop policy if exists "comentarios: ativos leem" on public.comentarios;
create policy "comentarios: ativos leem" on public.comentarios for select using (public.ativo_ou_treinador());
drop policy if exists "comentarios: ativos escrevem" on public.comentarios;
create policy "comentarios: ativos escrevem" on public.comentarios for insert
  with check (public.ativo_ou_treinador() and autor_id = auth.uid());
drop policy if exists "comentarios: autor ou treinador apaga" on public.comentarios;
create policy "comentarios: autor ou treinador apaga" on public.comentarios for delete
  using (autor_id = auth.uid() or public.eh_treinador());

grant select, insert, update, delete on public.conteudos to authenticated;
grant select, insert, delete on public.comentarios to authenticated;
grant select, insert, update, delete on public.conteudos, public.comentarios to service_role;

-- Comentários com o nome do autor (alunos não leem a tabela de perfis dos outros)
create or replace function public.comentarios_do_conteudo(p_conteudo uuid)
returns table (id uuid, pai_id uuid, texto text, criado_em timestamptz, autor_nome text, autor_treinador boolean, meu boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.pai_id, c.texto, c.criado_em,
         coalesce(p.nome, 'Aluno'), p.papel = 'treinador', c.autor_id = auth.uid()
  from public.comentarios c join public.perfis p on p.id = c.autor_id
  where c.conteudo_id = p_conteudo and public.ativo_ou_treinador()
  order by c.criado_em;
$$;
grant execute on function public.comentarios_do_conteudo(uuid) to authenticated;
