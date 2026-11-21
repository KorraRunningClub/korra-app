import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// Liga/desliga o 🔥 de um post
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const form = await request.formData();
  const post = String(form.get("post_id") ?? "");
  if (form.get("ja") === "1") {
    await sessao.supabase.from("post_reacoes").delete().eq("post_id", post).eq("user_id", sessao.user.id);
  } else {
    await sessao.supabase.from("post_reacoes").insert({ post_id: post, user_id: sessao.user.id });
  }
  return NextResponse.redirect(new URL(`/aluno/diz-ai#p-${post}`, request.url), { status: 303 });
}
