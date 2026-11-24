export const TIPOS_AGENDA = {
  personal: { nome: "Aula de personal", cor: "ag-personal" },
  assessoria: { nome: "Treino da assessoria", cor: "ag-assessoria" },
  treino: { nome: "Meu treino", cor: "ag-treino" },
  outro: { nome: "Outro compromisso", cor: "ag-outro" },
} as const;
export type TipoAgenda = keyof typeof TIPOS_AGENDA;
export type ItemAgenda = { id: string; tipo: TipoAgenda; titulo: string; data: string; hora_inicio: string; hora_fim: string; local: string | null; obs: string | null; grupo: string | null };

export const HORA_INI = 5; // a grade vai das 5h às 23h
export const HORA_FIM = 23;
export const minutos = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const hhmm = (t: string) => t.slice(0, 5);

/** Distribui itens que se sobrepõem em colunas lado a lado. */
export function emFaixas<T extends { hora_inicio: string; hora_fim: string }>(itens: T[]) {
  const ordenados = [...itens].sort((a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio));
  const out: { item: T; faixa: number; faixas: number }[] = [];
  let grupo: { item: T; faixa: number; faixas: number }[] = [];
  let fimGrupo = -1;
  const fecha = () => { const n = Math.max(1, ...grupo.map((g) => g.faixa + 1)); grupo.forEach((g) => (g.faixas = n)); out.push(...grupo); grupo = []; };
  for (const it of ordenados) {
    const ini = minutos(it.hora_inicio), fim = minutos(it.hora_fim);
    if (grupo.length && ini >= fimGrupo) { fecha(); fimGrupo = -1; }
    const ocupadas = grupo.filter((g) => minutos(g.item.hora_fim) > ini).map((g) => g.faixa);
    let f = 0; while (ocupadas.includes(f)) f++;
    grupo.push({ item: it, faixa: f, faixas: 1 });
    fimGrupo = Math.max(fimGrupo, fim);
  }
  if (grupo.length) fecha();
  return out;
}
