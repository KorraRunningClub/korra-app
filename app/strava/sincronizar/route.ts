import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { importarRecentes } from "@/lib/strava";
import { recalcularSemestreSeguro } from "@/lib/semestral";

export async function POST(request: NextRequest) {
  const ir = (q: string) => NextResponse.redirect(new URL(`/aluno/ranking${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/aluno/ranking", request.url), { status: 303 });
  try {
    const admin = createAdmin();
    const n = await importarRecentes(admin, sessao.user.id, 35);
    await recalcularSemestreSeguro(admin, sessao.user.id);
    return ir(`?sincronizado=${n}`);
  } catch (e) {
    console.error("strava sincronizar", e);
    return ir("?erro=sincronizar");
  }
}
