export const OBJETIVOS = [
  "Começar a correr",
  "Voltar a correr",
  "Correr minha primeira prova",
  "Melhorar meu tempo",
  "Correr mais longe (21 km, 42 km)",
  "Saúde e bem-estar",
  "Outro",
] as const;

/** Idade em anos completos a partir de "AAAA-MM-DD". */
export function idade(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  const [a, m, d] = dataNascimento.split("-").map(Number);
  if (!a || !m || !d) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

/** Só os dígitos; aceita 10 ou 11 dígitos (com DDD). */
export function limparTelefone(v: string): string {
  return v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
}

export function formatarTelefone(v: string | null | undefined): string {
  const t = limparTelefone(v ?? "");
  if (t.length === 11) return `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`;
  if (t.length === 10) return `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
  return v ?? "";
}
