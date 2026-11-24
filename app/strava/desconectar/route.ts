import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const admin = createAdmin();
  const { data: c } = await admin.from("strava_conexoes").select("access_token").eq("user_id", sessao.user.id).single();
  if (c) {
    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${c.access_token}` },
    }).catch(() => {});
  }
  await admin.from("strava_conexoes").delete().eq("user_id", sessao.user.id);
  await admin.from("atividades").delete().eq("user_id", sessao.user.id).eq("fonte", "strava");
  await admin.from("treinos_extras").delete().eq("user_id", sessao.user.id).not("strava_id", "is", null);
  await admin.from("sequencias_semestre").delete().eq("user_id", sessao.user.id);
  return NextResponse.redirect(new URL("/aluno/ranking?desconectado=1", request.url), { status: 303 });
}
