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

// Com quem correu
export const COMPANHIAS = [
  { id: "sozinho", nome: "Sozinho" },
  { id: "dupla", nome: "Dupla" },
  { id: "grupo", nome: "Grupo" },
] as const;
export type Companhia = (typeof COMPANHIAS)[number]["id"];
export const ehCompanhia = (v: string): v is Companhia => COMPANHIAS.some((t) => t.id === v);

// Categorias do treino complementar (o aluno pode marcar mais de uma)
export const CATEGORIAS_COMPL = [
  { id: "forca", nome: "Treino de força" },
  { id: "flexibilidade", nome: "Flexibilidade" },
  { id: "pliometria", nome: "Pliometria" },
  { id: "potencia", nome: "Potência" },
] as const;
export const ehCategoriaCompl = (v: string) => CATEGORIAS_COMPL.some((c) => c.id === v);
