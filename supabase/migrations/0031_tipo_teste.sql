-- Tipo de treino "teste" (o aluno marca; o treinador recebe aviso e registra o teste)
alter table public.treino_marcacoes drop constraint if exists treino_marcacoes_tipo_check;
alter table public.treino_marcacoes add constraint treino_marcacoes_tipo_check
  check (tipo in ('intervalado', 'rodagem', 'longao', 'fartlek', 'regenerativo', 'prova', 'teste'));
