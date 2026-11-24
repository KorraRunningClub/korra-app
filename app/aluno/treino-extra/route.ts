import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { hojeSP } from "@/lib/semana";
import { TIPOS_EXTRA } from "@/lib/ciclo";

// Marcar / desfazer treino de força ou complementar (usado no ranking).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ir = (q: string) => NextResponse.redirect(new URL(`/aluno/ranking${q}#complementar`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/aluno/ranking", request.url), { status: 303 });
  const { supabase: db, user } = sessao;
  if (form.get("acao") === "apagar") {
    await db.from("treinos_extras").delete().eq("id", String(form.get("id") ?? "")).eq("user_id", user.id);
    return ir("?extra=apagado");
  }
  const data = String(form.get("data") ?? "");
  const tipo = String(form.get("tipo") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > hojeSP() || !(tipo in TIPOS_EXTRA)) return ir("?erro=extra");
  const { error } = await db.from("treinos_extras").insert({ user_id: user.id, data, tipo });
  if (error) {
    console.error("treino extra", error);
    return ir("?erro=extra");
  }
  return ir("?extra=ok");
}
