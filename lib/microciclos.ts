// Microciclos da Metodologia Korrá: quantos treinos de qualidade cada semana pode ter.
export const MICROCICLOS = {
  desenvolvimento: { nome: "Desenvolvimento", curto: "D", qMin: 3, qMax: 3, intervaloDias: 2, regra: "3 treinos de qualidade, com no mínimo 48 h entre uma sessão e outra." },
  choque: { nome: "Choque", curto: "C", qMin: 3, qMax: 3, intervaloDias: 2, regra: "Como o desenvolvimento (3 sessões, 48 h entre elas), mas 1 a 2 sessões com mais intensidade ou volume." },
  teste: { nome: "Teste", curto: "T", qMin: 1, qMax: 2, intervaloDias: 5, regra: "1 a 2 sessões de teste (apronto), com pelo menos 4 dias de treino fácil ou off entre elas." },
  manutencao: { nome: "Manutenção", curto: "M", qMin: 1, qMax: 2, intervaloDias: 2, regra: "1 a 2 sessões de qualidade, com menor volume." },
  competitivo: { nome: "Competitivo", curto: "P", qMin: 1, qMax: 1, intervaloDias: 2, regra: "1 sessão de qualidade, sem contar a prova." },
  regenerativo: { nome: "Regenerativo", curto: "R", qMin: 0, qMax: 0, intervaloDias: 0, regra: "Nenhum treino de qualidade: só treinos fáceis." },
} as const;
export type Microciclo = keyof typeof MICROCICLOS;
export const ehMicro = (v: string): v is Microciclo => v in MICROCICLOS;

// O que conta como treino de qualidade (marcado pelo aluno em "Minhas últimas atividades"). Prova não conta.
export const TIPOS_QUALIDADE = ["intervalado", "fartlek", "teste"] as const;
export type SessaoQualidade = { data: string };

const dif = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);

/** Confere a semana: quantas sessões de qualidade e se o intervalo mínimo foi respeitado. */
export function conferirSemana(micro: Microciclo, sessoes: SessaoQualidade[], ini: string, fim: string) {
  const m = MICROCICLOS[micro];
  const dias = [...new Set(sessoes.map((s) => s.data).filter((d) => d >= ini && d <= fim))].sort();
  let pertoDemais = false;
  for (let i = 1; i < dias.length; i++) if (m.intervaloDias && dif(dias[i], dias[i - 1]) < m.intervaloDias) pertoDemais = true;
  const feitas = dias.length;
  const acima = feitas > m.qMax;
  return { feitas, meta: m.qMin === m.qMax ? `${m.qMax}` : `${m.qMin} a ${m.qMax}`, acima, pertoDemais };
}
