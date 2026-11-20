import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { stravaConfigurado, urlAutorizacao } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(`${origin}/entrar?voltar=/aluno/ranking`);
  if (!stravaConfigurado()) return NextResponse.redirect(`${origin}/aluno/ranking?erro=config`);

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(urlAutorizacao(origin, state));
  res.cookies.set("strava_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
