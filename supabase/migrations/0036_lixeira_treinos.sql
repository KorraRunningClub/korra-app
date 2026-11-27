-- Lixeira da biblioteca de treinos: "Remover" só marca a data; dá para restaurar ou apagar de vez.
alter table public.treinos_modelo add column if not exists apagado_em timestamptz;
