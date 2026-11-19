-- Libera o acesso das tabelas pela API do Supabase (as regras de RLS continuam valendo).
grant usage on schema public to anon, authenticated;
grant select, update on public.perfis to authenticated;
grant select on public.planos to anon, authenticated;
grant insert, update, delete on public.planos to authenticated;
grant select, insert, update, delete on public.pagamentos to authenticated;
grant select, insert, update, delete on public.despesas to authenticated;
grant execute on function public.eh_treinador() to authenticated;
