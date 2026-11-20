-- O servidor (chave secreta) precisa de acesso explícito às tabelas do Strava.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.strava_conexoes to service_role;
grant select, insert, update, delete on public.atividades to service_role;
grant select on public.perfis to service_role;
