-- Metodologia VDOT: entra o teste de 2400 m.
alter table public.testes_zonas drop constraint if exists testes_zonas_teste_check;
alter table public.testes_zonas add constraint testes_zonas_teste_check check (teste in ('t1600', 't2400', 't3000', 't5000'));
