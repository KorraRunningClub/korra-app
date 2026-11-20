import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { importarRecentes, trocarCodigo } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ir = (q: string) => NextResponse.redirect(`${url.origin}/aluno/ranking${q}`);
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(`${url.origin}/entrar?voltar=/aluno/ranking`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") ?? "";
  if (url.searchParams.get("error") || !code) return ir("?erro=negado");
  if (!state || state !== request.cookies.get("strava_state")?.value) return ir("?erro=state");
  if (!scope.includes("activity:read")) return ir("?erro=escopo");

  try {
    const t = await trocarCodigo(code);
    const admin = createAdmin();
    // Se esse atleta do Strava estava ligado a outra conta, libera.
    await admin.from("strava_conexoes").delete().eq("athlete_id", t.athlete!.id).neq("user_id", sessao.user.id);
    const { error } = await admin.from("strava_conexoes").upsert({
      user_id: sessao.user.id,
      athlete_id: t.athlete!.id,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: t.expires_at,
      scope,
    });
    if (error) throw error;
    const n = await importarRecentes(admin, sessao.user.id);
    const res = ir(`?conectado=${n}`);
    res.cookies.delete("strava_state");
    return res;
  } catch (e) {
    console.error("strava callback", e);
    return ir("?erro=conexao");
  }
}
