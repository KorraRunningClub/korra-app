import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";

// Liga o arquivo enviado à despesa (e apaga o comprovante antigo, se houver).
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.json({ erro: "permissao" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as { id?: string; caminho?: string } | null;
  if (!corpo?.id || !corpo.caminho || !corpo.caminho.startsWith(`${corpo.id}/`)) return NextResponse.json({ erro: "dados" }, { status: 400 });
  const db = sessao.supabase;
  const { data: antes } = await db.from("despesas").select("comprovante").eq("id", corpo.id).single();
  const { error } = await db.from("despesas").update({ comprovante: corpo.caminho }).eq("id", corpo.id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (antes?.comprovante) await createAdmin().storage.from("comprovantes").remove([antes.comprovante]).catch(() => {});
  return NextResponse.json({ ok: true });
}
