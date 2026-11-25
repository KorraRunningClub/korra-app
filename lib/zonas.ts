// Metodologia Korrá: ritmos de treino pelo VDOT de Daniels (equações de Daniels & Gilbert).
// VO2máx estimado pelo ACSM só como informação. Velocidade crítica com dois testes.

export const TESTES = {
  t1600: { nome: "Teste da milha (1600 m)", curto: "1600 m", metros: 1600 },
  t2400: { nome: "Teste de 2400 m", curto: "2400 m", metros: 2400 },
  t3000: { nome: "Teste de 3000 m", curto: "3000 m", metros: 3000 },
  t5000: { nome: "Melhor marca nos 5 km", curto: "5 km", metros: 5000 },
} as const;
export type Teste = keyof typeof TESTES;

// Zonas em % do VDOT (Z2–Z6 = intensidades E, M, T, I, R de Daniels; Z1 = proposta Korrá)
export const ZONAS_VDOT = [
  { n: 1, nome: "Recuperação", daniels: "", min: 52, max: 59, uso: "Regenerativo, soltura" },
  { n: 2, nome: "Endurance", daniels: "E", min: 59, max: 74, uso: "Rodagem, longão" },
  { n: 3, nome: "Ritmo", daniels: "M", min: 75, max: 84, uso: "Ritmo de maratona, blocos contínuos" },
  { n: 4, nome: "Limiar", daniels: "T", min: 83, max: 88, uso: "Tempo run, intervalos de limiar" },
  { n: 5, nome: "VO2máx", daniels: "I", min: 95, max: 100, uso: "Tiros de 3 a 5 min" },
  { n: 6, nome: "Anaeróbia", daniels: "R", min: 105, max: 120, uso: "Tiros curtos, velocidade" },
] as const;

/** "4:30" ou "1:02:30" → segundos */
export function lerTempoZona(v: string): number | null {
  const p = v.trim().replace(/[hH]/g, ":").replace(/[^\d:]/g, "").split(":").filter(Boolean).map(Number);
  if (p.length < 2 || p.length > 3 || p.some((n) => !Number.isFinite(n))) return null;
  const [h, m, s] = p.length === 3 ? p : [0, ...p];
  if (m > 59 || s > 59) return null;
  const t = h * 3600 + m * 60 + s;
  return t > 0 ? t : null;
}
export const mmss = (seg: number) => {
  const t = Math.round(seg);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

// Equações de Daniels & Gilbert (v em m/min, t em min)
export const vo2DaVelocidade = (v: number) => -4.6 + 0.182258 * v + 0.000104 * v * v;
export const fracaoSustentavel = (tMin: number) => 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);
export const velocidadeDoVo2 = (vo2: number) => {
  const a = 0.000104, b = 0.182258, c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); // m/min
};
export function vdot(metros: number, tempoS: number) {
  const t = tempoS / 60;
  return vo2DaVelocidade(metros / t) / fracaoSustentavel(t);
}
/** VO2máx estimado (ACSM): D × 60 × 0,2 ÷ t + 3,5 */
export const vo2Acsm = (metros: number, tempoS: number) => (metros * 60 * 0.2) / tempoS + 3.5;

/** Previsão de tempo (s) numa distância para um VDOT (busca do tempo em que VDOT(d, t) = alvo). */
export function preverTempo(vdotAlvo: number, metros: number) {
  let lo = metros / 7, hi = metros / 1.5; // entre 7 m/s e 1,5 m/s
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    if (vdot(metros, meio) > vdotAlvo) lo = meio; else hi = meio;
  }
  return (lo + hi) / 2;
}

/** Zonas do atleta a partir de um teste: VDOT, VO2 (ACSM) e pace/velocidade de cada zona. */
export function calcularZonas(teste: Teste, tempoS: number) {
  const metros = TESTES[teste].metros;
  const v = vdot(metros, tempoS);
  const paceTeste = tempoS / (metros / 1000);
  const paceDe = (pct: number) => 60000 / velocidadeDoVo2((v * pct) / 100); // seg/km
  return {
    vdot: v,
    vo2: vo2Acsm(metros, tempoS),
    paceTeste,
    kmh: 3600 / paceTeste,
    vvo2: paceDe(100),
    zonas: ZONAS_VDOT.map((z) => {
      const lento = paceDe(z.min), rapido = paceDe(z.max);
      return { ...z, paceLento: lento, paceRapido: rapido, kmhMin: 3600 / lento, kmhMax: 3600 / rapido };
    }),
  };
}

/** Velocidade crítica com dois testes de distâncias diferentes. */
export function velocidadeCritica(a: { metros: number; tempoS: number }, b: { metros: number; tempoS: number }) {
  if (a.metros === b.metros || a.tempoS === b.tempoS) return null;
  const [c, l] = a.tempoS < b.tempoS ? [a, b] : [b, a];
  const vc = (l.metros - c.metros) / (l.tempoS - c.tempoS); // m/s
  if (!(vc > 0)) return null;
  return { vc, pace: 1000 / vc, dLinha: c.metros - vc * c.tempoS };
}
