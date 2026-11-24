import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { lerAjustes } from "@/lib/ciclo";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador/ciclos${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase;
  const id = String(form.get("id") ?? "");
  try {
    if (form.get("acao") === "remover") {
      const { error } = await db.from("prova_inscricoes").update({ ciclo_semanas: null, ciclo_meta: null, ciclo_inicio: null, ciclo_ajustes: {} }).eq("id", id);
      if (error) throw error;
      return ir("?ok=removido");
    }
    const semanas = parseInt(String(form.get("semanas") ?? ""), 10);
    const meta = parseInt(String(form.get("meta") ?? ""), 10);
    if (!(semanas >= 1 && semanas <= 52) || !(meta >= 1 && meta <= 14)) return ir("?erro=dados");
    const inicio = String(form.get("inicio") ?? "");
    const { error } = await db.from("prova_inscricoes").update({
      ciclo_semanas: semanas,
      ciclo_meta: meta,
      ciclo_inicio: /^\d{4}-\d{2}-\d{2}$/.test(inicio) ? inicio : null,
      ciclo_ajustes: lerAjustes(String(form.get("ajustes") ?? "")),
    }).eq("id", id);
    if (error) throw error;
    return ir("?ok=salvo");
  } catch (e) {
    console.error("ciclo", e);
    return ir("?erro=salvar");
  }
}
