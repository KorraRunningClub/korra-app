export const CATEGORIAS = {
  gasolina: "Gasolina",
  hidratacao: "Hidratação",
  material: "Material (banquetas e outros)",
  alimentacao: "Alimentação",
  aplicativos: "Aplicativos",
  inscricoes: "Inscrição em provas",
  brindes: "Brindes",
  outros: "Outros",
} as const;

export type Categoria = keyof typeof CATEGORIAS;

/** Aceita "45", "45,90", "45.90", "1.234,56" ou "R$ 1.234,56". */
export function lerValor(v: string): number | null {
  let s = v.replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
