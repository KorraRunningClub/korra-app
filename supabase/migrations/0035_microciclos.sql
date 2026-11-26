-- Microciclo de cada semana do ciclo da prova-alvo (desenvolvimento, choque, teste, manutenção, competitivo, regenerativo).
alter table public.prova_inscricoes add column if not exists ciclo_micros jsonb not null default '{}'::jsonb;

create or replace function public.proteger_ciclo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.eh_treinador() then
    new.ciclo_semanas := old.ciclo_semanas;
    new.ciclo_inicio := old.ciclo_inicio;
    new.ciclo_meta := old.ciclo_meta;
    new.ciclo_ajustes := old.ciclo_ajustes;
    new.ciclo_micros := old.ciclo_micros;
  end if;
  return new;
end;
$$;
