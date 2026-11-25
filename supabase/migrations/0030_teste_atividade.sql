-- Teste pode vir de uma atividade do Strava do aluno
alter table public.testes_zonas add column if not exists atividade_id bigint;
