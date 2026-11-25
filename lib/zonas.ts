// Modelos de zona de treino da Korrá: % da velocidade do teste (100% = ritmo médio do teste).
export type Zona = { n: number; nome: string; min: number; max: number };
export const NOMES_ZONA = ["Recuperação", "Endurance", "Ritmo", "Limiar", "VO2máx", "Anaeróbia"];
const z = (faixas: [number, number][]): Zona[] => faixas.map(([min, max], i) => ({ n: i + 1, nome: NOMES_ZONA[i], min, max }));

export const TESTES = {
  t1600: { nome: "Teste da Milha (1600 m)", curto: "1600 m", metros: 1600, zonas: z([[61, 70], [70, 79], [79, 86], [86, 92], [92, 98], [98, 110]]) },
  t3000: { nome: "Teste 3000 m", curto: "3000 m", metros: 3000, zonas: z([[63, 73], [73, 82], [82, 89], [89, 95], [95, 102], [105, 120]]) },
  t5000: { nome: "Melhor tempo nos 5 km", curto: "5 km", metros: 5000, zonas: z([[65, 75], [75, 85], [85, 92], [92, 95], [98, 105], [105, 115]]) },
} as const;
export type Teste = keyof typeof TESTES;

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

/** Zonas do atleta: pace (seg/km) e velocidade (km/h) de cada faixa. */
export function calcularZonas(teste: Teste, tempoS: number) {
  const t = TESTES[teste];
  const paceTeste = tempoS / (t.metros / 1000); // seg por km
  const kmh = 3600 / paceTeste;
  return {
    paceTeste, kmh,
    zonas: t.zonas.map((zona) => ({
      ...zona,
      paceLento: paceTeste / (zona.min / 100), // % menor = mais devagar
      paceRapido: paceTeste / (zona.max / 100),
      kmhMin: kmh * (zona.min / 100),
      kmhMax: kmh * (zona.max / 100),
    })),
  };
}
