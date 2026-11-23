// Tipos de treino que o aluno marca depois da corrida (base para conquistas futuras).
export const TIPOS_TREINO = [
  { id: "intervalado", nome: "Intervalado" },
  { id: "rodagem", nome: "Rodagem" },
  { id: "longao", nome: "Longão" },
  { id: "fartlek", nome: "Fartlek" },
  { id: "regenerativo", nome: "Regenerativo" },
  { id: "prova", nome: "Prova" },
] as const;
export type TipoTreino = (typeof TIPOS_TREINO)[number]["id"];
export const ehTipoTreino = (v: string): v is TipoTreino => TIPOS_TREINO.some((t) => t.id === v);
