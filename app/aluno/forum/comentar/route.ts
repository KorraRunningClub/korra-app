import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// Comentar, responder ou apagar comentário no fórum.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const conteudoId = String(form.get("conteudo_id") ?? "");
  const ir = (q = "") => NextResponse.redirect(new URL(`/aluno/forum/${conteudoId}${q}#comentarios`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });

  if (form.get("acao") === "apagar") {
    await sessao.supabase.from("comentarios").delete().eq("id", String(form.get("id") ?? ""));
    return ir();
  }

  const texto = String(form.get("texto") ?? "").trim();
  const pai = String(form.get("pai_id") ?? "") || null;
  if (!texto) return ir("?erro=vazio");
  if (texto.length > 1000) return ir("?erro=longo");

  const { error } = await sessao.supabase.from("comentarios").insert({
    conteudo_id: conteudoId, autor_id: sessao.user.id, pai_id: pai, texto,
  });
  if (error) {
    console.error("comentar", error);
    return ir("?erro=erro");
  }
  return ir();
}
