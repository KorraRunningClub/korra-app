import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { lerValor } from "@/lib/despesas";
import { hojeSP } from "@/lib/semana";
import { PLANOS, SITUACOES, fimDoPlano, type Plano } from "@/lib/personal";

const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const dataOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const semana = txt(form.get("semana"), 10);
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador/agenda?semana=${semana}${q}#financeiro`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase;
  const acao = txt(form.get("acao"), 20);
  const id = txt(form.get("id"), 40);
  try {
    if (acao === "criar" || acao === "editar") {
      const nome = txt(form.get("nome"), 100);
      const plano = txt(form.get("plano"), 20) as Plano;
      const valor = lerValor(txt(form.get("valor"), 20)) ?? (txt(form.get("valor"), 20) === "0" ? 0 : null);
      const inicio = txt(form.get("inicio"), 10);
      let fim = txt(form.get("fim"), 10);
      if (nome.length < 2 || !(plano in PLANOS) || valor === null || !dataOk(inicio)) return ir("&erro=personal");
      if (!dataOk(fim) || fim < inicio || form.get("fim_auto") === "1") fim = fimDoPlano(inicio, plano);
      const pagoEm = txt(form.get("pago_em"), 10);
      const linha = {
        nome, plano, valor, inicio, fim,
        telefone: txt(form.get("telefone"), 20) || null,
        obs: txt(form.get("obs"), 500) || null,
        pago: form.get("pago") === "1",
        pago_em: form.get("pago") === "1" ? (dataOk(pagoEm) ? pagoEm : hojeSP()) : null,
        situacao: (txt(form.get("situacao"), 20) in SITUACOES ? txt(form.get("situacao"), 20) : "ativo"),
      };
      const { error } = acao === "editar" ? await db.from("personal_alunos").update(linha).eq("id", id) : await db.from("personal_alunos").insert(linha);
      if (error) throw error;
      return ir(`&ok=${acao === "editar" ? "personal_salvo" : "personal_criado"}`);
    }
    if (acao === "pago") {
      const pago = form.get("pago") === "1";
      const { error } = await db.from("personal_alunos").update({ pago, pago_em: pago ? hojeSP() : null }).eq("id", id);
      if (error) throw error;
      return ir(`&ok=${pago ? "personal_pago" : "personal_salvo"}`);
    }
    if (acao === "situacao") {
      const situacao = txt(form.get("situacao"), 20);
      if (!(situacao in SITUACOES)) return ir("&erro=personal");
      const { error } = await db.from("personal_alunos").update({ situacao }).eq("id", id);
      if (error) throw error;
      return ir("&ok=personal_salvo");
    }
    if (acao === "renovar") {
      const { data: a } = await db.from("personal_alunos").select("*").eq("id", id).single();
      if (!a) return ir("&erro=personal");
      await db.from("personal_historico").insert({ aluno_id: a.id, plano: a.plano, valor: a.valor, inicio: a.inicio, fim: a.fim, pago: a.pago, pago_em: a.pago_em });
      const inicio = a.fim as string;
      const { error } = await db.from("personal_alunos")
        .update({ inicio, fim: fimDoPlano(inicio, a.plano as Plano), pago: false, pago_em: null, situacao: "ativo" }).eq("id", id);
      if (error) throw error;
      return ir("&ok=personal_renovado");
    }
    if (acao === "apagar") {
      const { error } = await db.from("personal_alunos").delete().eq("id", id);
      if (error) throw error;
      return ir("&ok=personal_apagado");
    }
  } catch (e) {
    console.error("personal", e);
    const codigo = (e as { code?: string })?.code ?? "";
    return ir(codigo === "42P01" || codigo === "PGRST205" ? "&erro=tabela" : "&erro=salvar");
  }
  return ir("");
}
