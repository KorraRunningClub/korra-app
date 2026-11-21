-- "Diz Aí Como Foi": fotos e vídeos curtos que somem em 24 h

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.perfis (id) on delete cascade,
  tipo text not null check (tipo in ('foto', 'video')),
  caminho text not null,
  legenda text check (char_length(legenda) <= 300),
  criado_em timestamptz not null default now()
);
create index if not exists posts_criado_idx on public.posts (criado_em desc);

create table if not exists public.post_reacoes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.perfis (id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.post_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  autor_id uuid not null references public.perfis (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  criado_em timestamptz not null default now()
);
create index if not exists post_comentarios_idx on public.post_comentarios (post_id, criado_em);

alter table public.posts enable row level security;
alter table public.post_reacoes enable row level security;
alter table public.post_comentarios enable row level security;

drop policy if exists "posts: ativos veem as últimas 24h" on public.posts;
create policy "posts: ativos veem as últimas 24h" on public.posts for select
  using (public.ativo_ou_treinador() and criado_em > now() - interval '24 hours');
drop policy if exists "posts: ativos postam" on public.posts;
create policy "posts: ativos postam" on public.posts for insert
  with check (public.ativo_ou_treinador() and autor_id = auth.uid());
drop policy if exists "posts: autor ou treinador apaga" on public.posts;
create policy "posts: autor ou treinador apaga" on public.posts for delete
  using (autor_id = auth.uid() or public.eh_treinador());

drop policy if exists "reacoes: ativos veem" on public.post_reacoes;
create policy "reacoes: ativos veem" on public.post_reacoes for select using (public.ativo_ou_treinador());
drop policy if exists "reacoes: a própria" on public.post_reacoes;
create policy "reacoes: a própria" on public.post_reacoes for insert with check (user_id = auth.uid() and public.ativo_ou_treinador());
drop policy if exists "reacoes: tirar a própria" on public.post_reacoes;
create policy "reacoes: tirar a própria" on public.post_reacoes for delete using (user_id = auth.uid());

drop policy if exists "pcom: ativos veem" on public.post_comentarios;
create policy "pcom: ativos veem" on public.post_comentarios for select using (public.ativo_ou_treinador());
drop policy if exists "pcom: ativos comentam" on public.post_comentarios;
create policy "pcom: ativos comentam" on public.post_comentarios for insert with check (public.ativo_ou_treinador() and autor_id = auth.uid());
drop policy if exists "pcom: autor ou treinador apaga" on public.post_comentarios;
create policy "pcom: autor ou treinador apaga" on public.post_comentarios for delete using (autor_id = auth.uid() or public.eh_treinador());

grant select, insert, delete on public.posts, public.post_reacoes, public.post_comentarios to authenticated;
grant select, insert, update, delete on public.posts, public.post_reacoes, public.post_comentarios to service_role;

-- Feed com nome do autor, reações e comentários
create or replace function public.feed_diz_ai()
returns table (id uuid, autor_nome text, autor_treinador boolean, meu boolean, tipo text, caminho text,
               legenda text, criado_em timestamptz, reacoes bigint, eu_reagi boolean, comentarios bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, coalesce(pf.nome, 'Aluno'), pf.papel = 'treinador', p.autor_id = auth.uid(), p.tipo, p.caminho,
         p.legenda, p.criado_em,
         (select count(*) from public.post_reacoes r where r.post_id = p.id),
         exists (select 1 from public.post_reacoes r where r.post_id = p.id and r.user_id = auth.uid()),
         (select count(*) from public.post_comentarios c where c.post_id = p.id)
  from public.posts p join public.perfis pf on pf.id = p.autor_id
  where public.ativo_ou_treinador() and p.criado_em > now() - interval '24 hours'
  order by p.criado_em desc;
$$;
grant execute on function public.feed_diz_ai() to authenticated;

create or replace function public.comentarios_post(p_post uuid)
returns table (id uuid, post_id uuid, texto text, criado_em timestamptz, autor_nome text, autor_treinador boolean, meu boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.post_id, c.texto, c.criado_em, coalesce(pf.nome, 'Aluno'), pf.papel = 'treinador', c.autor_id = auth.uid()
  from public.post_comentarios c join public.perfis pf on pf.id = c.autor_id
  where c.post_id = p_post and public.ativo_ou_treinador()
  order by c.criado_em;
$$;
grant execute on function public.comentarios_post(uuid) to authenticated;

-- Armazenamento das fotos e vídeos (privado; o app gera links temporários)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diz-ai', 'diz-ai', false, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "diz-ai: ativos enviam na própria pasta" on storage.objects;
create policy "diz-ai: ativos enviam na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'diz-ai' and (storage.foldername(name))[1] = auth.uid()::text and public.ativo_ou_treinador());
drop policy if exists "diz-ai: apagar os próprios" on storage.objects;
create policy "diz-ai: apagar os próprios" on storage.objects for delete to authenticated
  using (bucket_id = 'diz-ai' and (storage.foldername(name))[1] = auth.uid()::text);
