import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// Aparecer ou não no ranking
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const form = await request.formData();
  const aparecer = form.get("aparecer_ranking") === "sim";
  await sessao.supabase.from("perfis").update({ aparecer_ranking: aparecer }).eq("id", sessao.user.id);
  return NextResponse.redirect(new URL("/aluno/ranking?pref=1", request.url), { status: 303 });
}
