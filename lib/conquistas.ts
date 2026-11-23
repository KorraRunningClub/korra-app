// Conquistas da Korrá. Para criar uma nova, é só adicionar aqui (e dizer como conta).
export type Nivel = "bronze" | "prata" | "ouro" | "platina" | "diamante" | "especial";
// "conta" diz o que é contado; "regra" é o texto mostrado; "simbolo" troca o número da medalha por um ícone.
export type Conquista = { id: string; categoria: string; nome: string; meta: number; unidade: string; nivel: Nivel; conta?: string; regra?: string; simbolo?: "aviao" };

export const CATEGORIAS_CONQUISTA: Record<string, { nome: string; descricao: string }> = {
  provas: { nome: "Provas", descricao: "Contam as provas concluídas na área de Provas (com o tempo oficial lançado). Para O Viajante, vale o estado da prova comparado com o estado onde você mora (dá para ajustar na área de Provas)." },
};

export const CONQUISTAS: Conquista[] = [
  { id: "provas-5", categoria: "provas", nome: "Coyote", meta: 5, unidade: "provas", nivel: "bronze" },
  { id: "provas-10", categoria: "provas", nome: "Papa Léguas", meta: 10, unidade: "provas", nivel: "prata" },
  { id: "provas-25", categoria: "provas", nome: "Meia e mais um pouco", meta: 25, unidade: "provas", nivel: "ouro" },
  { id: "provas-40", categoria: "provas", nome: "Galgo", meta: 40, unidade: "provas", nivel: "platina" },
  { id: "provas-50", categoria: "provas", nome: "A vida começa depois dos 50", meta: 50, unidade: "provas", nivel: "diamante" },
  { id: "viajante", categoria: "provas", nome: "O Viajante", meta: 1, unidade: "prova", nivel: "especial", conta: "provas_fora", regra: "1 prova fora do seu estado", simbolo: "aviao" },
];

export const CORES_NIVEL: Record<Nivel, { a: string; b: string; fita: string; nome: string }> = {
  bronze: { a: "#E3A06B", b: "#A8612F", fita: "#E9E8D6", nome: "Bronze" },
  prata: { a: "#E4E6E8", b: "#9DA3A8", fita: "#E9E8D6", nome: "Prata" },
  ouro: { a: "#FED261", b: "#C9961C", fita: "#E9E8D6", nome: "Ouro" },
  platina: { a: "#D9F0EC", b: "#7FB3AA", fita: "#E9E8D6", nome: "Platina" },
  diamante: { a: "#CFE3FF", b: "#5B86C9", fita: "#E9E8D6", nome: "Diamante" },
  especial: { a: "#FFB38A", b: "#E8622C", fita: "#E9E8D6", nome: "Especial" },
};
