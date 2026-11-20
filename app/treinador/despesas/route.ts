import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { CATEGORIAS, lerValor } from "@/lib/despesas";

// Lançar ou apagar uma despesa (formulário simples do painel do treinador).
export async function POST(request: NextRequest) {
  const voltar = (q: string) =>
    NextResponse.redirect(new URL(`/treinador${q}#despesas`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/treinador", request.url), { status: 303 });
  if (sessao.perfil?.papel !== "treinador") return voltar("?erro=permissao");

  const form = await request.formData();
  const acao = String(form.get("acao") ?? "lancar");

  if (acao === "apagar") {
    const id = String(form.get("id") ?? "");
    const { error } = await sessao.supabase.from("despesas").delete().eq("id", id);
    if (error) {
      console.error("apagar despesa falhou", error);
      return voltar("?erro=despesa");
    }
    return voltar("?ok=despesa_apagada");
  }

  const data = String(form.get("data") ?? "");
  const categoria = String(form.get("categoria") ?? "");
  const descricao = String(form.get("descricao") ?? "").trim().slice(0, 200) || null;
  const valor = lerValor(String(form.get("valor") ?? ""));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return voltar("?erro=despesa_data");
  if (!(categoria in CATEGORIAS)) return voltar("?erro=despesa_categoria");
  if (valor === null) return voltar("?erro=despesa_valor");

  const { error } = await sessao.supabase.from("despesas").insert({ data, categoria, descricao, valor });
  if (error) {
    console.error("lançar despesa falhou", error);
    return voltar("?erro=despesa");
  }
  return voltar("?ok=despesa");
}
