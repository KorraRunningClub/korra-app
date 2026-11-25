import { ZONAS_VDOT, mmss } from "@/lib/zonas";

export const FASES_TREINO = {
  base: { nome: "Período de base", desc: "Construção aeróbia: volume fácil e limiar controlado." },
  especifico: { nome: "Período específico", desc: "Ritmos e estímulos próximos da prova-alvo." },
  polimento: { nome: "Polimento", desc: "Menos volume, intensidade mantida, chegar descansado." },
} as const;
export type FaseTreino = keyof typeof FASES_TREINO;
export const NIVEIS = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado", todos: "Todos os níveis" } as const;
export type Nivel = keyof typeof NIVEIS;

export const TIPOS = { rodagem: "Rodagem", regenerativo: "Regenerativo", intervalado: "Intervalado", longo: "Treino longo" } as const;
export type TipoTreino = keyof typeof TIPOS;
export const SUBTIPOS = {
  limiar_fracionado: "Limiar fracionado",
  limiar_continuo: "Limiar contínuo",
  tiros_curtos: "Tiros curtos",
  tiros_longos: "Tiros longos",
  rampa: "Repetições em rampa",
} as const;
export type Subtipo = keyof typeof SUBTIPOS;

export const UNIDADES = { km: "km", m: "m", min: "min", s: "s" } as const;
export type Unidade = keyof typeof UNIDADES;
export type Bloco = { valor: number; unidade: Unidade; zona: number };
export type Estrutura = {
  principal?: Bloco; // rodagem, regenerativo, longo
  aquecimento?: Bloco;
  strides?: Bloco | null;
  descanso_strides_s?: number | null;
  serie?: Bloco & { series: number; series_max?: number | null };
  descanso_s?: number | null;
  descanso_max_s?: number | null;
  volta_calma?: Bloco;
};
export type TreinoModelo = {
  id: string; fase: FaseTreino; nivel: Nivel; nome: string; tipo: TipoTreino; subtipo: Subtipo | null;
  estrutura: Estrutura; obs: string | null; ordem: number;
};

const n = (v: number) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const qtd = (b: Pick<Bloco, "valor" | "unidade">) => `${n(b.valor)} ${UNIDADES[b.unidade]}`;
export const zonaNome = (z: number) => `Z${z} ${ZONAS_VDOT[z - 1]?.nome ?? ""}`;
export const tempoTxt = (s: number) => (s < 60 ? `${s} s` : s % 60 === 0 ? `${s / 60} min` : mmss(s));
export const descansoTxt = (a?: number | null, b?: number | null) => (!a ? "" : b && b !== a ? `${tempoTxt(a)} a ${tempoTxt(b)}` : tempoTxt(a));
export const seriesTxt = (s: { series: number; series_max?: number | null }) => (s.series_max && s.series_max !== s.series ? `${s.series} a ${s.series_max}` : `${s.series}`);

/** Total da série principal: "28 min" / "40 a 48 min" / "4 km" */
export function totalSerie(e: Estrutura) {
  const s = e.serie;
  if (!s) return "";
  const a = s.series * s.valor, b = (s.series_max ?? s.series) * s.valor;
  const fmt = (x: number) =>
    s.unidade === "m" ? (x >= 1000 ? `${n(x / 1000)} km` : `${n(x)} m`) : s.unidade === "s" ? (x >= 60 ? `${n(x / 60)} min` : `${n(x)} s`) : `${n(x)} ${UNIDADES[s.unidade]}`;
  return a === b ? fmt(a) : `${fmt(a)} a ${fmt(b)}`;
}

/** Tempo estimado de um bloco em distância, dado o pace (seg/km): "1:35" por tiro. */
export function tempoNoPace(b: Pick<Bloco, "valor" | "unidade">, paceSeg: number) {
  const km = b.unidade === "km" ? b.valor : b.unidade === "m" ? b.valor / 1000 : null;
  return km === null ? null : mmss(km * paceSeg);
}
