-- Valor da mensalidade por aluno (vazio = valor padrão R$ 165; 0 = gratuito)
alter table public.perfis add column if not exists valor_mensal numeric(10,2) check (valor_mensal >= 0);

-- Aluno não pode mudar o próprio papel, status nem mensalidade
create or replace function public.proteger_campos_perfil()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.eh_treinador() then
    new.papel := old.papel;
    new.status := old.status;
    new.valor_mensal := old.valor_mensal;
  end if;
  return new;
end;
$$;
