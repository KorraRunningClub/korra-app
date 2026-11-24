import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase.from("notificacoes");
  const id = String(form.get("id") ?? "");
  const acao = String(form.get("acao") ?? "");
  if (acao === "todas") await db.update({ lida: true }).eq("lida", false);
  else if (acao === "ler") await db.update({ lida: true }).eq("id", id);
  else if (acao === "apagar") await db.delete().eq("id", id);
  return NextResponse.redirect(new URL("/treinador/mensagens", request.url), { status: 303 });
}
