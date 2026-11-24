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
