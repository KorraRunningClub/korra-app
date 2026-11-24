import { somarDias } from "@/lib/calendario";

// Ciclo da prova-alvo: semanas de 7 dias contadas a partir do início, terminando no dia da prova.
export const TIPOS_EXTRA = { forca: "Força / academia", mobilidade: "Mobilidade / alongamento", corrida: "Corrida fora do Strava", outro: "Outro" } as const;

export type ConfigCiclo = { semanas: number; inicio: string | null; meta: number; ajustes: Record<string, number> | null; dataProva: string };

const dif = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);

/** Início padrão: N semanas antes da prova (a semana N termina no dia da prova). */
export const inicioPadrao = (dataProva: string, semanas: number) => somarDias(dataProva, -(semanas * 7) + 1);

/** Lê "11:3, 12:3" → { "11": 3, "12": 3 } */
export function lerAjustes(txt: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const parte of txt.split(/[,;\s]+/)) {
    const m = parte.match(/^(\d{1,2})[:=](\d{1,2})$/);
    if (m) out[String(Number(m[1]))] = Math.min(14, Math.max(0, Number(m[2])));
  }
  return out;
}
export const ajustesTexto = (a: Record<string, number> | null) =>
  Object.entries(a ?? {}).sort((x, y) => Number(x[0]) - Number(y[0])).map(([k, v]) => `${k}:${v}`).join(", ");

/**
 * datasTreinos: um item por treino feito (data AAAA-MM-DD), corridas + extras.
 * Aderência = soma de min(feitos, meta) / soma das metas, só nas semanas já fechadas.
 */
export function calcularCiclo(c: ConfigCiclo, datasTreinos: string[], hoje: string) {
  const inicio = c.inicio ?? inicioPadrao(c.dataProva, c.semanas);
  const totalDias = dif(c.dataProva, inicio) + 1;
  const passados = Math.min(totalDias, Math.max(0, dif(hoje, inicio) + 1));
  const faltam = Math.max(0, dif(c.dataProva, hoje));
  const nSemanas = Math.ceil(totalDias / 7);
  const semanas = Array.from({ length: nSemanas }, (_, i) => {
    const ini = somarDias(inicio, i * 7);
    const fim = i === nSemanas - 1 ? c.dataProva : somarDias(ini, 6);
    const meta = c.ajustes?.[String(i + 1)] ?? c.meta;
    const feitos = datasTreinos.filter((d) => d >= ini && d <= fim).length;
    const estado = hoje > fim ? "fechada" : hoje >= ini ? "atual" : "futura";
    return { n: i + 1, ini, fim, meta, feitos, estado } as const;
  });
  const fechadas = semanas.filter((s) => s.estado === "fechada" && s.meta > 0);
  const metaFechadas = fechadas.reduce((t, s) => t + s.meta, 0);
  const cumpridos = fechadas.reduce((t, s) => t + Math.min(s.feitos, s.meta), 0);
  const aderencia = metaFechadas ? Math.round((cumpridos / metaFechadas) * 100) : null;
  const atual = semanas.find((s) => s.estado === "atual") ?? null;
  const comecou = hoje >= inicio;
  return { inicio, totalDias, passados, faltam, semanas, atual, aderencia, comecou, pctDias: Math.round((passados / totalDias) * 100) };
}

export const corAderencia = (p: number | null) => (p === null ? "neutra" : p >= 85 ? "otima" : p >= 65 ? "boa" : "baixa");
