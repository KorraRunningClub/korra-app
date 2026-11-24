import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeSP } from "@/lib/semana";

export const PLANOS = {
  mensal: { nome: "Mensal", meses: 1 },
  trimestral: { nome: "Trimestral", meses: 3 },
  semestral: { nome: "Semestral", meses: 6 },
  anual: { nome: "Anual", meses: 12 },
  avulso: { nome: "Avulso", meses: 0 },
} as const;
export type Plano = keyof typeof PLANOS;
export const SITUACOES = { ativo: "Ativo", pausado: "Pausado", cancelado: "Cancelado" } as const;
export type Situacao = keyof typeof SITUACOES;

export type AlunoPersonal = {
  id: string; nome: string; telefone: string | null; plano: Plano; valor: number; inicio: string; fim: string;
  pago: boolean; pago_em: string | null; situacao: Situacao; obs: string | null;
};

/** Soma meses mantendo o dia (31/01 + 1 mês = 28/02). */
export function somarMeses(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m - 1 + n, Math.min(d, ultimo))).toISOString().slice(0, 10);
}
export const fimDoPlano = (inicio: string, plano: Plano) => somarMeses(inicio, PLANOS[plano].meses);
export const diasPara = (iso: string, hoje = hojeSP()) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86400000);

/** Cria avisos de planos que vencem amanhã (ou hoje / já venceram e não foram renovados). Sem duplicar. */
export async function gerarAvisos(db: SupabaseClient, dono: string) {
  const hoje = hojeSP();
  const amanha = new Date(Date.parse(`${hoje}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const { data } = await db.from("personal_alunos").select("id, nome, plano, fim, valor").eq("situacao", "ativo").lte("fim", amanha);
  const linhas = (data ?? []).map((a) => {
    const d = diasPara(a.fim as string, hoje);
    const quando = d === 1 ? "vence amanhã" : d === 0 ? "vence hoje" : `venceu há ${-d} dia${d === -1 ? "" : "s"}`;
    return {
      dono,
      chave: `vence:${a.id}:${a.fim}${d < 0 ? ":vencido" : ""}`,
      titulo: `Plano de ${a.nome} ${quando}`,
      texto: `${PLANOS[a.plano as Plano]?.nome ?? a.plano} · ${Number(a.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · fim em ${String(a.fim).split("-").reverse().join("/")}. Hora de renovar ou conversar com o aluno.`,
      link: `/treinador/agenda#financeiro`,
    };
  });
  if (linhas.length) await db.from("notificacoes").upsert(linhas, { onConflict: "dono,chave", ignoreDuplicates: true });
}
