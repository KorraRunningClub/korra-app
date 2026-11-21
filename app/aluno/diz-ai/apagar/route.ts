import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";

// Autor ou treinador apaga um post (e o arquivo).
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const id = String((await request.formData()).get("post_id") ?? "");
  const { data: p } = await sessao.supabase.from("posts").select("caminho").eq("id", id).maybeSingle();
  const { error } = await sessao.supabase.from("posts").delete().eq("id", id);
  if (!error && p?.caminho) await createAdmin().storage.from("diz-ai").remove([p.caminho]).catch(() => {});
  return NextResponse.redirect(new URL("/aluno/diz-ai", request.url), { status: 303 });
}
