// Conquistas da Korrá. Para criar uma nova, é só adicionar aqui (e dizer como conta).
export type Nivel = "bronze" | "prata" | "ouro" | "platina" | "diamante" | "especial";
// "conta" diz o que é contado; "regra" é o texto mostrado; "simbolo" troca o número da medalha por um ícone.
export type Conquista = { id: string; categoria: string; nome: string; meta: number; unidade: string; nivel: Nivel; conta?: string; regra?: string; simbolo?: "aviao"; figura?: "coyote" | "papa" | "viajante" | "influencer" };

export const CATEGORIAS_CONQUISTA: Record<string, { nome: string; descricao: string }> = {
  corrida: { nome: "Corrida", descricao: "Contam as corridas que chegam do Strava, pelo horário de início." },
  complementares: { nome: "Trabalhos complementares", descricao: "Contam os treinos complementares (musculação, yoga, pilates etc.) que chegam do Strava, pelas categorias marcadas em \"Minhas últimas atividades\". Musculação conta sozinha como força; yoga e pilates contam como flexibilidade." },
  provas: { nome: "Provas", descricao: "Contam as provas concluídas na área de Provas (com o tempo oficial lançado). Para O Viajante, vale o estado da prova comparado com o estado onde você mora (dá para ajustar na área de Provas)." },
  comunidade: { nome: "Comunidade", descricao: "Cada post no Diz Aí vale 10 pontos (conta 1 post por dia). Os pontos ficam guardados mesmo depois que o post some." },
};

export const CONQUISTAS: Conquista[] = [
  // Corrida: horário de início (30 corridas em cada faixa)
  { id: "h-madruga", categoria: "corrida", nome: "Seu Madruga", meta: 30, unidade: "corridas", nivel: "ouro", conta: "h_madruga", regra: "30 corridas entre 4h e 7h59" },
  { id: "h-manha", categoria: "corrida", nome: "Na hora que deu", meta: 30, unidade: "corridas", nivel: "bronze", conta: "h_manha", regra: "30 corridas entre 8h e 11h59" },
  { id: "h-tarde", categoria: "corrida", nome: "Sunset run", meta: 30, unidade: "corridas", nivel: "especial", conta: "h_tarde", regra: "30 corridas entre 12h e 17h59" },
  { id: "h-lua", categoria: "corrida", nome: "Correndo com a lua", meta: 30, unidade: "corridas", nivel: "prata", conta: "h_lua", regra: "30 corridas entre 18h e 20h59" },
  { id: "h-coruja", categoria: "corrida", nome: "Coruja", meta: 30, unidade: "corridas", nivel: "diamante", conta: "h_coruja", regra: "30 corridas entre 21h e 3h59" },
  // Trabalhos complementares
  { id: "c-bomdia", categoria: "complementares", nome: "Bom dia, academia", meta: 30, unidade: "treinos", nivel: "bronze", conta: "c_manha", regra: "30 treinos complementares de manhã (4h a 11h59)" },
  { id: "c-flex", categoria: "complementares", nome: "Flexível que só", meta: 35, unidade: "treinos", nivel: "platina", conta: "c_flexibilidade", regra: "35 treinos de flexibilidade" },
  { id: "c-plio-30", categoria: "complementares", nome: "Tendão de Mola", meta: 30, unidade: "treinos", nivel: "prata", conta: "c_pliometria", regra: "30 treinos de pliometria" },
  { id: "c-plio-50", categoria: "complementares", nome: "Saltador nato", meta: 50, unidade: "treinos", nivel: "ouro", conta: "c_pliometria", regra: "50 treinos de pliometria" },
  { id: "c-pot-25", categoria: "complementares", nome: "Forte e Veloz", meta: 25, unidade: "treinos", nivel: "especial", conta: "c_potencia", regra: "25 treinos de potência" },
  { id: "c-forca-25", categoria: "complementares", nome: "Chicken Run", meta: 25, unidade: "treinos", nivel: "bronze", conta: "c_forca", regra: "25 treinos de força" },
  { id: "c-forca-50", categoria: "complementares", nome: "Quem te viu, quem te vê", meta: 50, unidade: "treinos", nivel: "prata", conta: "c_forca", regra: "50 treinos de força" },
  { id: "c-forca-100", categoria: "complementares", nome: "Tá firme, né, corredor?", meta: 100, unidade: "treinos", nivel: "ouro", conta: "c_forca", regra: "100 treinos de força" },
  { id: "provas-5", categoria: "provas", nome: "Coyote", meta: 5, unidade: "provas", nivel: "bronze", figura: "coyote" },
  { id: "provas-10", categoria: "provas", nome: "Papa Léguas", meta: 10, unidade: "provas", nivel: "prata", figura: "papa" },
  { id: "provas-25", categoria: "provas", nome: "Meia e mais um pouco", meta: 25, unidade: "provas", nivel: "ouro" },
  { id: "provas-40", categoria: "provas", nome: "Galgo", meta: 40, unidade: "provas", nivel: "platina" },
  { id: "provas-50", categoria: "provas", nome: "A vida começa depois dos 50", meta: 50, unidade: "provas", nivel: "diamante" },
  { id: "influencer", categoria: "comunidade", nome: "Influencer da turma", meta: 500, unidade: "pontos", nivel: "ouro", conta: "pontos_diz_ai", regra: "500 pontos no Diz Aí (50 dias postando)", figura: "influencer" },
  { id: "viajante", categoria: "provas", nome: "O Viajante", meta: 1, unidade: "prova", nivel: "especial", conta: "provas_fora", regra: "1 prova fora do seu estado", figura: "viajante" },
];

/** Faixa de horário da corrida para as conquistas (hora local de início). */
export function faixaHorario(inicioLocal: string) {
  const h = Number(inicioLocal.slice(11, 13));
  if (h >= 4 && h < 8) return "h_madruga";
  if (h >= 8 && h < 12) return "h_manha";
  if (h >= 12 && h < 18) return "h_tarde";
  if (h >= 18 && h < 21) return "h_lua";
  return "h_coruja";
}

export const CORES_NIVEL: Record<Nivel, { a: string; b: string; fita: string; nome: string }> = {
  bronze: { a: "#E3A06B", b: "#A8612F", fita: "#E9E8D6", nome: "Bronze" },
  prata: { a: "#E4E6E8", b: "#9DA3A8", fita: "#E9E8D6", nome: "Prata" },
  ouro: { a: "#FED261", b: "#C9961C", fita: "#E9E8D6", nome: "Ouro" },
  platina: { a: "#D9F0EC", b: "#7FB3AA", fita: "#E9E8D6", nome: "Platina" },
  diamante: { a: "#CFE3FF", b: "#5B86C9", fita: "#E9E8D6", nome: "Diamante" },
  especial: { a: "#FFB38A", b: "#E8622C", fita: "#E9E8D6", nome: "Especial" },
};
