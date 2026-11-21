import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const form = await request.formData();
  const post = String(form.get("post_id") ?? "");
  const voltar = NextResponse.redirect(new URL(`/aluno/diz-ai?abrir=${post}#p-${post}`, request.url), { status: 303 });
  if (form.get("acao") === "apagar") {
    await sessao.supabase.from("post_comentarios").delete().eq("id", String(form.get("id") ?? ""));
    return voltar;
  }
  const texto = String(form.get("texto") ?? "").trim().slice(0, 500);
  if (texto) await sessao.supabase.from("post_comentarios").insert({ post_id: post, autor_id: sessao.user.id, texto });
  return voltar;
}
