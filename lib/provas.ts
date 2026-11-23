// Área de provas
export const DISTANCIAS: Record<string, { nome: string; km: number | null }> = {
  "5k": { nome: "5 km", km: 5 },
  "10k": { nome: "10 km", km: 10 },
  "15k": { nome: "15 km", km: 15 },
  "21k": { nome: "Meia maratona (21 km)", km: 21.0975 },
  "42k": { nome: "Maratona (42 km)", km: 42.195 },
  trail: { nome: "Trail", km: null },
  outra: { nome: "Outra distância", km: null },
};
export const CATEGORIAS_PROVA = { alvo: "Prova-alvo", secundaria: "Prova secundária" } as const;
export type CategoriaProva = keyof typeof CATEGORIAS_PROVA;

export type Prova = { id: string; nome: string; data: string; distancia: string; distancia_km: number | null; cidade: string | null; link: string | null; uf?: string | null; criado_por?: string | null };

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
export const nomeUF = (uf: string | null | undefined) => (uf === "EX" ? "Exterior" : uf ?? "");
export const ufValida = (v: string) => v === "EX" || UFS.includes(v);

export const kmDaProva = (p: Pick<Prova, "distancia" | "distancia_km">) =>
  p.distancia_km ? Number(p.distancia_km) : DISTANCIAS[p.distancia]?.km ?? null;
export const nomeDistancia = (p: Pick<Prova, "distancia" | "distancia_km">) =>
  (p.distancia === "trail" || p.distancia === "outra") && p.distancia_km
    ? `${p.distancia === "trail" ? "Trail " : ""}${Number(p.distancia_km).toLocaleString("pt-BR")} km`
    : DISTANCIAS[p.distancia]?.nome ?? p.distancia;

/** Dias inteiros entre hoje (fuso de SP) e a data. */
export function diasAte(dataISO: string, hojeISO: string) {
  return Math.round((Date.parse(`${dataISO}T12:00:00Z`) - Date.parse(`${hojeISO}T12:00:00Z`)) / 86400000);
}

/** "1:45:30" ou "45:30" → segundos */
export function lerTempo(v: string): number | null {
  const partes = v.trim().replace(/[hH]/g, ":").replace(/[^\d:]/g, "").split(":").filter(Boolean).map(Number);
  if (partes.length < 2 || partes.length > 3 || partes.some((n) => !Number.isFinite(n))) return null;
  const [h, m, s] = partes.length === 3 ? partes : [0, ...partes];
  if (m > 59 || s > 59) return null;
  const t = h * 3600 + m * 60 + s;
  return t > 0 ? t : null;
}
export function tempoBR(seg: number) {
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
