// Calendário da assessoria
export const TIPOS_EVENTO = {
  coletivo: { nome: "Treino coletivo", cor: "ev-coletivo" },
  presencial: { nome: "Treino presencial", cor: "ev-presencial" },
  prova: { nome: "Prova oficial", cor: "ev-prova" },
  encontro: { nome: "Encontro / evento", cor: "ev-encontro" },
  aviso: { nome: "Aviso", cor: "ev-aviso" },
} as const;
export type TipoEvento = keyof typeof TIPOS_EVENTO;

export type Evento = {
  id: string; tipo: TipoEvento; titulo: string; data: string; hora_inicio: string | null; hora_fim: string | null;
  local_nome: string | null; endereco: string | null; descricao: string | null; prova_id: string | null; grupo: string | null;
};

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export const hora = (t: string | null) => (t ? t.slice(0, 5).replace(":", "h") : "");
export const horario = (e: Pick<Evento, "hora_inicio" | "hora_fim">) =>
  e.hora_inicio ? `${hora(e.hora_inicio)}${e.hora_fim ? ` às ${hora(e.hora_fim)}` : ""}` : "";

export function linkMaps(e: Pick<Evento, "endereco" | "local_nome">) {
  const q = e.endereco || e.local_nome;
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}
export function mapaEmbed(e: Pick<Evento, "endereco" | "local_nome">) {
  const q = e.endereco || e.local_nome;
  return q ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed` : null;
}

export function somarDias(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Semanas (segunda a domingo) que cobrem o mês "AAAA-MM". */
export function gradeDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const primeiro = `${mes}-01`;
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  const dow = (iso: string) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = segunda
  const inicio = somarDias(primeiro, -dow(primeiro));
  const fim = somarDias(ultimo, 6 - dow(ultimo));
  const dias: string[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  return { inicio, fim, dias, primeiro, ultimo };
}
export const mesVizinho = (mes: string, n: number) => {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

// Fases do treinamento (períodos coloridos)
export const CORES_FASE: Record<string, { nome: string; hex: string }> = {
  vermelho: { nome: "Vermelho", hex: "#D64541" },
  laranja: { nome: "Laranja", hex: "#E8622C" },
  amarelo: { nome: "Amarelo", hex: "#E0A100" },
  verde: { nome: "Verde", hex: "#4E8A4A" },
  azul: { nome: "Azul", hex: "#3E6FB0" },
  roxo: { nome: "Roxo", hex: "#7B57A6" },
  cinza: { nome: "Cinza", hex: "#8A8B7E" },
};
export const FASES_SUGERIDAS: { nome: string; cor: string }[] = [
  { nome: "Período de base", cor: "verde" },
  { nome: "Período específico", cor: "laranja" },
  { nome: "Período competitivo", cor: "vermelho" },
  { nome: "Polimento", cor: "azul" },
  { nome: "Transição / recuperação", cor: "cinza" },
];
export type Fase = { id: string; nome: string; descricao: string | null; inicio: string; fim: string; cor: string };
