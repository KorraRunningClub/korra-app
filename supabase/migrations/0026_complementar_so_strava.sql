-- Ranking Força / compl.: só treinos vindos do Strava (automático).
create or replace function public.ranking_complementar(p_inicio date, p_fim date)
returns table (user_id uuid, nome text, valor bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.perfis where id = auth.uid() and (status = 'ativo' or papel = 'treinador')) then
    return;
  end if;
  return query
    select e.user_id, p.nome, count(distinct e.data)
    from public.treinos_extras e join public.perfis p on p.id = e.user_id
    where p.status = 'ativo' and p.aparecer_ranking
      and e.strava_id is not null
      and e.tipo in ('forca', 'mobilidade', 'outro')
      and e.data >= p_inicio and e.data < p_fim
    group by e.user_id, p.nome
    order by 3 desc limit 50;
end;
$$;
