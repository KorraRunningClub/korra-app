-- Corrige a proteção do perfil: ela só deve valer para usuários logados pelo app.
-- No SQL Editor do Supabase (sem usuário logado), as alterações passam normalmente.
create or replace function public.proteger_campos_perfil()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.eh_treinador() then
    new.papel := old.papel;
    new.status := old.status;
  end if;
  return new;
end;
$$;
